import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import { compression } from 'vite-plugin-compression2';
import babelPlugin from 'vite-plugin-babel';
import path from 'path';

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
            compression({
                include: /\.(js|css|html|svg)$/,
                threshold: 1024, // Only compress files bigger than 1KB
            }),
        ],
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
            '@colony': path.resolve(__dirname, './colony_root'),
            '@tutorial': path.resolve(__dirname, './tutorial_root'),
            '@menu': path.resolve(__dirname, './main_menu_root'),
          },
        },
        server: serverConfig,
        build: {
            target: 'esnext',
            loader: { '.js': 'jsx' },
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
