import { Button } from "frames.js/next";
import { frames } from "../frames";
import { getRedisClient } from "@/lib/redis";
import { TransactionsDataType } from "@/lib/types";
import { getPublicClient } from "@/lib/utils";
import { formatUnits } from "viem";
import { nativeAddress } from "@/lib/const";

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

    // Get the action of the request where the transaction was actually made
    const action =
      step === 0 && request > 0
        ? txData.requests[request - 1].action
        : txData.requests[request].action;

    try {
      const publicClient = getPublicClient(chainId.toString());
      const transaction = await publicClient.getTransactionReceipt({
        hash: txId,
      });
      // If the transaction is reverted, show the transaction reverted frame with the option to try again
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
      }
      // If the transaction is successful and the end is true, show the all completed frame
      else if (transaction.status === "success" && end === "true") {
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
      // If the transaction is successful, the action is ENS Registration and the step is 0
      // Get the timestamp from the block and check if the transaction was made more than 1 minute and 15 seconds ago
      // Otherwise, show the transaction waiting frame again by throwing an error
      else if (
        transaction.status === "success" &&
        action === "ENS Registration" &&
        step - 1 === 0 // This is the first step of the ENS Registration
      ) {
        const block = await publicClient.getBlock({
          blockNumber: transaction.blockNumber,
        });

        // Convert Date.now() to bigint and perform the subtraction
        // block.timestamp is in seconds, so multiply it by 1000 to convert it to milliseconds
        const timeDifference =
          BigInt(Date.now()) - block.timestamp * BigInt(1000);

        if (timeDifference < BigInt(75000)) {
          throw new Error(
            "The transaction must wait for 1 minute and 15 seconds because it's the ENS Registration's first step"
          );
        }
      }
    } catch (error) {
      // If the transaction is not found yet, show the transaction waiting frame
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

  // Get the tokenIn, the tokenAmount, the tokenSymbol and the action from the current request
  const tokenIn = currentRequest.tokenIn;
  const tokenAmount = formatUnits(
    BigInt(currentRequest.tokenAmount),
    currentRequest.tokenDecimals
  );
  const tokenSymbol = currentRequest.tokenSymbol;
  const action = txData.requests[request].action;

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
          {tokenIn !== nativeAddress &&
          step === 0 &&
          stepsLength > 1 &&
          parseFloat(tokenAmount) > 0
            ? `You are about to approve the spending of ${tokenAmount} ${tokenSymbol} for your ${action} request`
            : requestDescription}
        </div>
      </div>
    ),
    buttons: [
      <Button
        action="tx"
        target={`/tx?id=${redisId}&step=${step}&request=${request}`}
        // The end is true if the request is the last one and the step is the last one
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
