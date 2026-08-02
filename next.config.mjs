/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'avatars.githubusercontent.com' }],
  },
  // GEN1 performance budget: no client JS beyond what React needs. Every page is a
  // server component; there is no client bundle for data rendering by design.
  poweredByHeader: false,
};

export default nextConfig;
