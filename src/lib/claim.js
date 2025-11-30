export const CLAIM_ADDRESS = "0xA61C387C03594E77f10e6A58BDA2cC09Ba2bdD0e";

export const CLAIM_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "totalAllocation", "type": "uint256" },
      { "internalType": "bytes32[]", "name": "proof", "type": "bytes32[]" }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "totalAllocation", "type": "uint256" }
    ],
    "name": "claimableAmount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "totalAllocation", "type": "uint256" }
    ],
    "name": "unlockedAmount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractBalance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
