// svelte.config.js
import adapter from '@sveltejs/adapter-static';
const dev = process.argv.includes('dev');

export default {
  kit: {
    adapter: adapter({
      // we'll copy index.html to 404.html in the workflow
      fallback: 'index.html'
    }),
    paths: {
      // repo base path
      base: dev ? '' : '/r-r-dash',
      // ensure _app asset URLs are under the same base
      assets: dev ? '' : '/r-r-dash'
    }
  }
};
