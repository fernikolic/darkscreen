/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "darkscreen-r2-proxy.fernandonikolic.workers.dev",
      },
    ],
  },
  webpack: (config) => {
    // wagmi v3 barrel-exports optional connectors whose peer deps aren't
    // installed. Alias them to false so both dev and prod builds resolve.
    const stubModules = [
      "porto",
      "porto/internal",
      "@base-org/account",
      "@gemini-wallet/core",
      "@safe-global/safe-apps-sdk",
      "@safe-global/safe-apps-provider",
      "@walletconnect/ethereum-provider",
    ];
    for (const mod of stubModules) {
      config.resolve.alias[mod] = false;
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ...Object.fromEntries(stubModules.map((m) => [m, false])),
    };
    return config;
  },
};

export default nextConfig;
