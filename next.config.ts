
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, nextRuntime, webpack }) => {
    // Ensure resolve and fallback objects exist before assigning to them
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.fallback) {
      config.resolve.fallback = {};
    }

    // Critical: Prevent fs, tls, net, child_process etc. from being bundled on the client
    // These are Node.js specific modules.
    config.resolve.fallback.fs = false;
    config.resolve.fallback.tls = false;
    config.resolve.fallback.net = false; // This line is crucial for the 'net' error
    config.resolve.fallback.child_process = false;
    config.resolve.fallback.crypto = false;
    config.resolve.fallback.stream = false;
    config.resolve.fallback.path = false;
    config.resolve.fallback.os = false;
    config.resolve.fallback.http = false;
    config.resolve.fallback.https = false;
    config.resolve.fallback.zlib = false;
    config.resolve.fallback.util = false;
    config.resolve.fallback.assert = false;
    config.resolve.fallback.async_hooks = false;
    config.resolve.fallback.timers = false;
    config.resolve.fallback.dns = false;
    config.resolve.fallback.buffer = false;
    config.resolve.fallback.events = false;
    config.resolve.fallback.string_decoder = false;
    config.resolve.fallback.url = false;


    // Add a rule to handle .node files (often used by native addons like in some DB drivers)
    // This is particularly important if mysql2 or similar libraries try to load native modules.
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Workaround for mysql2: It tries to dynamically require('pg-native') which can cause issues.
    // This plugin makes sure that such dynamic requires for 'pg-native' are ignored.
    // It also helps if other optional dependencies are causing issues.
    if (!isServer && nextRuntime !== 'edge') {
        config.plugins.push(
            new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$|^mongodb-client-encryption$|^@sap\/hana-client$|^ वर्षों ago$|^oracle$|^sqlite3$|^mysql$|^mssql$|^mysql2$/ })
        );
    }


    return config;
  },
};

export default nextConfig;
