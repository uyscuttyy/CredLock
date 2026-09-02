/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['assets.coingecko.com', 'raw.githubusercontent.com'],
  },
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    
    // Ignore problematic modules that we don't need
    config.resolve.alias = {
      ...config.resolve.alias,
      '@base-org/account': false,
      '@coinbase/cdp-sdk': false,
      '@x402/svm/exact/client': false,
      '@react-native-async-storage/async-storage': false,
      'react-native': false,
    }
    
    return config
  },
}

module.exports = nextConfig