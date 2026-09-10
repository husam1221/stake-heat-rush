import React, {
  lazy,
  Suspense,
  useState,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import LandingPage from "./pages/landing/LandingPage.jsx";

import { useReferralListener } from "./hooks/useReferralListener.js";

const Web3Providers = lazy(() =>
  import("./providers/Web3Providers.jsx")
);

const AppShell = lazy(() =>
  import("./components/layout/AppShell.jsx")
);

const DashboardPage = lazy(() =>
  import("./pages/dashboard/DashboardPage.jsx")
);

const ProfilePage = lazy(() =>
  import("./pages/profile/ProfilePage.jsx")
);

const ReferralPage = lazy(() =>
  import("./pages/referral/ReferralPage.jsx")
);

const TasksPage = lazy(() =>
  import("./pages/tasks/TasksPage.jsx")
);

const StakingPage = lazy(() =>
  import("./pages/staking/StakingPage.jsx")
);

const AirdropPage = lazy(() =>
  import("./pages/airdrop/AirdropPage.jsx")
);

const PresalePage = lazy(() =>
  import("./pages/presale/PresalePage.jsx")
);

const NodesPage = lazy(() =>
  import("./pages/nodes/NodesPage.jsx")
);

const FaqPage = lazy(() =>
  import("./pages/faq/FaqPage.jsx")
);

const Season2Page = lazy(() =>
  import("./pages/season2/Season2Page.jsx")
);

const PlatformLoading = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Loading HeatRush...
    </div>
  );
};

const PlatformContent = ({ toast }) => {
  useReferralListener();

  return (
    <AppShell toast={toast}>
      <Outlet />
    </AppShell>
  );
};

const PlatformLayout = ({ toast }) => {
  return (
    <Suspense fallback={<PlatformLoading />}>
      <Web3Providers>
        <PlatformContent toast={toast} />
      </Web3Providers>
    </Suspense>
  );
};

function App() {
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });

    setTimeout(() => setToast(null), 3500);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page خارج AppShell و Web3Providers */}
        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* كل صفحات المنصة تعمل داخل Web3Providers و AppShell */}
        <Route
          element={
            <PlatformLayout toast={toast} />
          }
        >
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
              <ReferralPage
                showToast={showToast}
              />
            }
          />

          <Route
            path="/tasks"
            element={
              <TasksPage
                showToast={showToast}
              />
            }
          />

          <Route
            path="/staking"
            element={
              <StakingPage
                showToast={showToast}
              />
            }
          />

          <Route
            path="/airdrop"
            element={
              <AirdropPage
                showToast={showToast}
              />
            }
          />

          <Route
            path="/season2"
            element={
              <Season2Page
                showToast={showToast}
              />
            }
          />

          <Route
            path="/presale"
            element={
              <PresalePage
                showToast={showToast}
              />
            }
          />

          <Route
            path="/nodes"
            element={
              <NodesPage
                showToast={showToast}
              />
            }
          />

          <Route
            path="/faq"
            element={
              <FaqPage
                showToast={showToast}
              />
            }
          />

          <Route
            path="*"
            element={
              <h2>404 - Page not found</h2>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;