// src/components/layout/AppShell.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/layout.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SidebarLogo from "../../assets/sidebar-log.png";

const AppShell = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const getPageLabel = () => {
    if (location.pathname === "/dashboard") return "DASHBOARD";
    if (location.pathname.startsWith("/profile")) return "PROFILE";
    if (location.pathname.startsWith("/referral")) return "REFERRAL";
    if (location.pathname.startsWith("/tasks")) return "TASKS";
    if (location.pathname.startsWith("/staking")) return "STAKING";
    if (location.pathname.startsWith("/airdrop")) return "AIRDROP";
    if (location.pathname.startsWith("/presale")) return "PRESALE";
    if (location.pathname.startsWith("/nodes")) return "NODES";
    if (location.pathname.startsWith("/faq")) return "FAQ";
    return "DASHBOARD";
  };

  return (
    <div className="app-wrapper">
      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
       <div className="logo-area">
  <div className="logo-circle">
    <img
      src={SidebarLogo}
      className="side-logo"
      alt="HeatRush Sidebar Logo"
    />
  </div>

  <div className="logo-text">
    <h2>HeatRush</h2>
    <div className="logo-sub">Staking • Airdrop • XP</div>
  </div>
</div>

        <nav className="side-nav">
  <Link
    to="/dashboard"
    className={location.pathname === "/dashboard" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
    Dashboard
  </Link>



  <Link
    to="/profile"
    className={location.pathname === "/profile" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
   Profile
  </Link>


    <Link
    to="/referral"
    className={location.pathname === "/referral" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
   Referral
  </Link>


    <Link
    to="/tasks"
    className={location.pathname === "/tasks" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
   Tasks
  </Link>



  <Link
    to="/staking"
    className={location.pathname === "/staking" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
    Staking
  </Link>



  <Link
    to="/airdrop"
    className={location.pathname === "/airdrop" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
    Airdrop S1
  </Link>



  <Link
    to="/presale"
    className={location.pathname === "/presale" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
    Presale
  </Link>


    <Link
    to="/nodes"
    className={location.pathname === "/nodes" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
    Nodes
  </Link>

  <Link
    to="/faq"
    className={location.pathname === "/faq" ? "active" : ""}
    onClick={() => setMenuOpen(false)}
  >
    FAQ
  </Link>


</nav>


        <div className="side-footer">
          <span className="network-pill">● Base Mainnet</span>
          <a
            href="https://heatrush.xyz"
            target="_blank"
            rel="noreferrer"
            className="side-link"
          >
            Main Website
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="app-content">
        {/* ✅ هنا حطينا زر المنيو + اسم المشروع + زر المحفظة في نفس السطر */}
        <header className="top-bar">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰
          </button>

          <div className="top-title-group">
            <span className="top-project-name">HeatRush</span>
            <span className="top-page-label">{getPageLabel()}</span>
          </div>

          <div className="top-bar-right">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus="address"
            />
          </div>
        </header>

        <div className="page-body">{children}</div>
      </div>
    </div>
  );
};

export default AppShell;
