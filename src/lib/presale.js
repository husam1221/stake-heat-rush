export const PRESALE_ADDRESS = "0xF2d113dFe3615e8Bf26D87275Efa192d9BbFd0DF";

export const PRESALE_ABI = [
  {
    "inputs": [],
    "name": "buy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs":[{"internalType":"address","name":"user","type":"address"}],
    "name":"claimableHR",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  }
];
