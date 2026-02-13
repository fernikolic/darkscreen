import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
    metaMask({ dappMetadata: { name: "Darkscreen" } }),
    coinbaseWallet({ appName: "Darkscreen" }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: true,
});
