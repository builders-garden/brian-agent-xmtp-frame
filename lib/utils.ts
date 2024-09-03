import { createPublicClient, http } from "viem";
import { mainnet, base, optimism } from "viem/chains";

/**
 * Gets a public client to interact with the blockchain
 * @param chainId - The chain id to get the client for
 * @returns A viem public client
 */
export const getPublicClient = (chainId: string) => {
  const chain =
    chainId === "8453" ? base : chainId === "10" ? optimism : mainnet;
  return createPublicClient({
    chain: chain,
    transport: http(),
  });
};
