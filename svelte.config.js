// svelte.config.js
import adapter from '@sveltejs/adapter-static';
const dev = process.argv.includes('dev');

export default {
  kit: {
    adapter: adapter({
      // build a SPA fallback
      fallback: '404.html'
    }),
    paths: {
      base: dev ? '' : '/r-r-dash'
      // do NOT set `assets` (it must be an absolute URL if used)
    }
  }
};
