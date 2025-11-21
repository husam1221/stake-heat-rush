import React, { useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther } from "viem";

import { BASE_CHAIN_ID, HR_PRICE_USD } from "../../lib/constants.js";
import { PRESALE_ABI, PRESALE_ADDRESS } from "../../lib/presale.js";

const PresaleSection = ({ showToast }) => {
  const { address, isConnected } = useAccount();

  // ========= WALLET BALANCE =========
  const { data } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const userBalance = data?.formatted
    ? Number(data.formatted).toFixed(6)
    : "0.0000";

  // ========= WRITE CONTRACT =========
  const { writeContractAsync } = useWriteContract();

  // ========= PRESALE STATE =========
  const [presaleAmount, setPresaleAmount] = useState("");
  const [ethPriceUsd, setEthPriceUsd] = useState(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [isPresaleLoading, setIsPresaleLoading] = useState(false);

  // ========= CLAIM STATE =========
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  // ========= FETCH ETH PRICE =========
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        setIsPriceLoading(true);
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const json = await res.json();
        setEthPriceUsd(json?.ethereum?.usd || null);
      } catch (err) {
        setPriceError("Failed to load ETH price.");
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchEthPrice();
  }, []);

  // ========= READ CLAIMABLE FROM PRESALE CONTRACT =========
  const { data: claimableData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "claimableHR",
    args: [address || "0x0000000000000000000000000000000000000000"],
    // wagmi v2: نقدر نستخدم query.enabled لو حبيت، بس هيك كمان شغّال
  });

  const claimable =
    claimableData !== undefined ? Number(claimableData) / 1e18 : 0;

  // ========= BUY PRESALE =========
  const handlePresaleBuy = async () => {
    if (!isConnected) {
      showToast("error", "Please connect your wallet first.");
      return;
    }

    const ethValue = Number(presaleAmount);
    if (!ethValue || ethValue <= 0) {
      showToast("error", "Enter a valid ETH amount.");
      return;
    }
    if (ethValue < 0.0001) {
      showToast("error", "Minimum is 0.0001 ETH.");
      return;
    }
    if (ethValue > 2) {
      showToast("error", "Maximum is 2 ETH.");
      return;
    }

    try {
      setIsPresaleLoading(true);

      const tx = await writeContractAsync({
        abi: PRESALE_ABI,
        address: PRESALE_ADDRESS,
        functionName: "buy",
        value: parseEther(presaleAmount),
      });

      setPresaleAmount("");
      showToast("success", "Purchase successful!");
      window.open(`https://basescan.org/tx/${tx}`, "_blank");
    } catch (error) {
      console.error(error);
      showToast("error", error.shortMessage || error.message);
    } finally {
      setIsPresaleLoading(false);
    }
  };

  // ========= CLAIM HR FROM PRESALE CONTRACT =========
  const handleClaim = async () => {
    if (!isConnected) {
      showToast("error", "Connect your wallet first.");
      return;
    }

    if (!claimable || claimable <= 0) {
      showToast("error", "Nothing to claim yet.");
      return;
    }

    try {
      setIsClaimLoading(true);

      const tx = await writeContractAsync({
        abi: PRESALE_ABI,
        address: PRESALE_ADDRESS,
        functionName: "claim",
      });

      showToast("success", "Claim transaction sent!");
      window.open(`https://basescan.org/tx/${tx}`, "_blank");
    } catch (err) {
      console.error(err);
      showToast("error", err.shortMessage || err.message);
    } finally {
      setIsClaimLoading(false);
    }
  };

  // ========= CALCULATIONS =========
  const presaleEthValue = parseFloat(presaleAmount) || 0;
  const estimatedUsdValue =
    ethPriceUsd && presaleEthValue > 0 ? presaleEthValue * ethPriceUsd : 0;
  const estimatedHrAmount =
    estimatedUsdValue > 0 ? estimatedUsdValue / HR_PRICE_USD : 0;

  return (
    <div className="card presale-card">
      <div className="presale-header">
        <div>
          <h3 className="presale-title">Public Presale - Buy $HR</h3>
          <p className="presale-subtitle">
            Contribute ETH and receive HR tokens.
          </p>
        </div>

        <div className="presale-rate-box">
          <span className="presale-rate-label">Presale Rate</span>
          <span className="presale-rate-value">1 ETH = 100,000 HR</span>
        </div>
      </div>

      {/* PRICE ROW */}
      <div className="presale-price-row">
        {isPriceLoading && <span>Loading ETH price...</span>}
        {!isPriceLoading && ethPriceUsd && (
          <span className="presale-price-ok">
            Current ETH ≈ ${ethPriceUsd.toFixed(2)}
          </span>
        )}
        {priceError && <span>{priceError}</span>}
      </div>

      {/* INPUT + SUMMARY */}
      <div className="presale-input-row">
        <div className="presale-input-group">
          <label className="presale-label">Contribution ( ETH )</label>
          <div className="input-row">
            <input
              type="text"
              inputMode="decimal"
              className="input"
              value={presaleAmount}
              onChange={(e) => {
                const raw = e.target.value.replace(",", ".");
                const regex = /^[0-9]*\.?[0-9]*$/;
                if (raw === "" || regex.test(raw)) {
                  setPresaleAmount(raw);
                }
              }}
            />

            <button
              className="max-btn"
              onClick={() => {
                const bal = parseFloat(userBalance);
                if (!bal || isNaN(bal)) return;
                const max = Math.min(bal, 2);
                setPresaleAmount(Number(max.toFixed(4)).toString());
              }}
            >
              MAX
            </button>
          </div>
        </div>

        <div className="presale-summary">
          <div className="presale-summary-item">
            <span className="presale-summary-label">Estimated Value :</span>
            <span className="presale-summary-value">
              {estimatedUsdValue > 0
                ? `$${estimatedUsdValue.toFixed(2)}`
                : "—"}{" "}
              USDT
            </span>
          </div>

          <div className="presale-summary-item">
            <span className="presale-summary-label">You Receive :</span>
            <span className="presale-summary-value">
              {estimatedHrAmount > 0
                ? estimatedHrAmount.toLocaleString("en-US")
                : "—"}{" "}
              HR
            </span>
          </div>
        </div>
      </div>

      {/* BUY BUTTON */}
      <button
        className={`stake-btn presale-btn ${
          isPresaleLoading ? "loading" : ""
        }`}
        onClick={handlePresaleBuy}
        disabled={isPresaleLoading}
      >
        {isPresaleLoading ? "Processing..." : "Buy HR"}
      </button>

      {/* CLAIM BUTTON – مع قفل/فتح حسب claimable */}
      <button
        className={`claim-animated-btn ${
          !claimable || claimable <= 0 ? "locked" : "unlocked"
        }`}
        onClick={() => {
          if (!claimable || claimable <= 0) {
            showToast(
              "error",
              "You need to buy HR in the presale before you can claim."
            );
            return;
          }
          handleClaim();
        }}
        disabled={!claimable || claimable <= 0 || isClaimLoading}
        style={{ marginTop: "18px" }}
      >
       <span className="lock-icon">🔓</span>

        {claimable > 0
          ? `Claim ${claimable.toLocaleString("en-US")} HR`
          : "Claim HR"}
      </button>

      <p className="presale-footnote">
           You need to buy HR in the presale before you can claim.
             <br /><br />
           HR tokens are claimable instantly from the presale contract.
      </p>
    </div>
  );
};

export default PresaleSection;
