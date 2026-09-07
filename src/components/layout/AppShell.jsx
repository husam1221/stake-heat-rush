// src/components/layout/AppShell.jsx

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/layout.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import SidebarLogo from "../../assets/sidebar-log.png";

import {
  LayoutDashboard,
  User,
  Users,
  CheckSquare,
  Flame,
  Gift,
  Coins,
  Share2,
  HelpCircle,
  Activity,
  X,
  Menu,
} from "lucide-react";

const AppShell = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { isConnected, chainId } = useAccount();

  const currentNetworkLabel = !isConnected
    ? "Not Connected"
    : chainId === 8453
      ? "Base"
      : chainId === 56
        ? "BNB Chain"
        : "Unsupported";

  const getPageLabel = () => {
    if (location.pathname === "/dashboard") return "DASHBOARD";
    if (location.pathname.startsWith("/profile")) return "PROFILE";
    if (location.pathname.startsWith("/referral")) return "REFERRAL";
    if (location.pathname.startsWith("/tasks")) return "TASKS";
    if (location.pathname.startsWith("/staking")) return "STAKING";
    if (location.pathname.startsWith("/airdrop")) return "AIRDROP";
    if (location.pathname.startsWith("/season2")) return "SEASON 2";
    if (location.pathname.startsWith("/presale")) return "PRESALE";
    if (location.pathname.startsWith("/nodes")) return "NODES";
    if (location.pathname.startsWith("/faq")) return "FAQ";

    return "DASHBOARD";
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="app-wrapper">
      {/* Mobile overlay */}
      {menuOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeMenu}
        />
      )}

      {/* ================================
          SIDEBAR
      ================================= */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="logo-area">
            <div className="logo-circle">
              <img
                src={SidebarLogo}
                className="side-logo"
                alt="HeatRush Sidebar Logo"
              />
            </div>

            <div className="logo-text">
              <div className="logo-name-row">
                <h2>HeatRush</h2>

                <span className="sidebar-live-dot" />
              </div>

              <span className="logo-sub">
                Web3 Infrastructure
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
            aria-label="Close navigation"
            onClick={closeMenu}
          >
            <X size={18} />
          </button>
        </div>

        {/* LIVE STATUS */}
        <div className="sidebar-network-status">
          <div className="sidebar-network-status-left">
            <span className="network-live-dot" />

            <div className="sidebar-network-copy">
              <span className="sidebar-network-title">
                HEATRUSH NETWORK
              </span>

              <span className="sidebar-network-subtitle">
                Infrastructure active
              </span>
            </div>
          </div>

          <span className="sidebar-live-text">
            LIVE
          </span>
        </div>

        {/* Season 2 */}
        <div className="sidebar-season-row">
          <span className="sidebar-season-label">
            CURRENT PHASE
          </span>

          <span className="profile-season-pill">
            SEASON 2
          </span>
        </div>

        {/* ================================
            NAVIGATION
        ================================= */}
        <nav className="side-nav">
          <div className="side-nav-section-label">
            PLATFORM
          </div>

          <Link
            to="/dashboard"
            className={
              location.pathname === "/dashboard"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <LayoutDashboard size={16} />
            </span>

            <span className="side-nav-label">
              Dashboard
            </span>
          </Link>

          <Link
            to="/profile"
            className={
              location.pathname === "/profile"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <User size={16} />
            </span>

            <span className="side-nav-label">
              Profile
            </span>
          </Link>

          <Link
            to="/referral"
            className={
              location.pathname === "/referral"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <Users size={16} />
            </span>

            <span className="side-nav-label">
              Referral
            </span>
          </Link>

          <Link
            to="/tasks"
            className={
              location.pathname === "/tasks"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <CheckSquare size={16} />
            </span>

            <span className="side-nav-label">
              Tasks
            </span>
          </Link>

          <div className="side-nav-divider" />

          <div className="side-nav-section-label">
            ECOSYSTEM
          </div>

          <Link
            to="/staking"
            className={
              location.pathname === "/staking"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <Flame size={16} />
            </span>

            <span className="side-nav-label">
              Staking
            </span>

            <span className="nav-live-badge">
              LIVE
            </span>
          </Link>

          <Link
            to="/season2"
            className={`season2-highlight ${
              location.pathname.startsWith("/season2")
                ? "active"
                : ""
            }`}
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <Gift size={16} />
            </span>

            <span className="side-nav-label">
              Airdrop
            </span>

            <span className="nav-season-badge">
              S2
            </span>
          </Link>

          <Link
            to="/presale"
            className={
              location.pathname === "/presale"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <Coins size={16} />
            </span>

            <span className="side-nav-label">
              Presale
            </span>
          </Link>

          <Link
            to="/nodes"
            className={
              location.pathname === "/nodes"
                ? "active"
                : ""
            }
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <Share2 size={16} />
            </span>

            <span className="side-nav-label">
              Nodes
            </span>
          </Link>

          <Link
            to="/faq"
            className={`${
              location.pathname === "/faq"
                ? "active"
                : ""
            } faq-bottom`}
            onClick={closeMenu}
          >
            <span className="side-nav-icon">
              <HelpCircle size={16} />
            </span>

            <span className="side-nav-label">
              FAQ
            </span>
          </Link>
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-status-footer">
          <div className="sidebar-status-line">
            <Activity size={13} />

            <span>
              Systems operational
            </span>
          </div>

          <span className="sidebar-status-chain">
            Base Network
          </span>
        </div>
      </aside>

      {/* ================================
          MAIN CONTENT
      ================================= */}
      <div className="app-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button
              type="button"
              className="menu-toggle"
              aria-label="Open navigation"
              onClick={() =>
                setMenuOpen((value) => !value)
              }
            >
              {menuOpen ? (
                <X size={18} />
              ) : (
                <Menu size={19} />
              )}
            </button>

            <div className="top-title-group">
              <div className="top-project-row">
                <span className="top-project-name">
                  HeatRush
                </span>

                <div className="top-live-status">
                  <span className="top-live-dot" />
                  LIVE
                </div>
              </div>

              <span className="top-page-label">
                {getPageLabel()}
              </span>
            </div>
          </div>

          <div className="top-bar-right">
            <div className="desktop-network-status">
              <span className="desktop-network-dot" />

              <div>
                <span className="desktop-network-title">
                  NETWORK
                </span>

                <span className="desktop-network-value">
                  {currentNetworkLabel}
                </span>
              </div>
            </div>

            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus="address"
            />
          </div>
        </header>

        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;