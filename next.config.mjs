/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns: [
            {
              protocol: 'https',
              hostname: 'utfs.io',
              port: '',
              pathname: '/**',
            },
            {
              protocol: 'https',
              hostname: 'img.clerk.com',
              port: '',
              pathname: '/*',
            },
            {
              protocol: 'https',
              hostname: 'img.pexels.com',
              port: '',
              pathname: '/*',
            },
          ],
    },
    webpack: (config) => {
        config.externals.push({
            'utf-8-validate': 'commonjs utf-8-validate',
            'bufferutil': 'commonjs bufferutil',
        });
        return config;
    },
};

export default nextConfig;
