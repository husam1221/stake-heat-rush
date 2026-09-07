import { useEffect, useMemo } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";

import {
  MULTICHAIN_STAKING_READ_ABI,
  MULTICHAIN_ERC20_TOKEN_ABI,
} from "../lib/multichainStaking.js";

function formatAssetAmount(value, decimals, maxFractionDigits = 6) {
  if (value === undefined || value === null) return "0";

  try {
    const formatted = formatUnits(value, decimals);
    const numeric = Number(formatted);

    if (!Number.isFinite(numeric)) return "0";

    return numeric.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    });
  } catch {
    return "0";
  }
}

function formatXp(value) {
  if (value === undefined || value === null) return "0";

  try {
    return Number(value).toLocaleString("en-US");
  } catch {
    return "0";
  }
}

export default function useMultichainStakingAsset(asset) {
  const { address, isConnected } = useAccount();

  const isReady = Boolean(
    asset?.stakingAddress &&
      asset?.chainId &&
      Number.isInteger(asset?.decimals)
  );

  // =========================================================
  // Native balance
  // Used only for native assets such as BNB.
  // =========================================================
  const nativeBalanceQuery = useBalance({
    address,
    chainId: asset?.chainId,
    query: {
      enabled: Boolean(
        isReady &&
          isConnected &&
          address &&
          asset?.native
      ),
    },
  });

  // =========================================================
  // ERC20 balance
  // Used for BTCB / USDT / USDC.
  // Reads balanceOf(address) directly from the token contract.
  // =========================================================
  const erc20BalanceQuery = useReadContract({
    address: asset?.tokenAddress,
    abi: MULTICHAIN_ERC20_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: asset?.chainId,
    query: {
      enabled: Boolean(
        isReady &&
          isConnected &&
          address &&
          !asset?.native &&
          asset?.tokenAddress
      ),
    },
  });

  // =========================================================
  // User stake stored in the new staking contract
  // =========================================================
  const userStakedQuery = useReadContract({
    address: asset?.stakingAddress,
    abi: MULTICHAIN_STAKING_READ_ABI,
    functionName: "userStaked",
    args: address ? [address] : undefined,
    chainId: asset?.chainId,
    query: {
      enabled: Boolean(isReady && isConnected && address),
    },
  });

  // =========================================================
  // User total XP
  // =========================================================
  const totalXpQuery = useReadContract({
    address: asset?.stakingAddress,
    abi: MULTICHAIN_STAKING_READ_ABI,
    functionName: "getTotalXP",
    args: address ? [address] : undefined,
    chainId: asset?.chainId,
    query: {
      enabled: Boolean(isReady && isConnected && address),
    },
  });

  // =========================================================
  // Global total staked
  // =========================================================
  const totalStakedQuery = useReadContract({
    address: asset?.stakingAddress,
    abi: MULTICHAIN_STAKING_READ_ABI,
    functionName: "totalStaked",
    chainId: asset?.chainId,
    query: {
      enabled: isReady,
    },
  });

  // =========================================================
  // Minimum stake
  // =========================================================
  const minStakeQuery = useReadContract({
    address: asset?.stakingAddress,
    abi: MULTICHAIN_STAKING_READ_ABI,
    functionName: "minStake",
    chainId: asset?.chainId,
    query: {
      enabled: isReady,
    },
  });

  // =========================================================
  // Contract pause status
  // =========================================================
  const pausedQuery = useReadContract({
    address: asset?.stakingAddress,
    abi: MULTICHAIN_STAKING_READ_ABI,
    functionName: "paused",
    chainId: asset?.chainId,
    query: {
      enabled: isReady,
    },
  });

  // =========================================================
  // Select the correct wallet-balance source
  // =========================================================
  const walletBalanceRaw = asset?.native
    ? nativeBalanceQuery.data?.value ?? 0n
    : erc20BalanceQuery.data ?? 0n;

  const walletBalanceError = asset?.native
    ? nativeBalanceQuery.error
    : erc20BalanceQuery.error;

  const walletBalanceLoading = asset?.native
    ? nativeBalanceQuery.isLoading
    : erc20BalanceQuery.isLoading;

  // =========================================================
  // DIAGNOSTIC LOGGING
  // Only logs errors. Does not alter any staking logic.
  // =========================================================
  useEffect(() => {
    if (!asset?.id) return;

    const errors = {
      balance: walletBalanceError ?? null,
      userStaked: userStakedQuery.error ?? null,
      totalXp: totalXpQuery.error ?? null,
      totalStaked: totalStakedQuery.error ?? null,
      minStake: minStakeQuery.error ?? null,
      paused: pausedQuery.error ?? null,
    };

    const hasAnyError = Object.values(errors).some(Boolean);

    if (!hasAnyError) return;

    console.group(`[HeatRush Multichain] ${asset.id} READ ERROR`);
    console.log("Asset:", asset);
    console.log("Connected wallet:", address);
    console.log("Chain ID:", asset.chainId);
    console.log("Staking contract:", asset.stakingAddress);
    console.log("Token contract:", asset.tokenAddress);
    console.log("Native asset:", asset.native);

    if (errors.balance) {
      console.error(`[${asset.symbol}] balance error:`, errors.balance);
    }

    if (errors.userStaked) {
      console.error(`[${asset.symbol}] userStaked error:`, errors.userStaked);
    }

    if (errors.totalXp) {
      console.error(`[${asset.symbol}] totalXp error:`, errors.totalXp);
    }

    if (errors.totalStaked) {
      console.error(
        `[${asset.symbol}] totalStaked error:`,
        errors.totalStaked
      );
    }

    if (errors.minStake) {
      console.error(`[${asset.symbol}] minStake error:`, errors.minStake);
    }

    if (errors.paused) {
      console.error(`[${asset.symbol}] paused error:`, errors.paused);
    }

    console.groupEnd();
  }, [
    asset,
    address,
    walletBalanceError,
    userStakedQuery.error,
    totalXpQuery.error,
    totalStakedQuery.error,
    minStakeQuery.error,
    pausedQuery.error,
  ]);

  // =========================================================
  // Refetch everything after staking / approval
  // =========================================================
  const refetch = async () => {
    const requests = [
      userStakedQuery.refetch(),
      totalXpQuery.refetch(),
      totalStakedQuery.refetch(),
      minStakeQuery.refetch(),
      pausedQuery.refetch(),
    ];

    if (asset?.native) {
      requests.push(nativeBalanceQuery.refetch());
    } else {
      requests.push(erc20BalanceQuery.refetch());
    }

    await Promise.all(requests);
  };

  return useMemo(() => {
    const decimals = asset?.decimals ?? 18;

    const userStakedRaw = userStakedQuery.data ?? 0n;
    const totalXpRaw = totalXpQuery.data ?? 0n;
    const totalStakedRaw = totalStakedQuery.data ?? 0n;
    const minStakeRaw = minStakeQuery.data ?? 0n;
    const isPaused = pausedQuery.data === true;

    const isLoading =
      walletBalanceLoading ||
      userStakedQuery.isLoading ||
      totalXpQuery.isLoading ||
      totalStakedQuery.isLoading ||
      minStakeQuery.isLoading ||
      pausedQuery.isLoading;

    const hasError = Boolean(
      walletBalanceError ||
        userStakedQuery.error ||
        totalXpQuery.error ||
        totalStakedQuery.error ||
        minStakeQuery.error ||
        pausedQuery.error
    );

    return {
      asset,
      address,
      isConnected,
      isReady,
      isLoading,
      hasError,
      isPaused,

      status: isPaused ? "PAUSED" : "LIVE",

      walletBalanceRaw,
      userStakedRaw,
      totalXpRaw,
      totalStakedRaw,
      minStakeRaw,

      walletBalance: formatAssetAmount(
        walletBalanceRaw,
        decimals
      ),

      userStaked: formatAssetAmount(
        userStakedRaw,
        decimals
      ),

      totalXp: formatXp(totalXpRaw),

      totalStaked: formatAssetAmount(
        totalStakedRaw,
        decimals
      ),

      minStake: formatAssetAmount(
        minStakeRaw,
        decimals
      ),

      errors: {
        balance: walletBalanceError ?? null,
        userStaked: userStakedQuery.error ?? null,
        totalXp: totalXpQuery.error ?? null,
        totalStaked: totalStakedQuery.error ?? null,
        minStake: minStakeQuery.error ?? null,
        paused: pausedQuery.error ?? null,
      },

      refetch,
    };
  }, [
    asset,
    address,
    isConnected,
    isReady,

    walletBalanceRaw,
    walletBalanceError,
    walletBalanceLoading,

    userStakedQuery.data,
    userStakedQuery.error,
    userStakedQuery.isLoading,

    totalXpQuery.data,
    totalXpQuery.error,
    totalXpQuery.isLoading,

    totalStakedQuery.data,
    totalStakedQuery.error,
    totalStakedQuery.isLoading,

    minStakeQuery.data,
    minStakeQuery.error,
    minStakeQuery.isLoading,

    pausedQuery.data,
    pausedQuery.error,
    pausedQuery.isLoading,
  ]);
}