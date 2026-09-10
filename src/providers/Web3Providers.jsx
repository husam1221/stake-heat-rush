import React from "react";

import "@rainbow-me/rainbowkit/styles.css";

import {
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";

import { WagmiProvider } from "wagmi";
import { base, bsc } from "wagmi/chains";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: "HeatRush",
  projectId: "b4a9deb03fa34b25139f708d290ba1b3",
  chains: [base, bsc],
  ssr: false,
  metadata: {
    name: "HeatRush Staking",
    description: "Stake ETH on Base",
    url: "https://heatrush.xyz",
    icons: ["https://heatrush.xyz/favicon.ico"],
  },
});

const queryClient = new QueryClient();

const Web3Providers = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Providers;