import React from "react";
import { useAccount } from "wagmi";
import { useAirdrop } from "../../hooks/useAirdrop.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { TGE_TIMESTAMP } from "../../lib/constants.js";

// Helper to safely format numbers
const safeFormat = (num) =>
  typeof num === "number" && !isNaN(num)
    ? num.toLocaleString("en-US")
    : "0";

const AirdropSection = () => {
  const { address, isConnected } = useAccount();
  const { airdrop, airdropLoading, airdropError } = useAirdrop(address);
  const countdown = useCountdown(TGE_TIMESTAMP);

  // Safe values
  const points = safeFormat(airdrop?.points);
  const hrBase = safeFormat(airdrop?.hr_base);
  const requiredStake = airdrop?.required_stake_eth ?? 0;

  const isEligible =
    airdrop &&
    !airdropError &&
    typeof airdrop.hr_base === "number" &&
    airdrop.hr_base > 0;

  return (
    <>
      <div className="airdrop-box">

        {/* Wallet not connected */}
        {!isConnected && (
          <p className="airdrop-msg neutral">
            🔍 Connect your wallet to check your exclusive HR allocation.
          </p>
        )}

        {/* Loading */}
        {isConnected && airdropLoading && (
          <p className="airdrop-msg loading">⏳ Fetching your allocation...</p>
        )}

        {/* API error */}
        {isConnected && !airdropLoading && airdropError && (
          <p className="airdrop-msg error">
            ⚠️ Unable to load your allocation. Please try again later.
          </p>
        )}

        {/* Not eligible */}
        {isConnected &&
          !airdropLoading &&
          !airdropError &&
          (!airdrop || airdrop.hr_base <= 0) && (
            <p className="airdrop-msg error">
              ❌ You are not eligible for the $HR airdrop.
            </p>
        )}

        {/* Global message */}
        {isConnected && (
          <p className="airdrop-msg hint">
            🔥 More campaigns, rewards, and special allocations are coming.
            Stay active inside the HeatRush ecosystem!
          </p>
        )}

        {/* AIRDROP CARD */}
        {isConnected && (
          <div className="card airdrop-card">
            <h3 className="airdrop-title">Your HeatRush Airdrop</h3>

            {airdropLoading && (
              <p className="airdrop-loading">Loading your allocation...</p>
            )}

            {airdropError && (
              <p className="airdrop-error">{String(airdropError)}</p>
            )}

            {!airdropLoading && !airdropError && airdrop && (
              <>
                <div className="airdrop-main-row">
                  
                  <div className="airdrop-main-item">
                    <span className="airdrop-label">Points Snapshot</span>
                    <span className="airdrop-value">{points}</span>
                  </div>

                  <div className="airdrop-main-item">
                    <span className="airdrop-label">Base Allocation</span>
                    <span className="airdrop-value orange">
                      {hrBase} HR
                    </span>
                  </div>

                  <div className="airdrop-main-item">
                    <span className="airdrop-label">Min Stake Required</span>
                    <span className="airdrop-value">
                      {requiredStake} ETH
                    </span>
                  </div>

                </div>

                <p className="airdrop-note">
                  This snapshot is based on your HeatRush points from the
                  previous campaign. Staking more ETH unlocks higher bonus tiers
                  and faster HR unlock.
                </p>

                <div className="airdrop-tiers-grid">
                  {airdrop?.tiers?.length > 0 &&
                    airdrop.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className={
                          tier.id === "diamond"
                            ? "airdrop-tier-card tier-diamond"
                            : "airdrop-tier-card"
                        }
                      >
                        <div className="tier-header">
                          <span className="tier-name">{tier.name}</span>
                          <span className="tier-min">
                            ≥ {tier.minStakeEth} ETH
                          </span>
                        </div>

                        <div className="tier-bonus">
                          +{tier.bonusPercent}% HR bonus
                        </div>

                        {tier.instantUnlock && (
                          <div className="tier-tag">🔓 100% unlock at TGE</div>
                        )}

                        <p className="tier-desc">{tier.description}</p>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

{/* HR UNLOCK CARD */}
{isConnected && !airdropLoading && !airdropError && isEligible && (
  <div className="claim-card">
    <h3 className="claim-title">🔓 $HR Unlock Schedule</h3>

    <div className="claim-row">
      <span>Total Allocation:</span>
      <strong>{hrBase} HR</strong>
    </div>

    <div className="claim-box">
      <p className="claim-note">
        Your HR unlocks gradually:
        <br />• <strong>60%</strong> over the first 3 months
        <br />• <strong>40%</strong> over the next 6 months
      </p>
    </div>

<button
  className="twitter-share-btn"
  onClick={() => {
    const tweetText = encodeURIComponent(
      `Are you eligible for the $HR Airdrop ? 🔥

Great news Your personalized airdrop allocation is now live  
Check your rewards, unlock schedule, and full breakdown instantly .

🔓 60% unlock in the first 3 months  
🔓 40% unlock over the next 6 months  

Don’t miss your chance - verify your eligibility now 👇  
https://stake.heatrush.xyz

#HeatRush #Airdrop #Base #Crypto #HR #Web3
`
    );

    const tweetUrl = `https://x.com/intent/tweet?text=${tweetText}`;
    window.open(tweetUrl, "_blank");
  }}
>
  
  Share on X
</button>


         <button
  className="stake-btn disabled-btn"
  disabled
  style={{ opacity: 0.5, cursor: "not-allowed" }}
>
  Claim (Soon)
</button>

        </div>
      )}
    </>
  );
};

export default AirdropSection;
