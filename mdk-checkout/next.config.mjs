import { withMdkCheckout } from "@moneydevkit/nextjs/next-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

export default withMdkCheckout(nextConfig);
