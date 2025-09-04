import { register, init, getLocaleFromNavigator } from 'svelte-i18n';
import { browser } from '$app/environment';

register('en', () => import('./en.json'));
register('hi', () => import('./hi.json'));

const storedLocale = browser ? localStorage.getItem('locale') : null;

init({
  fallbackLocale: 'en',
  initialLocale: storedLocale || getLocaleFromNavigator()
});