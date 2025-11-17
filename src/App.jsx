// App.jsx — Final Mobile-Compatible Version
// ===================================================
// Imports
// ===================================================
import React, { useState, useEffect } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useSendTransaction
} from "wagmi";

import { parseEther } from "viem";

// ===================================================
// Utility
// ===================================================
const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

// ===================================================
// App Component
// ===================================================
const App = () => {
  const { address, isConnected } = useAccount();

  // Send transaction hooks
  const { sendTransactionAsync } = useSendTransaction();
  const { sendTransactionAsync: sendPresaleTx } = useSendTransaction();

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { data } = useBalance({
    address,
    chainId: 8453,
    watch: true,
  });

  const userBalance = data?.formatted
    ? Number(data.formatted).toFixed(4)
    : "0.0000";

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleMax = () => {
    const bal = parseFloat(userBalance);
    if (!isNaN(bal) && bal > 0) {
      setAmount(bal.toFixed(4));
    } else {
      showToast("info", "No ETH balance available on Base.");
    }
  };

  // ===================================================
  // Referral Logic
  // ===================================================
  const [refWallet, setRefWallet] = useState("");
  const [refResult, setRefResult] = useState(null);

  const generateReferral = () => {
    if (!refWallet || !refWallet.startsWith("0x") || refWallet.length < 40) {
      setRefResult({ error: "Please enter a valid wallet address starting with 0x" });
      return;
    }
    const code = btoa(refWallet.substring(0, 10)).slice(0, 8);
    const link = `${window.location.origin}?ref=${code}`;
    setRefResult({ code, link });
  };

  const copyReferral = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert("Referral link copied!"))
      .catch(() => alert("Failed to copy link"));
  };

  const shareOnX = (link) => {
    const message = encodeURIComponent(
      `🔥 Join HeatRush! Earn rewards by staking ETH.\nUse my referral link:\n${link}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${message}`, "_blank");
  };

  // ===================================================
  // 🔥 NEW: Mobile-Compatible Staking Transaction
  // ===================================================
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
        to: "0xf1417c94d4827ea5f59c3ccd4884e44af5d099e1",
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

  // ===================================================
  // FAQ
  // ===================================================
  const [openFAQ, setOpenFAQ] = useState(null);
  const toggleFAQ = (id) => setOpenFAQ(openFAQ === id ? null : id);

  // ===================================================
  // Presale Logic
  // ===================================================
  const HR_PRICE_USD = 0.03;
  const [presaleAmount, setPresaleAmount] = useState("");
  const [ethPriceUsd, setEthPriceUsd] = useState(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [isPresaleLoading, setIsPresaleLoading] = useState(false);

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

  const presaleEthValue = parseFloat(presaleAmount) || 0;
  const estimatedUsdValue =
    ethPriceUsd && presaleEthValue > 0 ? presaleEthValue * ethPriceUsd : 0;
  const estimatedHrAmount =
    estimatedUsdValue > 0 ? estimatedUsdValue / HR_PRICE_USD : 0;

  // ===================================================
  // 🔥 NEW: Mobile-Compatible Presale Transaction
  // ===================================================
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
    if (ethValue < 0.0005) {
      showToast("error", "Minimum is 0.0005 ETH.");
      return;
    }
    if (ethValue > 2) {
      showToast("error", "Maximum is 2 ETH.");
      return;
    }

    try {
      setIsPresaleLoading(true);

      const tx = await sendPresaleTx({
        to: "0xfa88a8b57ea390e6ed846f907484501a1617aff1",
        value: parseEther(presaleAmount),
      });

      setIsPresaleLoading(false);
      setPresaleAmount("");

      showToast("success", "Presale transaction sent!");
      window.open(`https://basescan.org/tx/${tx}`, "_blank");

    } catch (error) {
      console.error(error);
      setIsPresaleLoading(false);
      showToast("error", error.shortMessage || error.message);
    }
  };

  // ===================================================
  // Render UI
  // ===================================================
  return (
    <div className="app-root">

      {/* Background */}
      <div className="global-background"></div>
      <div className="global-background-overlay"></div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="app-container">

        {/* Navigation */}
        <div className="top-nav">
          <a href="https://heatrush.xyz"> ← Return to Dashboard</a>
        </div>

        {/* Staking Card */}
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
      <span className="orange">Stake ETH</span> on Base, fuel the treasury, and get ready for future $HR rewards .
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
            Wallet Balance on Base :  <span>{userBalance}  ETH</span>
          </p>

          {/* Stake Box */}
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
              <button className="max-btn" onClick={handleMax}>MAX</button>
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





<>
  {/* 🔥 صندوق التوتال العريض - Full Width & Standalone */}
  <div className="hr-total-stats-standalone">
    <div className="hr-stat-item">
      <div className="hr-icon">Total Deposited</div>
      <p className="hr-value">19.49 ETH</p>
    </div>
    <div className="hr-divider"></div>
    <div className="hr-stat-item">
      <div className="hr-icon">Total Users</div>
      <p className="hr-value">435</p>
    </div>
    <div className="hr-divider"></div>
    <div className="hr-stat-item">
      <div className="hr-icon">Total Transactions</div>
      <p className="hr-value">716</p>
    </div>
  </div>

  {/* 🔥 الثلاث كروت المنفصلة - مستقلة تمامًا */}
  <div className="hr-info-cards-wrapper">
    <div className="hr-info-card">
      <div className="hr-flame">Protocol APR</div>
    
      <div className="hr-big-value">14%</div>
      <p>Dynamic emissions tuned for sustainable, long-term ecosystem growth.</p>
    </div>

    <div className="hr-info-card">
      <div className="hr-flame">Network</div>
      <div className="hr-big-value">Base</div>
      <p>Low fees, high throughput, and Ethereum L2 security backed by Coinbase.</p>
    </div>

    <div className="hr-info-card">
      <div className="hr-flame">Lockup</div>
      <div className="hr-big-value">Flexible</div>
      <p>Staked ETH is managed by the protocol’s smart contract. Unstaking and claiming will be available soon.</p>
    </div>
  </div>
</>





        {/* Presale Section */}
        <div className="card presale-card">
          <div className="presale-header">
            <div>
              <h3 className="presale-title">Public Presale - Buy $HR</h3>
              <p className="presale-subtitle">
                Contribute ETH and receive future HR allocation.
              </p>
            </div>

            <div className="presale-rate-box">
              <span className="presale-rate-label">Presale Rate</span>
              <span className="presale-rate-value">1 HR = 0.03 USDT</span>
            </div>
          </div>

          <div className="presale-price-row">
            {isPriceLoading && <span>Loading ETH price...</span>}
            {!isPriceLoading && ethPriceUsd && (
              <span className="presale-price-ok">
                Current ETH ≈ ${ethPriceUsd.toFixed(2)}
              </span>
            )}
            {priceError && <span>{priceError}</span>}
          </div>

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
    if (!userBalance) return;
    const max = Math.min(parseFloat(userBalance), 2);
    setPresaleAmount(Number(max.toFixed(4)).toString());
  }}
>
  MAX
</button>

</div>
 </div>

 <div className="presale-summary">
              <div></div>
<div className="presale-summary-item">
  <span className="presale-summary-label">Estimated Value :</span>
  <span className="presale-summary-value">
    {estimatedUsdValue > 0 ? `$${estimatedUsdValue.toFixed(2)}` : "—"}  $USDT
  </span>
</div>

<div className="presale-summary-item">
  <span className="presale-summary-label">You Receive :</span>
  <span className="presale-summary-value">
    {estimatedHrAmount > 0 ? estimatedHrAmount.toLocaleString("en-US") : "—"} $HR
  </span>

  
        </div>
 </div>



           
            
          </div>

          <button
            className={`stake-btn presale-btn ${isPresaleLoading ? "loading" : ""}`}
            onClick={handlePresaleBuy}
            disabled={isPresaleLoading}
          >
            {isPresaleLoading ? "Processing..." : "Buy"}
          </button>

          <p className="presale-footnote">
            $HR distribution happens at TGE.
          </p>
        </div>


        {/* Referral System */}
        <div className="referral-section">
         <div className="faq-title-row">
    <img
      src="/logo.PNG"
      className="faq-logo"
      alt="HeatRush Logo"
    />
    <h2 className="faq-title"><span className="orange">Invite & Earn </span></h2>
  </div>


          <p>
            Earn 10% bonus rewards based on your referral’s staking.
          </p>

          <input
            type="text"
            className="ref-input-box"
            placeholder="Enter wallet address (0x...)"
            value={refWallet}
            onChange={(e) => setRefWallet(e.target.value)}
          />

          <button className="ref-generate-btn" onClick={generateReferral}>
            Generate Referral Code
          </button>

          {refResult && (
            <div className="ref-output">
              <p>Code: <strong>{refResult.code}</strong></p>
              <p>
                Link: <a href={refResult.link}>{refResult.link}</a>
              </p>

              <button className="copy-btn" onClick={() => shareOnX(refResult.link)}>
                Share on X
              </button>
            </div>
          )}
          <div className="referral-instructions">
      <h3>How It Works:</h3>
      <ol>
        <li>Enter your Base wallet address below.</li>
        <li>Your unique referral code will be automatically generated.</li>
        <li>Share the code or your referral link with friends.</li>
        <li>You earn <strong>10% bonus rewards</strong> when they stake.</li>
      </ol>
    </div>
        </div>



{/* ===================== Leaderboard (Top Stakers) ===================== */}
<div className="leaderboard-wrapper">
  <div className="leaderboard-header">
    <h3 className="leaderboard-title">🔥 Top HeatRush Stakers</h3>
    <span className="leaderboard-tag">Live on-chain data</span>
  </div>

  <div className="leaderboard-list">
    <div className="leaderboard-row">
      <span className="rank">#1</span>
      <span className="addr">0xA1...F3b</span>
      <span className="amount">1.13 ETH</span>
    </div>
    <div className="leaderboard-row">
      <span className="rank">#2</span>
      <span className="addr">0x9c...12e</span>
      <span className="amount">0.63 ETH</span>
    </div>
    <div className="leaderboard-row">
      <span className="rank">#3</span>
      <span className="addr">0x7b...99a</span>
      <span className="amount">0.42 ETH</span>
    </div>
    <div className="leaderboard-row">
      <span className="rank">#4</span>
      <span className="addr">0x5d...aa0</span>
      <span className="amount">0.41 ETH</span>
    </div>
    <div className="leaderboard-row">
      <span className="rank">#5</span>
      <span className="addr">0x3e...bc1</span>
      <span className="amount">0.35 ETH</span>
    </div>
  </div>

  <p className="leaderboard-footnote">
    Showing actual on-chain deposit activity.
  </p>
</div>







        {/* FAQ */}
        <div className="faq-section">
          <h2><span className="orange">HeatRush FAQ</span></h2>

          {[1, 2, 3, 4, 5].map((id) => (
            <div className="faq-item" key={id}>
              <button className="faq-question" onClick={() => toggleFAQ(id)}>
                FAQ {id}
                <span>{openFAQ === id ? "-" : "+"}</span>
              </button>
              <div className={`faq-answer ${openFAQ === id ? "open" : ""}`}>
                Answer content for question {id}.
              </div>
            </div>
          ))}
        </div>

      
      </div>
        <footer className="footer">
          <p>🔥 HeatRush Staking — Built for Base.</p>
        </footer>
    </div>
  );
};

export default App;
