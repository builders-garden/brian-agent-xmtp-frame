import { Button } from "frames.js/next";
import { frames } from "../frames";
import { getRedisClient } from "@/lib/redis";
import { TransactionsDataType } from "@/lib/types";
import { getPublicClient } from "@/lib/utils";

const handleRequest = frames(async (ctx) => {
  const redisId = ctx.url.searchParams.get("id");
  const step = parseInt(ctx.url.searchParams.get("step") ?? "0");
  const request = parseInt(ctx.url.searchParams.get("request") ?? "0");
  const end = ctx.url.searchParams.get("end");
  const txId =
    ctx.message?.transactionId ||
    (ctx.url.searchParams.get("txId") as `0x${string}`);

  // If the redis id is not present, throw an error
  if (!redisId) {
    throw new Error("redisId is required");
  }

  // Getting the redis client
  const redisClient = getRedisClient();

  // Get the transaction data from the redis database
  const txData: TransactionsDataType | null = await redisClient.get(redisId);
  if (!txData) {
    throw new Error("No transaction data found");
  }

  // Get the length of the requests
  const requestsLength = txData.requestsLength;

  if (txId) {
    // Get the chain id where the transaction was actually made
    const chainId =
      step === 0 && request > 0
        ? txData.requests[request - 1].chainId
        : txData.requests[request].chainId;

    try {
      const publicClient = getPublicClient(chainId.toString());
      const transaction = await publicClient.getTransactionReceipt({
        hash: txId,
      });
      if (transaction.status === "reverted") {
        return {
          title: "Transaction Reverted",
          image: (
            <div
              tw="flex w-full h-full"
              style={{
                backgroundImage: `url("${process.env.NEXT_PUBLIC_BASE_URL}/images/request.png")`,
              }}
            >
              <div tw="flex text-white px-18 py-32">
                Your transaction reverted, please try again!
              </div>
            </div>
          ),
          buttons: [
            <Button
              key="0"
              action="post"
              // if step is 0 and request > 0, go back to the previous request, otherwise go back to the previous step
              target={
                step === 0 && request > 0
                  ? `/brian-tx?id=${redisId}&step=${
                      txData.requests[request - 1].stepsLength - 1
                    }&request=${request - 1}`
                  : `/brian-tx?id=${redisId}&step=${
                      step - 1
                    }&request=${request}`
              }
            >
              Try again
            </Button>,
          ],
        };
      } else if (transaction.status === "success" && end === "true") {
        return {
          title: "All completed",
          image: `${process.env.NEXT_PUBLIC_BASE_URL}/images/all-completed.png`,
          buttons: [
            <Button key="0" action="link" target="https://www.brianknows.org/">
              Learn more about Brian
            </Button>,
          ],
        };
      }
    } catch (error) {
      // If the transaction is not found yet, show the transaction waiting screen
      return {
        title: "Transaction Waiting",
        image: (
          <div
            tw="flex w-full h-full"
            style={{
              backgroundImage: `url("${process.env.NEXT_PUBLIC_BASE_URL}/images/request.png")`,
            }}
          >
            <div tw="flex text-white px-18 py-32">
              Waiting for your transaction to go through...
            </div>
          </div>
        ),
        buttons: [
          <Button
            key="0"
            action="post"
            // if step is 0 and request > 0, go back to the previous request, otherwise go back to the previous step
            target={
              step === 0 && request > 0
                ? `/brian-tx?id=${redisId}&step=${
                    txData.requests[request - 1].stepsLength - 1
                  }&request=${request - 1}`
                : `/brian-tx?id=${redisId}&step=${step - 1}&request=${request}`
            }
          >
            Go back
          </Button>,
          <Button
            key="1"
            action="post"
            target={`/brian-tx?id=${redisId}&step=${step}&request=${request}&txId=${txId}&end=${end}`}
          >
            Refresh
          </Button>,
        ],
      };
    }
  }

  // Get the current request from the transaction data and the length of the steps
  const currentRequest = txData.requests[request];
  const stepsLength = currentRequest.stepsLength;

  // Get the description of the request and set the font size based on its length
  const requestDescription = currentRequest.description;
  const fontSize = requestDescription.length > 180 ? "29px" : "37px";

  return {
    title: "Request manager",
    image: (
      <div
        tw="flex w-full h-full"
        style={{
          backgroundImage: `url("${process.env.NEXT_PUBLIC_BASE_URL}/images/request.png")`,
        }}
      >
        <div tw="flex text-white px-18 py-32" style={{ fontSize }}>
          {requestDescription}
        </div>
      </div>
    ),
    buttons: [
      <Button
        action="tx"
        target={`/tx?id=${redisId}&step=${step}&request=${request}`}
        post_url={
          request < requestsLength - 1 && step === stepsLength - 1
            ? `/brian-tx?id=${redisId}&step=0&request=${request + 1}&end=false`
            : `/brian-tx?id=${redisId}&step=${
                step + 1
              }&request=${request}&end=${
                request === requestsLength - 1 && step === stepsLength - 1
              }`
        }
      >
        {`Execute transaction ${step + 1}/${stepsLength}`}
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
