// src/hooks/usePresaleInfo.js
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { PRESALE_ABI, PRESALE_ADDRESS } from "../lib/presale.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const toHR = (value) =>
  Number(formatUnits((value ?? 0n), 18)); // HR / 18 decimals

const toETH = (value) =>
  Number(formatUnits((value ?? 0n), 18)); // ETH / 18 decimals

export function usePresaleInfo(address) {
  const user = address || ZERO_ADDRESS;

  const base = {
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
  };

  // ==== USER-LEVEL DATA ====

  const {
    data: claimableData,
    isLoading: l1,
    error: e1,
  } = useReadContract({
    ...base,
    functionName: "claimableHR",
    args: [user],
  });

  const {
    data: totalHrForData,
    isLoading: l2,
    error: e2,
  } = useReadContract({
    ...base,
    functionName: "totalHrFor",
    args: [user],
  });

  const {
    data: claimedData,
    isLoading: l3,
    error: e3,
  } = useReadContract({
    ...base,
    functionName: "claimed",
    args: [user],
  });

  const {
    data: contributionData,
    isLoading: l4,
    error: e4,
  } = useReadContract({
    ...base,
    functionName: "contributions",
    args: [user],
  });

  // ==== GLOBAL DATA ====

  const {
    data: rateData,
    isLoading: l5,
    error: e5,
  } = useReadContract({
    ...base,
    functionName: "RATE",
  });

  const {
    data: totalRaisedData,
    isLoading: l6,
    error: e6,
  } = useReadContract({
    ...base,
    functionName: "totalRaised",
  });

  const {
    data: hardCapData,
    isLoading: l7,
    error: e7,
  } = useReadContract({
    ...base,
    functionName: "HARD_CAP",
  });

  const {
    data: distributionCapData,
    isLoading: l8,
    error: e8,
  } = useReadContract({
    ...base,
    functionName: "DISTRIBUTION_CAP",
  });

  const {
    data: totalHrAllocatedData,
    isLoading: l9,
    error: e9,
  } = useReadContract({
    ...base,
    functionName: "totalHrAllocated",
  });

  const {
    data: saleActiveData,
    isLoading: l10,
    error: e10,
  } = useReadContract({
    ...base,
    functionName: "saleActive",
  });

  const {
    data: claimEnabledData,
    isLoading: l11,
    error: e11,
  } = useReadContract({
    ...base,
    functionName: "claimEnabled",
  });

  // ==== AGGREGATED STATE ====

  const isLoading =
    l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11;

  const error = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8 || e9 || e10 || e11;

  const claimableHR = toHR(claimableData);
  const totalHR = toHR(totalHrForData);
  const claimedHR = toHR(claimedData);
  const contributionETH = toETH(contributionData);

  const rateHRPerETH = Number(rateData ?? 0n);

  const totalRaisedETH = toETH(totalRaisedData);
  const hardCapETH = toETH(hardCapData);

  const distributionCapHR = toHR(distributionCapData);
  const totalHrAllocatedHR = toHR(totalHrAllocatedData);

  const saleActive = Boolean(saleActiveData);
  const claimEnabled = Boolean(claimEnabledData);

  const participated =
    contributionETH > 0 || totalHR > 0 || claimedHR > 0 || claimableHR > 0;

  const presaleProgressPercent =
    hardCapETH > 0
      ? Math.min(100, (totalRaisedETH / hardCapETH) * 100)
      : 0;

  const hrDistributionPercent =
    distributionCapHR > 0
      ? Math.min(100, (totalHrAllocatedHR / distributionCapHR) * 100)
      : 0;

  return {
    isLoading,
    error,

    // user-level
    claimableHR,
    totalHR,
    claimedHR,
    contributionETH,
    participated,

    // global
    rateHRPerETH,
    totalRaisedETH,
    hardCapETH,
    distributionCapHR,
    totalHrAllocatedHR,
    presaleProgressPercent,
    hrDistributionPercent,
    saleActive,
    claimEnabled,
  };
}
