import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "cmdk",
    "embla-carousel-react",
    "input-otp",
    "react-day-picker",
    "react-resizable-panels",
    "sonner",
    "vaul",
  ],
};

export default nextConfig;
