// src/lib/multichainStaking.js
//
// HeatRush Multi-Chain Staking definitions.
// This file is intentionally separate from the legacy ETH / HR staking files
// so the existing site logic keeps using its current contracts unchanged.

import {
  BASE_CHAIN_ID,
  BSC_CHAIN_ID,
  USDC_BASE_STAKING_CONTRACT_ADDRESS,
  BNB_BSC_STAKING_CONTRACT_ADDRESS,
  BTCB_BSC_STAKING_CONTRACT_ADDRESS,
  USDT_BSC_STAKING_CONTRACT_ADDRESS,
  USDC_BSC_STAKING_CONTRACT_ADDRESS,
  USDC_BASE_TOKEN_ADDRESS,
  BTCB_BSC_TOKEN_ADDRESS,
  USDT_BSC_TOKEN_ADDRESS,
  USDC_BSC_TOKEN_ADDRESS,
} from "./constants.js";

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000";

// Shared read functions implemented by all five new staking contracts.
export const MULTICHAIN_STAKING_READ_ABI = [
  {
    type: "function",
    name: "getAllStakers",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "totalStaked",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalDepositedLifetime",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalStakeTransactions",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalUsers",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "userStaked",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "userTotalDeposited",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "userStakeCount",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "stakingXP",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "referralXP",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTotalXP",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "level",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "referredBy",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "minStake",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxStake",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "assetName",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "assetSymbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "assetAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "assetDecimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "chainId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "getGlobalStats",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "currentTotalStaked", type: "uint256" },
      { name: "lifetimeDeposited", type: "uint256" },
      { name: "stakeTransactions", type: "uint256" },
      { name: "uniqueUsers", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getUserInfo",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "currentStake", type: "uint256" },
      { name: "lifetimeDeposited", type: "uint256" },
      { name: "stakeTransactions", type: "uint256" },
      { name: "firstStakeTimestamp", type: "uint256" },
      { name: "lastStakeTimestamp", type: "uint256" },
      { name: "stakingXp", type: "uint256" },
      { name: "referralXp", type: "uint256" },
      { name: "totalXp", type: "uint256" },
      { name: "referrer", type: "address" },
      { name: "referrals", type: "uint256" },
      { name: "referredVolume", type: "uint256" },
      { name: "currentLevel", type: "uint8" },
    ],
  },
];

// BNB contract: stake(address ref) payable.
export const MULTICHAIN_NATIVE_STAKING_ABI = [
  ...MULTICHAIN_STAKING_READ_ABI,
  {
    type: "function",
    name: "stake",
    stateMutability: "payable",
    inputs: [{ name: "ref", type: "address" }],
    outputs: [],
  },
];

// BTCB / USDT / USDC contracts:
// stake(address ref, uint256 amount)
export const MULTICHAIN_ERC20_STAKING_ABI = [
  ...MULTICHAIN_STAKING_READ_ABI,
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ref", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
];

// Minimal ERC20 ABI for balance / allowance / approve.
export const MULTICHAIN_ERC20_TOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
];

// Only the five NEW staking assets live here.
// Legacy ETH and HR remain controlled by their existing files and contracts.
export const MULTICHAIN_STAKING_ASSETS = [
  {
    id: "usdc-base",
    symbol: "USDC",
    name: "USD Coin",
    network: "Base",
    chainId: BASE_CHAIN_ID,
    stakingAddress: USDC_BASE_STAKING_CONTRACT_ADDRESS,
    tokenAddress: USDC_BASE_TOKEN_ADDRESS,
    decimals: 6,
    native: false,
    assetLogo: "/usdclogo.png",
    networkLogo: "/baselogo.png",
    rewardHeadline: "STAKE & EARN HR",
    rewardText:
      "Stake USDC on Base, build XP, and qualify for the upcoming HR Rewards Program.",
  },
  {
    id: "bnb-bsc",
    symbol: "BNB",
    name: "BNB",
    network: "BNB Chain",
    chainId: BSC_CHAIN_ID,
    stakingAddress: BNB_BSC_STAKING_CONTRACT_ADDRESS,
    tokenAddress: ZERO_ADDRESS,
    decimals: 18,
    native: true,
    assetLogo: "/smartchainlogo.png",
    networkLogo: "/smartchainlogo.png",
    rewardHeadline: "STAKE & EARN HR",
    rewardText:
      "Put your BNB to work, build XP, and qualify for the upcoming HR Rewards Program.",
  },
  {
    id: "btcb-bsc",
    symbol: "BTCB",
    name: "Bitcoin BEP20",
    network: "BNB Chain",
    chainId: BSC_CHAIN_ID,
    stakingAddress: BTCB_BSC_STAKING_CONTRACT_ADDRESS,
    tokenAddress: BTCB_BSC_TOKEN_ADDRESS,
    decimals: 18,
    native: false,
    assetLogo: "/btclogo.png",
    networkLogo: "/smartchainlogo.png",
    rewardHeadline: "STAKE & EARN HR",
    rewardText:
      "Stake BTCB, build XP, and qualify for the upcoming HR Rewards Program.",
  },
  {
    id: "usdt-bsc",
    symbol: "USDT",
    name: "Binance-Peg Tether USD",
    network: "BNB Chain",
    chainId: BSC_CHAIN_ID,
    stakingAddress: USDT_BSC_STAKING_CONTRACT_ADDRESS,
    tokenAddress: USDT_BSC_TOKEN_ADDRESS,
    decimals: 18,
    native: false,
    assetLogo: "/bitcoinLogo.png",
    networkLogo: "/smartchainlogo.png",
    rewardHeadline: "STAKE & EARN HR",
    rewardText:
      "Stake USDT, build XP, and qualify for the upcoming HR Rewards Program.",
  },
  {
    id: "usdc-bsc",
    symbol: "USDC",
    name: "Binance-Peg USD Coin",
    network: "BNB Chain",
    chainId: BSC_CHAIN_ID,
    stakingAddress: USDC_BSC_STAKING_CONTRACT_ADDRESS,
    tokenAddress: USDC_BSC_TOKEN_ADDRESS,
    decimals: 18,
    native: false,
    assetLogo: "/usdclogo.png",
    networkLogo: "/smartchainlogo.png",
    rewardHeadline: "STAKE & EARN HR",
    rewardText:
      "Stake USDC on BNB Chain, build XP, and qualify for the upcoming HR Rewards Program.",
  },
];

export function getMultichainStakingAsset(assetId) {
  return (
    MULTICHAIN_STAKING_ASSETS.find((asset) => asset.id === assetId) || null
  );
}