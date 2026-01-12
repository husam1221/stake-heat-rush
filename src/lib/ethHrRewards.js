export const ETH_HR_REWARDS_ABI = [
  { type: "function", name: "pendingRewards", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "sync", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "hrPerEthPerDay", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
];
