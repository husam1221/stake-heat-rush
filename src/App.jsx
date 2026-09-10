import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";

import LandingPage from "./pages/landing/LandingPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import ReferralPage from "./pages/referral/ReferralPage.jsx";
import TasksPage from "./pages/tasks/TasksPage.jsx";
import StakingPage from "./pages/staking/StakingPage.jsx";
import AirdropPage from "./pages/airdrop/AirdropPage.jsx";
import PresalePage from "./pages/presale/PresalePage.jsx";
import NodesPage from "./pages/nodes/NodesPage.jsx";
import FaqPage from "./pages/faq/FaqPage.jsx";
import Season2Page from "./pages/season2/Season2Page.jsx";

import { useReferralListener } from "./hooks/useReferralListener.js";

const PlatformLayout = ({ toast }) => {
  return (
    <AppShell toast={toast}>
      <Outlet />
    </AppShell>
  );
};

function App() {
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useReferralListener();

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page خارج AppShell */}
        <Route path="/" element={<LandingPage />} />

        {/* كل صفحات المنصة الحالية تبقى داخل AppShell */}
        <Route element={<PlatformLayout toast={toast} />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/referral"
            element={
              <ReferralPage showToast={showToast} />
            }
          />

          <Route
            path="/tasks"
            element={
              <TasksPage showToast={showToast} />
            }
          />

          <Route
            path="/staking"
            element={
              <StakingPage showToast={showToast} />
            }
          />

          <Route
            path="/airdrop"
            element={
              <AirdropPage showToast={showToast} />
            }
          />

          <Route
            path="/season2"
            element={
              <Season2Page showToast={showToast} />
            }
          />

          <Route
            path="/presale"
            element={
              <PresalePage showToast={showToast} />
            }
          />

          <Route
            path="/nodes"
            element={
              <NodesPage showToast={showToast} />
            }
          />

          <Route
            path="/faq"
            element={
              <FaqPage showToast={showToast} />
            }
          />

          <Route
            path="*"
            element={<h2>404 - Page not found</h2>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;