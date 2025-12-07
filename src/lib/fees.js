// src/lib/fees.js

// ABI مبسّط لعقد HeatRushFeeDistributor – بنحتاج بس هالدوال للواجهة
export const FEE_DISTRIBUTOR_ABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "pendingRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // اختيارية: لو حاب نعرض مجموع الستيك اللي بنوزع عليه الرسوم
  {
    inputs: [],
    name: "totalStakedEth",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
