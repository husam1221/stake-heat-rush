import React from "react";
import Toast from "../ui/Toast.jsx";

const AppShell = ({ children, toast }) => {
  return (
    <div className="app-root">
      {/* Background */}
      <div className="global-background"></div>
      <div className="global-background-overlay"></div>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Main Container */}
      <div className="app-container">
        {/* Navigation */}
        <div className="top-nav">
          <a href="https://heatrush.xyz"> ← Return to Dashboard</a>
        </div>

        {children}
      </div>

      <footer className="footer">
        <p>🔥 HeatRush Staking — Built for Base.</p>
      </footer>
    </div>
  );
};

export default AppShell;
