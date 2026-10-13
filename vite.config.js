import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-cloudflare';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      alias: {
        $lib: 'src/lib'
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true
      }
    }
  },
  ssr: {
    external: ['@cloudflare/workers-types']
  }
});
