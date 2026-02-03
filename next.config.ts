/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
};

export default nextConfig;