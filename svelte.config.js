// svelte.config.js
import adapter from '@sveltejs/adapter-static';
const dev = process.argv.includes('dev');

export default {
  kit: {
    adapter: adapter({
      // we’ll copy index.html to 404.html in the workflow for Pages deep links
      fallback: 'index.html'
    }),
    paths: {
      base: dev ? '' : '/r-r-dash'
      // ❌ do NOT set `assets` here; it must be an absolute URL if used
    }
  }
};
