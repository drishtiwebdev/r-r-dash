<!-- src/routes/log/+page.svelte (only for this page) -->
<svelte:head>
  <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.1/mapbox-gl-geocoder.css">
</svelte:head>

<script context="module">
  export const ssr = false;
  export const prerender = false;
</script>

<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { supabase } from '$lib/supabase';
  import LocationPicker from '$lib/components/LocationPicker.svelte';
  import { env as publicEnv } from '$env/dynamic/public';
  import mapboxgl from 'mapbox-gl';

  // --- your existing state & functions unchanged ---
  let mode = 'signin';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let session = null;
  let myRow = null;

  let org_name = '';
  let contact_name = '';
  let contact_phone = '';
  let lat = '';
  let lng = '';
  let description = '';
  let water_available = 0;
  let meals_available = 0;
  let clothes_available = 0;
  let medicine_available = 0;
  let hygiene_available = 0;
  let shelter_capacity = 0;

  const MAPBOX_TOKEN = publicEnv.PUBLIC_MAPBOX_TOKEN; 
  let showPicker = false;
  let locationLabel = '';

  async function reverseGeocode(lat, lng) {
    try {
      const r = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const j = await r.json();
      locationLabel = j?.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch { locationLabel = `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
  }

  function quickUseMyLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(async ({coords}) => {
      lat = coords.latitude.toFixed(5);
      lng = coords.longitude.toFixed(5);
      await reverseGeocode(+lat, +lng);
    }, () => alert('Could not get your location'));
  }

  onMount(async () => {
    if (!browser) return;
    const { data: { session: s } } = await supabase.auth.getSession();
    session = s;
    if (session) await loadMyRow();
    supabase.auth.onAuthStateChange((_evt, sess) => {
      session = sess;
      if (session) loadMyRow();
      else resetForm();
    });
  });

  function resetForm() {
    myRow = null;
    org_name = contact_name = contact_phone = '';
    lat = lng = description = '';
    water_available = meals_available = clothes_available = medicine_available = hygiene_available = shelter_capacity = 0;
  }

  async function signUp() {
    if (!email || !password) return alert('Email and password are required.');
    if (password.length < 8) return alert('Use at least 8 characters.');
    if (password !== confirmPassword) return alert("Passwords don't match.");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}${base}/log` } // keep base for GH Pages
    });
    if (error) return alert(error.message);
    alert('Check your email to confirm your account, then sign in.');
    mode = 'signin';
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
  }
  async function signOut() { await supabase.auth.signOut(); }

  async function loadMyRow() {
    if (!session) return;
    const { data, error } = await supabase.from('ngo_reports').select('*').eq('user_id', session.user.id).maybeSingle();
    if (error && error.code !== 'PGRST116') { console.error(error); return; }
    myRow = data || null;
    if (myRow) {
      org_name = myRow.org_name ?? '';
      contact_name = myRow.contact_name ?? '';
      contact_phone = myRow.contact_phone ?? '';
      lat = myRow.lat?.toString() ?? '';
      lng = myRow.lng?.toString() ?? '';
      description = myRow.description ?? '';
      water_available = myRow.water_available ?? 0;
      meals_available = myRow.meals_available ?? 0;
      clothes_available = myRow.clothes_available ?? 0;
      medicine_available = myRow.medicine_available ?? 0;
      hygiene_available = myRow.hygiene_available ?? 0;
      shelter_capacity = myRow.shelter_capacity ?? 0;
    }
  }

  async function saveResources() {
    if (!session) return alert('Please sign in first.');
    const row = {
      user_id: session.user.id,
      org_name,
      contact_name,
      contact_phone,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      description,
      water_available: Number(water_available) || 0,
      meals_available: Number(meals_available) || 0,
      clothes_available: Number(clothes_available) || 0,
      medicine_available: Number(medicine_available) || 0,
      hygiene_available: Number(hygiene_available) || 0,
      shelter_capacity: Number(shelter_capacity) || 0
    };
    const { error } = await supabase.from('ngo_reports').upsert(row, { onConflict: 'user_id' });
    if (error) return alert(error.message);
    await loadMyRow();
    alert('Saved!');
  }
</script>

<section class="log-wrap {session ? 'session' : 'auth'}" >
  <video class="bg-video" autoplay muted loop playsinline>
    <source src="/video/kolhapur-signin.mp4" type="video/mp4" />
  </video>
  {#if !session}
    <div class="card auth-card">
      <h2 class="card-title">{mode === 'signup' ? 'Create account' : 'Sign in'}</h2>

      <form class="form-grid" on:submit|preventDefault={mode === 'signup' ? signUp : signIn}>
        <label class="fld">
          <span>Email</span>
          <input type="email" bind:value={email} required />
        </label>

        <label class="fld">
          <span>Password</span>
          <input type="password" bind:value={password} required minlength="8" />
        </label>

        {#if mode === 'signup'}
          <label class="fld">
            <span>Confirm password</span>
            <input type="password" bind:value={confirmPassword} required minlength="8" />
          </label>
        {/if}

        <div class="actions">
          <button class="pill-btn" type="submit">
            {mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </form>

      <p class="muted">
        {#if mode === 'signup'}
          Already have an account?
          <a href="#" on:click|preventDefault={() => (mode = 'signin')}>Sign in</a>
        {:else}
          Need an account?
          <a href="#" on:click|preventDefault={() => (mode = 'signup')}>Create one</a>
        {/if}
      </p>
    </div>
{:else}
  <form class="card form-card" on:submit|preventDefault={saveResources}>
    <header class="form-header">
      <h2 class="page-title">NGO Resources</h2>
    </header>

    <div class="form-body">
      <div class="form-grid">
        <label class="fld"><span>Organization</span><input bind:value={org_name} /></label>        <label class="fld"><span>Contact phone</span><input bind:value={contact_phone} /></label>

       <label class="fld col-span-2">
        <span>Location</span>
        <div style="display:flex; gap:.5rem; align-items:center;">
          <input class="grow" value={locationLabel} placeholder="Search or drop a pin…" readonly style="flex:1;" />
          <button type="button" class="pill-btn" on:click={() => showPicker = true}>Set on map</button>
          <button type="button" class="pill-btn outline" on:click={quickUseMyLocation}>Use my location</button>
        </div>
        <!-- keep these for saving -->
        <input type="hidden" bind:value={lat} />
        <input type="hidden" bind:value={lng} />
      </label>

{#if showPicker}
  <LocationPicker
    token={MAPBOX_TOKEN}
    bind:lat
    bind:lng
    on:choose={(e) => { lat = e.detail.lat; lng = e.detail.lng; reverseGeocode(lat, lng); showPicker = false; }}
    on:cancel={() => (showPicker = false)}
  />
{/if}
        <label class="fld col-span-2">
          <span>Location Description</span>
          <textarea rows="3" bind:value={description}></textarea>
        </label>
      </div>

      <fieldset class="fieldset">
        <legend>Resources on hand</legend>
        <div class="grid-3">
          <label class="fld"><span>Water (bottles)</span><input type="number" bind:value={water_available} min="0" /></label>
          <label class="fld"><span>Meals (plates)</span><input type="number" bind:value={meals_available} min="0" /></label>
          <label class="fld"><span>Clothes (count)</span><input type="number" bind:value={clothes_available} min="0" /></label>
          <label class="fld"><span>Medicine (count)</span><input type="number" bind:value={medicine_available} min="0" /></label>
          <label class="fld"><span>Hygiene (kits)</span><input type="number" bind:value={hygiene_available} min="0" /></label>
          <label class="fld"><span>Shelter capacity (beds)</span><input type="number" bind:value={shelter_capacity} min="0" /></label>
        </div>
      </fieldset>
    </div>

    <footer class="form-footer">
      <button type="button" class="pill-btn outline" on:click={signOut}>Sign out</button>
      <div class="spacer"></div>
      <button class="pill-btn primary" type="submit">Save</button>
    </footer>
  </form>
{/if}
</section>

<style>
  /* --- Video background (both views) --- */
  .bg-video{
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -100;
    pointer-events: none;
  }
  .log-wrap::before{
    content: "";
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.25);
    z-index: -1;
  }

  /* --- Page wrapper above video --- */
  .log-wrap{
    position: relative;
    z-index: 1;
    min-height: calc(100vh - 6rem);
    padding: 1.25rem;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  /* --- Cards --- */
  .card{
    background: #fff;
    border: 1.6px solid var(--outline);
    border-radius: 18px;
    box-shadow: 0 8px 22px rgba(0,0,0,.12);
  }
  .card.auth-card{
    max-width: 520px;
    width: min(520px, 92vw);
    padding: 1.25rem;
    font-size: clamp(13px, 1.1vw + .1rem, 15px);
  }

  /* --- NGO form card: smaller, responsive scale --- */
  .form-card{
    --pad: clamp(.75rem, 1.5vw, 1rem);
    width: min(960px, 94vw);
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
    border-radius: 20px;
    font-size: clamp(13px, 1.15vw, 15px);   /* ↓ overall scale */
  }
  .form-header{
    padding: .75rem var(--pad);
    background: #fff;
    border-bottom: 1px solid rgba(0,0,0,.06);
  }
  .page-title{
    margin: 0;
    font-size: clamp(1.05rem, 2.2vw, 1.45rem);
    line-height: 1.2;
  }

  .form-body{
    padding: .75rem var(--pad) var(--pad);
    overflow: auto;
    min-height: 0;
    background: #fff;
  }

  .form-footer{
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .6rem var(--pad);
    background: linear-gradient(to top, rgba(255,255,255,.98), rgba(255,255,255,.94));
    border-top: 1px solid rgba(0,0,0,.06);
  }
  .form-footer .spacer{ flex: 1; }

  /* --- Layout grids, tighter gaps --- */
  .form-grid{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .7rem .8rem;
  }
  .form-grid .col-span-2{ grid-column: span 2; }

  .grid-3{
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: .7rem .8rem;
  }

  @media (max-width: 900px){
    .grid-3{ grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 720px){
    .form-grid{ grid-template-columns: 1fr; }
    .form-grid .col-span-2{ grid-column: auto; }
    .grid-3{ grid-template-columns: 1fr; }
  }

  /* --- Fields smaller --- */
  .fld{ display:flex; flex-direction:column; gap:.3rem; color:var(--outline); }
  .fld span{ font-size: .95em; }

  input, textarea{
    width: 100%;
    padding: .5em .7em;                 /* ↓ padding */
    background: #fff;
    border: 1.4px solid #b7b7b7;
    border-radius: 12px;                /* ↓ radius */
    color: var(--outline);
    font: inherit;
    outline: none;
  }
  input:focus, textarea:focus{
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  }
  textarea{ resize: vertical; min-height: 3.1rem; }

  .fieldset{
    margin-top: .75rem;
    padding: .75rem;
    border: 1px solid #ececec;
    border-radius: 14px;
    background: #fafafa;
  }
  .fieldset legend{ padding: 0 .35rem; font-size: .95em; }

  /* --- Buttons smaller --- */
  .pill-btn{
    height: clamp(34px, 4.5vw, 40px);
    padding: 0 .8rem;
    border-radius: 999px;
    border: 1.6px solid var(--outline);
    background: #fff;
    color: var(--outline);
    font-size: .95em;
    cursor: pointer;
    transition: transform .06s, background .2s, color .2s, border-color .2s;
  }
  .pill-btn:hover{ background: var(--accent); color:#fff; border-color: var(--accent); }
  .pill-btn:active{ transform: translateY(1px); }
  .pill-btn.primary{ background: var(--accent); color:#fff; border-color: var(--accent); }

  .muted{ margin-top:.6rem; color:var(--outline); opacity:.75; }
  .muted a{ color:var(--accent); text-decoration:none; }
  .muted a:hover{ color:var(--hover); text-decoration:underline; }
</style>

