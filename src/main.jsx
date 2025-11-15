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
import "./styles.css";

const config = getDefaultConfig({
  appName: "HeatRush Staking",
  projectId: "6b05726282d5a7aa26e467d76ccfa4a3",
  chains: [base],
  ssr: false,
  metadata: {
    name: "HeatRush Staking",
    description: "Stake ETH on Base",
    url: "https://staking.heatrush.xyz",
    icons: ["https://staking.heatrush.xyz/favicon.png"]
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
