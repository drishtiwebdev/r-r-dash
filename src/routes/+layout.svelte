<script>
	import { afterNavigate } from '$app/navigation';
	import '../app.css';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment'; 
	import { isReturningToHome } from '$lib/stores/navigation';
	import { onMount } from 'svelte';
	import '../lib/i18n/i18n.js';
	import { locale, t } from 'svelte-i18n';
	import { init } from 'svelte-i18n';

	init({
		fallbackLocale: 'en',
		initialLocale: 'en'
	});

	let mobileNavOpen = false;
	let closing = false;

	const closeMenu = () => {
		closing = true;
		setTimeout(() => {
			mobileNavOpen = false;
			closing = false;
		}, 300);
	};

	function handleClickOutside(event) {
		const nav = document.querySelector('.nav-controls');
		if (nav && !nav.contains(event.target)) {
			closeMenu();
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('click', handleClickOutside);
		}
		return () => {
			if (browser) {
				window.removeEventListener('click', handleClickOutside);
			}
		};
	});

	if (browser) {
		afterNavigate(({ to, from }) => {
			if (to?.url.pathname === '/' && from?.url.pathname && from.url.pathname !== '/') {
				isReturningToHome.set(true);
			} else {
				isReturningToHome.set(false);
			}
		});
	}
</script>

<!-- Navigation Bar -->
<nav class="nav-wrapper">
	<h1 class="nav-box nav-title">{$t('title')}</h1>

	<div class="nav-controls nav-box">
		<!-- Language selector -->
		<select
			aria-label="Select language"
			on:change={(e) => {
				const selected = e.target.value;
				locale.set(selected);
				localStorage.setItem('locale', selected);
			}}>
			<option value="en">EN</option>
			<option value="hi">MAR</option>
		</select>	

		<!-- Hamburger -->
		<button class="hamburger" class:open={mobileNavOpen} on:click={() => mobileNavOpen = !mobileNavOpen} aria-label="Toggle menu">
			<div class="bar top"></div>
			<div class="bar middle"></div>
			<div class="bar bottom"></div>
		</button>

		<!-- Mobile Menu -->
		<ul class:open={mobileNavOpen} class:closing={closing}>
			<li class:active={$page.url.pathname === `${base}/`}><a href={`${base}/`}>{$t('map')}</a></li>
			<li class:active={$page.url.pathname.startsWith(`${base}/resources`)}><a href={`${base}/resources`}>{$t('resources')}</a></li>
			<li class:active={$page.url.pathname.startsWith(`${base}/log`)}><a href={`${base}/log`}>{$t('log')}</a></li>
			<li class:active={$page.url.pathname.startsWith(`${base}/about`)}><a href={`${base}/about`}>{$t('about')}</a></li>
		</ul>
	</div>
</nav>

<slot />

<style>
/* === GLOBAL NAVIGATION STYLES === */
nav {
	display: flex;
	justify-content: space-between;
	align-items: center;
	/*background-color: var(--white);
	border: 1px solid var(--black);
	border-radius: 25px;
	color: var(--black);*/
	padding: 1.5rem;
	font-family: sans-serif;
	position: relative;
	z-index: 10001;
	/*box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.4);*/
}

.nav-title {
	font-family: 'PP Neue Machina Regular', sans-serif;
	font-size: 1.2rem;
	color: var(--outline);
}

.nav-controls {
	display: flex;
	align-items: center;
	gap: 2rem;
}

.nav-box {
	background-color: var(--background);
	border: 1.8px solid var(--outline);
	border-radius: 25px;
	padding: 0.75rem 1.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 54px; /* fixed height for visual consistency */
}

select {
	-webkit-appearance: none; /* Chrome/Safari */
 	-moz-appearance: none;    /* Firefox */
  	appearance: none;         /* Standard */
	background-color: var(--background);
	color: var(--outline);
	padding: 0.5rem 1.75rem 0.5rem 0.5rem; /* more space for larger arrow */
	font-family: 'PP Neue Machina Regular', sans-serif;
	font-size: 0.75rem;
	cursor: pointer;
	border: none;
	outline: none;
	appearance: none;
	border-radius: 0px;
	/* Custom arrow */
	background-image: url('data:image/svg+xml;utf8,<svg fill="black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>');
	background-repeat: no-repeat;
	background-position: right 0.5rem center;
	background-size: 16px 16px;
}

select option {
	-webkit-appearance: none; /* Chrome/Safari */
  	-moz-appearance: none;    /* Firefox */
  	appearance: none;         /* Standard */
	background-color: var(--background);
	color: var(--outline);
	font-family: 'PP Neue Machina Regular', sans-serif;
	border-radius: 0;
}

/* Active/selected option */
select option:checked {
	background-color: var(--accent);
	color: var(--background);
}

/* === DESKTOP NAV LINKS === */
nav ul {
	display: flex;
	gap: 1.5rem;
	list-style: none;
	margin: 0;
	padding: 0;
}

nav li {
	cursor: pointer;
	color: var(--outline);
}

nav li.active {
	color: var(--accent);
}

nav a {
	color: inherit;
	text-decoration: none;
	font-family: 'PP Neue Machina Regular', sans-serif;
}

nav a:hover {
	color: var(--hover);
}

/* === HAMBURGER BUTTON (hidden on desktop) === */
.hamburger {
	display: none;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 30px;
	height: 24px;
	background: none;
	border: none;
	cursor: pointer;
	position: relative;
	z-index: 10003;
}

.hamburger:hover .bar {
	background-color: var(--hover);
}

.bar {
	position: absolute;
	width: 24px;
	height: 2px;
	background-color: var(--accent);
	transition: transform 0.3s ease, opacity 0.3s ease;
}

.bar.top    { top: 6px; }
.bar.middle { top: 11px; }
.bar.bottom { top: 16px; }

.hamburger.open .bar.top {
	transform: translateY(5px) rotate(45deg);
}

.hamburger.open .bar.middle {
	opacity: 0;
}

.hamburger.open .bar.bottom {
	transform: translateY(-5px) rotate(-45deg);
}

/* === MOBILE NAVIGATION === */
@media (max-width: 768px) {
	nav {
		padding: 0.75rem 1rem;
	}

	.nav-wrapper {
		background-color: var(--background);
		border: 2px solid var(--outline);
		margin-left: 1rem;
		margin-right: 1rem;
		margin-top: 1rem;
		border-radius: 20px;
		height: 4rem;
	}

	.nav-box{
		background-color: none;
		border: none;
	}

	.nav-controls {
		gap: .5rem;
	}

	nav h1 {
		font-size: 1.2rem;
	}

	nav ul {
		display: none;
		gap: 0;
	}

	.hamburger {
		display: flex;
	}

	nav ul.open {
		display: flex;
		flex-direction: column;
		position: absolute;
		top: 100%;
		margin-top: 1.1rem;
		border-radius: 20px;
		right: 0;
		width: auto;
		min-width: 180px;
		max-width: 60vw;
		justify-content: right;
		background-color: var(--background);
		border: 2px solid var(--outline);
		pointer-events: auto;
		opacity: 1;
		transform: translateY(0);
		transition: opacity 0.3s ease, transform 0.3s ease;
		z-index: 10002;
	}

	nav ul.closing {
		opacity: 0;
		transform: translateY(-10px);
		pointer-events: none;
	}

	@keyframes slideIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	nav ul.open li {
		width: 100%;
		border-top: 1px solid var(--outline);
		box-sizing: border-box;
		padding: 0;
		margin: 0;
		opacity: 0;
		transform: translateY(-10px);
		animation: slideIn 0.3s ease forwards;
	}

	nav ul.open li:first-child {
		border-top: none;
	}

	/* Animation delays */
	nav ul.open li:nth-child(1) { animation-delay: 0.1s; }
	nav ul.open li:nth-child(2) { animation-delay: 0.2s; }
	nav ul.open li:nth-child(3) { animation-delay: 0.3s; }
	nav ul.open li:nth-child(4) { animation-delay: 0.4s; }

	nav ul.open li a {
		display: block;
		width: 100%;
		padding: .75rem 1rem;
		text-align: left;
		font-family: 'PP Neue Machina Regular', sans-serif;
		color: var(--outline);
		text-decoration: none;
		line-height: 1.4;
	}

	nav li a:hover {
		background-color: var(--hover);
		color: var(--background);
	}
}
</style>