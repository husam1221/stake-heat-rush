import React, { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { BASE_CHAIN_ID, STAKING_CONTRACT_ADDRESS } from "../../lib/constants.js";

const StakeSection = ({ showToast }) => {
  const { address, isConnected } = useAccount();

  const { data } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
    watch: true,
  });

  const userBalance = data?.formatted
    ? Number(data.formatted).toFixed(6)
    : "0.0000";

  const { sendTransactionAsync } = useSendTransaction();

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMax = () => {
    const bal = parseFloat(userBalance);
    if (!isNaN(bal) && bal > 0) {
      setAmount(bal.toFixed(4));
    } else {
      showToast("info", "No ETH balance available on Base.");
    }
  };

  const handleStake = async () => {
    if (!isConnected) {
      showToast("error", "Please connect your wallet first.");
      return;
    }

    const ethValue = Number(amount);
    if (!ethValue || ethValue <= 0) {
      showToast("error", "Enter a valid ETH amount.");
      return;
    }

    try {
      setIsLoading(true);

      const tx = await sendTransactionAsync({
        to: STAKING_CONTRACT_ADDRESS,
        value: parseEther(amount),
      });

      setIsLoading(false);
      setAmount("");

      showToast("success", "Transaction sent successfully!");
      window.open(`https://basescan.org/tx/${tx}`, "_blank");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      showToast("error", error.shortMessage || error.message);
    }
  };

  return (
    <div className="card card-main">
      <a href="https://heatrush.xyz">
        <img src="/logo.PNG" className="logo" alt="HeatRush Logo" />
      </a>

      <div className="header-row">
        <div className="header-text">
          <h1 className="title center">
            <span className="orange">HeatRush Staking</span>
          </h1>
          <p className="subtitle center">
            <span className="orange">Stake ETH</span> on Base, fuel the treasury,
            and get ready for future $HR rewards .
          </p>
        </div>

        <div className="wallet-connect">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="address"
          />
        </div>
      </div>

      <p className="balance">
        Wallet Balance on Base : <span>{userBalance} ETH</span>
      </p>

      <div className="stake-box">
        <div className="stake-box-header">
          <span className="stake-label">Stake ETH</span>
          <span className="stake-hint">
            Staking is executed directly through HeatRush’s secure blockchain system.
          </span>
        </div>

        <div className="input-row">
          <input
            type="text"
            inputMode="decimal"
            className="input"
            placeholder="Enter ETH amount"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(",", ".");
              const regex = /^[0-9]*\.?[0-9]*$/;
              if (raw === "" || regex.test(raw)) {
                setAmount(raw);
              }
            }}
          />
          <button className="max-btn" onClick={handleMax}>
            MAX
          </button>
        </div>

        <button
          className={`stake-btn ${isLoading ? "loading" : ""}`}
          onClick={handleStake}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Stake ETH"}
        </button>

        <div className="secondary-actions">
          <button
            className="secondary-btn"
            onClick={() =>
              showToast("info", "Claim will be enabled in a future phase.")
            }
          >
            Claim Rewards
          </button>

          <button
            className="secondary-btn"
            onClick={() =>
              showToast("info", "Unstake will be available later.")
            }
          >
            Unstake
          </button>
        </div>

        <p className="stake-footnote">
          Withdrawals will be enabled in upcoming development phases.
        </p>
      </div>
    </div>
  );
};

export default StakeSection;
