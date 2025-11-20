// src/App.jsx
import React, { useState } from "react";
import "./App.css";

import AppShell from "./components/layout/AppShell.jsx";
import StakeSection from "./components/staking/StakeSection.jsx";
import AirdropSection from "./components/airdrop/AirdropSection.jsx";
import ProtocolStats from "./components/stats/ProtocolStats.jsx";
import PresaleSection from "./components/presale/PresaleSection.jsx";
import ReferralSection from "./components/referral/ReferralSection.jsx";
import LeaderboardSection from "./components/leaderboard/LeaderboardSection.jsx";
import FaqSection from "./components/faq/FaqSection.jsx";

const App = () => {
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <AppShell toast={toast}>
      <StakeSection showToast={showToast} />
      <AirdropSection />
      <ProtocolStats />
      <PresaleSection showToast={showToast} />
      <ReferralSection />
      <LeaderboardSection />
      <FaqSection />
    </AppShell>
  );
};

export default App;
