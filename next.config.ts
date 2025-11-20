import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Tell Next.js to exclude transformers from server-side bundling
  serverExternalPackages: ['@xenova/transformers'],
  // Empty turbopack config to silence the warning
  turbopack: {},
  
  webpack: (config, { isServer }) => {
    // Don't bundle @xenova/transformers on server side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@xenova/transformers': 'commonjs @xenova/transformers',
      });
    } else {
      // Client-side configuration for @xenova/transformers
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'sharp$': false,
        'onnxruntime-node$': false,
      };
      
      // Ignore node-specific modules in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
