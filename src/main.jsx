import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  getDefaultConfig
} from "@rainbow-me/rainbowkit";

import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 👇 بدل styles.css بهذه الاستايلات الموجودة فعليًا عندك
// Global styles
import "./index.css";
import "./App.css";

// Page/layout styles
import "./styles/layout.css";
import "./styles/dashboard.css";
import "./styles/profile.css";
import "./styles/staking.css";
import "./styles/presale.css";
import "./styles/airdrop.css";
import "./styles/referral.css";
import "./styles/tasks.css";
import "./styles/nodes.css";
import "./styles/faq.css";



const config = getDefaultConfig({
  appName: "HeatRush Staking",
  projectId: "6b05726282d5a7aa26e467d76ccfa4a3",
  chains: [base],
  ssr: false,
  metadata: {
    name: "HeatRush Staking",
    description: "Stake ETH on Base",
    url: "https://heatrush.xyz",
  icons: ["https://heatrush.xyz/favicon.ico"],
  }
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);