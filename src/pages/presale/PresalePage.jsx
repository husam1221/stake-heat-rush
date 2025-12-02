// src/pages/presale/PresalePage.jsx
import React, { useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther, formatUnits } from "viem";

import { BASE_CHAIN_ID, HR_PRICE_USD } from "../../lib/constants.js";
import { PRESALE_ABI, PRESALE_ADDRESS } from "../../lib/presale.js";
import { qualifyReferral } from "../../lib/referralApi.js";
import HrTokenImg from "../../assets/HR_token.png";


import "../../styles/presale.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const PresalePage = ({ showToast }) => {
  const { address, isConnected } = useAccount();

  // ========== WALLET BALANCE ==========
  const { data } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const userBalance = data?.formatted
    ? Number(data.formatted).toFixed(6)
    : "0.0000";

  const { writeContractAsync } = useWriteContract();

  // ========== LOCAL STATE ==========
  const [presaleAmount, setPresaleAmount] = useState("");
  const [ethPriceUsd, setEthPriceUsd] = useState(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [isPresaleLoading, setIsPresaleLoading] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  const userAddr = address || ZERO_ADDRESS;

  // ========== ETH PRICE ==========
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

  // ========== ON-CHAIN PRESALE DATA ==========
  // claimable HR من العقد
  const { data: claimableData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "claimableHR",
    args: [userAddr],
  });

  // إجمالي HR المخصّص للمستخدم من البريسيل
  const { data: totalHrForData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "totalHrFor",
    args: [userAddr],
  });

  // إجمالي HR اللي طالبهم من عقد البريسيل
  const { data: claimedData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "claimed",
    args: [userAddr],
  });

  // إجمالي ETH المساهم فيها بالبريسيل
  const { data: contributionsData } = useReadContract({
    abi: PRESALE_ABI,
    address: PRESALE_ADDRESS,
    functionName: "contributions",
    args: [userAddr],
  });

  // تحويل القيم لأرقام قابلة للعرض
  const claimable =
    claimableData !== undefined ? Number(formatUnits(claimableData, 18)) : 0;

  const totalHrBought = totalHrForData
    ? Number(formatUnits(totalHrForData, 18))
    : 0;

  const claimedHr = claimedData
    ? Number(formatUnits(claimedData, 18))
    : 0;

  const remainingHr = Math.max(totalHrBought - claimedHr, 0);

  const totalEthContributed = contributionsData
    ? Number(formatUnits(contributionsData, 18))
    : 0;
  const claimProgress =
    totalHrBought > 0 ? Math.min(100, (claimedHr / totalHrBought) * 100) : 0;

// ========== BUY PRESALE ==========
const handlePresaleBuy = async () => {
  if (!isConnected) {
    showToast?.("error", "Please connect your wallet first.");
    return;
  }

  const ethValue = Number(presaleAmount);
  if (!ethValue || ethValue <= 0) {
    showToast?.("error", "Enter a valid ETH amount.");
    return;
  }
  if (ethValue < 0.0001) {
    showToast?.("error", "Minimum is 0.0001 ETH.");
    return;
  }
  if (ethValue > 2) {
    showToast?.("error", "Maximum is 2 ETH.");
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
    showToast?.("success", "Purchase successful!");

    // 👇 تأهيل الإحالة عن طريق الـ presale
    try {
      if (address) {
        qualifyReferral(address.toLowerCase(), "presale").catch((err) => {
          console.error("Failed to qualify referral via presale:", err);
        });
      }
    } catch (e) {
      console.error("Local qualifyReferral(presale) error:", e);
    }
  } catch (error) {
    console.error(error);
    showToast?.("error", error.shortMessage || error.message);
  } finally {
    setIsPresaleLoading(false);
  }
};

  // ========== CLAIM HR ==========
const handleClaim = async () => {
  if (!isConnected) {
    showToast?.("error", "Connect your wallet first.");
    return;
  }

  if (!claimable || claimable <= 0) {
    showToast?.("error", "Nothing to claim yet.");
    return;
  }

  try {
    setIsClaimLoading(true);

    await writeContractAsync({
      abi: PRESALE_ABI,
      address: PRESALE_ADDRESS,
      functionName: "claim",
    });

    showToast?.("success", "Claim transaction sent!");
  } catch (err) {
    console.error(err);
    showToast?.("error", err.shortMessage || err.message);
  } finally {
    setIsClaimLoading(false);
  }
};


  // ========== CALCULATIONS FOR ESTIMATE ==========
  const presaleEthValue = parseFloat(presaleAmount) || 0;
  const estimatedUsdValue =
    ethPriceUsd && presaleEthValue > 0 ? presaleEthValue * ethPriceUsd : 0;
  const estimatedHrAmount =
    estimatedUsdValue > 0 ? estimatedUsdValue / HR_PRICE_USD : 0;

    
      return (
<div className="presale-page-3d">
      {/* HERO 3D SECTION */}
      <section className="presale-hero-3d">
        <div className="presale-hero-3d-left">
          <h3 className="presale-title-3d">Public Presale - Buy $HR</h3>
          <p className="presale-subtitle-3d">
            Jump into the presale, lock your HR at a fixed rate, and be early
            to the HeatRush ecosystem before TGE.
          </p>

          <div className="presale-hero-badges">
            <span className="presale-hero-pill">
              🔵 Live on <strong>Base</strong>
            </span>
            <span className="presale-hero-pill">
              🎯 Min <strong>0.0001 ETH</strong> · Max <strong>2.0 ETH</strong> per wallet
            </span>
            <span className="presale-hero-pill">
              ⚡ Instant claim from contract
            </span>
          </div>

          <div className="presale-top-row">
            <p className="presale-top-pill">
              Wallet balance on Base: <span>{userBalance} ETH</span>
            </p>

            <div className="presale-price-row">
              {isPriceLoading && <span>Loading ETH price...</span>}
              {!isPriceLoading && ethPriceUsd && (
                <span className="presale-price-ok">
                  Live ETH price ≈ <strong>${ethPriceUsd.toFixed(2)}</strong>
                </span>
              )}
              {priceError && <span>{priceError}</span>}
            </div>
          </div>
        </div>

        <div className="presale-hero-3d-right">
          <div className="presale-token-orbit">
            <div className="presale-token-orbit-ring" />
            <div className="presale-token-orbit-glow" />
            <img
              src={HrTokenImg}
              alt="HeatRush HR token"
              className="presale-token-orbit-img"
            />
          </div>

          <div className="presale-rate-box-3d">
            <span className="presale-rate-label">Presale Rate</span>
            <span className="presale-rate-value">1 ETH = 100,000 HR</span>
            <span className="presale-rate-tag">
              Fixed forever during this phase
            </span>
          </div>
        </div>
      </section>

      {/* MAIN 3D GRID */}
      <section className="presale-main-3d">
        {/* LEFT 3D CARD – BUY */}
        <div className="presale-3d-card presale-3d-left">
          <h4 className="presale-3d-title">Contribute to the presale</h4>
          <p className="presale-3d-sub">
            Choose how much ETH you want to contribute. You can stack multiple
            buys up to the 2 ETH cap.
          </p>

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
                <span className="presale-summary-label">Estimated Value</span>
                <span className="presale-summary-value">
                  {estimatedUsdValue > 0
                    ? `$${estimatedUsdValue.toFixed(2)}`
                    : "—"}{" "}
                  USDT
                </span>
              </div>

              <div className="presale-summary-item">
                <span className="presale-summary-label">You Receive</span>
                <span className="presale-summary-value">
                  {estimatedHrAmount > 0
                    ? estimatedHrAmount.toLocaleString("en-US")
                    : "—"}{" "}
                  HR
                </span>
              </div>
            </div>
          </div>

          <div className="presale-actions">
            {/* نفس زر الشراء، ما لمست المنطق */}
            <button
              className={`stake-btn presale-btn ${
                isPresaleLoading ? "loading" : ""
              }`}
              onClick={handlePresaleBuy}
              disabled={isPresaleLoading}
            >
              {isPresaleLoading ? "Processing..." : "Buy HR"}
            </button>

            <p className="presale-mini-note">
              Small contributions are fine – you can always come back and add more
              up to the 2 ETH limit.
            </p>
          </div>
        </div>

        {/* RIGHT 3D CARD – OVERVIEW + CLAIM + WHY JOIN */}
        <div className="presale-3d-card presale-3d-right">
          <h4 className="presale-3d-title">Your position & claim</h4>

          {isConnected ? (
            <>
              <div className="presale-stats-grid">
                <div className="presale-stats-item">
                  <span className="presale-stats-label">Total contributed</span>
                  <span className="presale-stats-value">
                    {totalEthContributed > 0
                      ? `${totalEthContributed.toLocaleString("en-US", {
                          maximumFractionDigits: 6,
                        })} ETH`
                      : "—"}
                  </span>
                </div>

                <div className="presale-stats-item">
                  <span className="presale-stats-label">
                    Total HR allocated
                  </span>
                  <span className="presale-stats-value">
                    {totalHrBought > 0
                      ? `${totalHrBought.toLocaleString("en-US", {
                          maximumFractionDigits: 4,
                        })} HR`
                      : "—"}
                  </span>
                </div>

                <div className="presale-stats-item">
                  <span className="presale-stats-label">Already claimed</span>
                  <span className="presale-stats-value">
                    {claimedHr > 0
                      ? `${claimedHr.toLocaleString("en-US", {
                          maximumFractionDigits: 4,
                        })} HR`
                      : "0 HR"}
                  </span>
                </div>

                <div className="presale-stats-item">
                  <span className="presale-stats-label">Still claimable</span>
                  <span className="presale-stats-value">
                    {remainingHr > 0
                      ? `${remainingHr.toLocaleString("en-US", {
                          maximumFractionDigits: 4,
                        })} HR`
                      : "0 HR"}
                  </span>
                </div>
              </div>

              {totalHrBought > 0 && (
                <div className="presale-progress-row">
                  <div className="presale-progress-bar">
                    <div
                      className="presale-progress-fill"
                      style={{ width: `${claimProgress}%` }}
                    />
                  </div>
                  <span className="presale-progress-label">
                    {claimProgress.toFixed(0)}% of your presale HR already claimed
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="presale-mini-note">
              Connect your wallet on Base to see your presale allocation and claim
              status.
            </p>
          )}

          {/* نفس زر الكليم، ما لمست المنطق */}
          <button
            className={`claim-animated-btn ${
              !claimable || claimable <= 0 ? "locked" : "unlocked"
            }`}
            onClick={() => {
              if (!claimable || claimable <= 0) {
                showToast?.(
                  "error",
                  "You need to buy HR in the presale before you can claim."
                );
                return;
              }
              handleClaim();
            }}
            disabled={!claimable || claimable <= 0 || isClaimLoading}
          >
            <span className="lock-icon">
              {claimable > 0 ? "🚀" : "🔒"}
            </span>
            {claimable > 0
              ? `Claim ${claimable.toLocaleString("en-US")} HR now`
              : "Claim HR"}
          </button>

          <div className="presale-why-card">
            <h4 className="presale-why-title">Why join the presale now?</h4>
            <ul className="presale-why-list">
              <li>✅ Fixed HR price before TGE, no bonding curve.</li>
              <li>✅ Instant claim from contract once you buy.</li>
              <li>✅ Presale participation helps qualify referrals & XP.</li>
              <li>✅ Strong position for future staking & airdrop campaigns.</li>
            </ul>
          </div>
        </div>
      </section>

      <p className="presale-footnote">
        You need to buy HR in the presale before you can claim.
        <br />
        HR tokens are claimable instantly from the presale contract once
        allocated to your wallet.
      </p>
    </div>
  );


};

export default PresalePage;
