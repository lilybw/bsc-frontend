import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig(({ mode }) => { 
  let serverConfig: any = {
    port: 3001,
  };
  if (mode !== 'production') {
    serverConfig = {
      port: 3000,
      proxy: {
        '^/backend/': {
          target: 'https://localhost:5386',
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/backend/, '')
        },
      },
    };
  }


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
