export interface TransactionsDataType {
  address: string;
  requests: {
    description: string;
    chainId: number;
    tokenIn: `0x${string}`;
    steps: {
      from: `0x${string}`;
      to: `0x${string}`;
      data: `0x${string}`;
      value: string;
    }[];
    stepsLength: number;
  }[];
  requestsLength: number;
}
