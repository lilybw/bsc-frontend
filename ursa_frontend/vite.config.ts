import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import { compression } from 'vite-plugin-compression2';
import babelPlugin from 'vite-plugin-babel';

export default defineConfig(({ mode }) => {
    const serverConfig = {
        port: mode === 'production' ? 3001 : 3000,
        proxy:
            mode !== 'production'
                ? {
                      '/ursa_backend': {
                          target: 'https://localhost:5386',
                          changeOrigin: true,
                          secure: false,
                          rewrite: (path: string) => path.replace(/^\/ursa_backend/, ''),
                      },
                  }
                : undefined,
    };

    return {
        plugins: [
            devtools({
                /* features options - all disabled by default */
                autoname: true, // e.g. enable autoname
            }),
            solidPlugin(),
            babelPlugin({
                babelConfig: {
                    presets: [
                        ['@babel/preset-typescript', {
                            isTSX: true,
                            allExtensions: true,
                        }]
                    ],
                },
                filter: /\.(tsx|ts|js|jsx)$/,
            }),
            compression({
                include: /\.(js|css|html|svg)$/,
                threshold: 1024, // Only compress files bigger than 1KB
            }),
        ],
        server: serverConfig,
        build: {
            target: 'esnext',
            rollupOptions: {
                output: {
                    entryFileNames: `[name].js`,
                    chunkFileNames: `[name].js`,
                    assetFileNames: `[name].[ext]`,
                },
            },
            emptyOutDir: true,
            minify: 'terser',
            terserOptions: {
                ecma: 2020,
                keep_classnames: false,
                keep_fnames: false,
                compress: {
                    drop_debugger: true,
                    passes: 2
                },
            },
            cssMinify: true, // Enable CSS minification
            cssCodeSplit: true, // Enable CSS code splitting
        },
        optimizeDeps: {
            include: ['@emotion/css'],
            exclude: ['@emotion/react', '@emotion/styled']  // Remove these as they're not used
        },
    };
});
