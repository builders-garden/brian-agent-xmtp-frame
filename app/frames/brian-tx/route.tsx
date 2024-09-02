import { Button } from "frames.js/next";
import { frames } from "../frames";
import { getRedisClient } from "@/lib/redis";
import { TransactionsDataType } from "@/lib/types";

const handleRequest = frames(async (ctx) => {
  const txId = ctx.url.searchParams.get("id");
  const step = parseInt(ctx.url.searchParams.get("step") ?? "0");
  const request = parseInt(ctx.url.searchParams.get("request") ?? "0");

  // If the tx id is not present, throw an error
  if (!txId) {
    throw new Error("Invalid txId");
  }

  // Getting the redis client
  const redisClient = getRedisClient();

  // Get the transaction data from the redis database
  const txData: TransactionsDataType | null = await redisClient.get(txId);
  if (!txData) {
    throw new Error("No transaction data found");
  }

  // Get the length of the steps and requests
  const stepsLength = txData.requests[request].stepsLength;
  const requestsLength = txData.requestsLength;

  // Get the description of the request and set the font size based on its length
  const requestDescription = txData.requests[request].description;
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
        target={`/tx?id=${txId}&step=${step}&request=${request}`}
        post_url={
          request === requestsLength - 1 && step === stepsLength - 1
            ? "/tx/success"
            : step === stepsLength - 1
            ? `/brian-tx?id=${txId}&step=0&request=${request + 1}`
            : `/brian-tx?id=${txId}&step=${step + 1}&request=${request}`
        }
      >
        {`Execute transaction ${step + 1}/${stepsLength}`}
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
