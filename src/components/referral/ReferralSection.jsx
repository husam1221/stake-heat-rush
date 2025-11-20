import React, { useState } from "react";

const ReferralSection = () => {
  const [refWallet, setRefWallet] = useState("");
  const [refResult, setRefResult] = useState(null);

  const generateReferral = () => {
    if (!refWallet || !refWallet.startsWith("0x") || refWallet.length < 40) {
      setRefResult({
        error: "Please enter a valid wallet address starting with 0x",
      });
      return;
    }
    const code = btoa(refWallet.substring(0, 10)).slice(0, 8);
    const link = `${window.location.origin}?ref=${code}`;
    setRefResult({ code, link });
  };

  const shareOnX = (link) => {
    const message = encodeURIComponent(
      `🔥 Join HeatRush! Earn rewards by staking ETH.\nUse my referral link:\n${link}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${message}`, "_blank");
  };

  return (
    <div className="referral-section">
      <div className="faq-title-row">
        <img src="/logo.PNG" className="faq-logo" alt="HeatRush Logo" />
        <h2 className="faq-title">
          <span className="orange">Invite & Earn </span>
        </h2>
      </div>

      <p>Earn 10% bonus rewards based on your referral’s staking.</p>

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
          {refResult.error && <p className="airdrop-error">{refResult.error}</p>}
          {!refResult.error && (
            <>
              <p>
                Code: <strong>{refResult.code}</strong>
              </p>
              <p>
                Link: <a href={refResult.link}>{refResult.link}</a>
              </p>

              <button
                className="copy-btn"
                onClick={() => shareOnX(refResult.link)}
              >
                Share on X
              </button>
            </>
          )}
        </div>
      )}

      <div className="referral-instructions">
        <h3>How It Works:</h3>
        <ol>
          <li>Enter your Base wallet address below.</li>
          <li>Your unique referral code will be automatically generated.</li>
          <li>Share the code or your referral link with friends.</li>
          <li>
            You earn <strong>10% bonus rewards</strong> when they stake.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ReferralSection;
