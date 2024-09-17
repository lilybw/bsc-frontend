import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import https from 'https';

export default defineConfig(({ mode }) => { 
  const serverConfig = {
    port: mode === 'production' ? 3001 : 3000,
    proxy: mode !== 'production' ? {
      '/backend': {
        target: 'https://localhost:5386',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/backend/, ''),
        agent: new https.Agent({ rejectUnauthorized: false })
      },
    } : undefined
  };


return {
  plugins: [
    devtools({
      /* features options - all disabled by default */
      autoname: true, // e.g. enable autoname
      }),
    solidPlugin(),
  ],
  server: serverConfig,
  build: {
    target: 'esnext', 
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      }
    }
  },
}});
