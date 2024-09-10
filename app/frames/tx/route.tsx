import { Abi } from "viem";
import { frames } from "../frames";
import { erc20Abi } from "./contracts/erc20-abi";
import { transaction } from "frames.js/core";
import { getRedisClient } from "@/lib/redis";
import { TransactionsDataType } from "@/lib/types";

export const POST = frames(async (ctx) => {
  const redisId = ctx.url.searchParams.get("id");
  const step = parseInt(ctx.url.searchParams.get("step") ?? "0");
  const request = parseInt(ctx.url.searchParams.get("request") ?? "0");

  // If the tx id is not present, throw an error
  if (!redisId) {
    throw new Error("Invalid redis ID");
  }

  // Getting the redis client
  const redisClient = getRedisClient();

  // Get the transaction data from the redis database
  // If no data is found, throw an error
  const txData: TransactionsDataType | null = await redisClient.get(redisId);
  console.log("txData: ", txData);
  if (!txData) {
    throw new Error("No transaction data found");
  }

  // Get the current step and request from the transaction data
  const currentRequest = txData.requests[request];
  const currentStep = currentRequest.steps[step];
  // Return the transaction frame
  return transaction({
    chainId: `eip155:${currentRequest.chainId}`, // Base Mainnet is 8453 chain id
    method: "eth_sendTransaction",
    params: {
      abi: erc20Abi as Abi,
      to: currentStep.to,
      data: currentStep.data,
      value: currentStep.value.toString(),
    },
  });
});
