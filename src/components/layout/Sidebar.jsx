import React from "react";
import { Link, useLocation } from "react-router-dom";

// 👈 أهم خطوة: استيراد الأيقونة من public
import favicon from "/favicon.ico";

export default function Sidebar({ isOpen, toggle }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="logo-area">
        {/* استخدمنا متغير favicon بدل /logo.PNG */}
        <img src={favicon} className="side-logo" alt="HeatRush" />
        <div className="logo-text">
          <h2>HeatRush</h2>
          <div className="logo-sub">Staking • Airdrop • XP</div>
        </div>
      </div>


      <nav className="side-nav">
        <Link
          to="/dashboard"
          onClick={toggle}
          className={isActive("/dashboard") ? "active" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/profile"
          onClick={toggle}
          className={isActive("/profile") ? "active" : ""}
        >
          Profile
        </Link>

        <Link
          to="/referral"
          onClick={toggle}
          className={isActive("/referral") ? "active" : ""}
        >
          Referral
        </Link>

        <Link
          to="/tasks"
          onClick={toggle}
          className={isActive("/tasks") ? "active" : ""}
        >
          Tasks &amp; Quests
        </Link>

        <Link
          to="/staking"
          onClick={toggle}
          className={isActive("/staking") ? "active" : ""}
        >
          Staking
        </Link>

        <Link
          to="/airdrop"
          onClick={toggle}
          className={isActive("/airdrop") ? "active" : ""}
        >
          Airdrop
        </Link>

        <Link
          to="/presale"
          onClick={toggle}
          className={isActive("/presale") ? "active" : ""}
        >
          Presale
        </Link>

        <Link
          to="/nodes"
          onClick={toggle}
          className={isActive("/nodes") ? "active" : ""}
        >
          Nodes
        </Link>
      </nav>

      <div className="side-footer">
        <div className="network-pill">
          <span>●</span> Base Mainnet
        </div>
        <span>More pages coming soon…</span>
      </div>
    </aside>
  );
}
