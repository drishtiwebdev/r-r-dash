// svelte.config.js
import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev'); // true when running `npm run dev`

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // this makes GitHub Pages serve your SPA on refresh/deep links
      fallback: '404.html'
    }),
    paths: {
      // If deploying to https://USERNAME.github.io/r-r-dash/ use '/r-r-dash'
      // If deploying to https://USERNAME.github.io/ (special user repo), keep ''
      base: dev ? '' : '/r-r-dash'
    }
  }
};

export default config;
