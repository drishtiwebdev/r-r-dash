<script>
  import 'mapbox-gl/dist/mapbox-gl.css';
  import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

  import { onMount, createEventDispatcher } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
  import { env as publicEnv } from '$env/dynamic/public';



  export let token = tokenFromEnv;                 // your Mapbox token
  export let lat = null;
  export let lng = null;
  export let start = [74.22891, 16.70221]; // default center (Kolhapur)

  const MAPBOX_TOKEN = publicEnv.PUBLIC_MAPBOX_TOKEN;
  
  const dispatch = createEventDispatcher();
  let mapEl, map, marker;

  function setPoint([lon, la]) {
    lat = +la.toFixed(5);
    lng = +lon.toFixed(5);
    if (!marker) marker = new mapboxgl.Marker({ color: '#023cf5' }).setLngLat([lon, la]).addTo(map);
    else marker.setLngLat([lon, la]);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const center = [coords.longitude, coords.latitude];
        map.flyTo({ center, zoom: 15 });
        setPoint(center);
      },
      () => alert('Could not get your location')
    );
  }

  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoicm9sbG81MDQiLCJhIjoiY21idXBkeTExMGk3ZjJqcXVubnB2OGNvMCJ9.9hYwC_sfm7NAPCQvqLD_HA';
    map = new mapboxgl.Map({
      container: mapEl,
      style: 'mapbox://styles/mapbox/light-v10',
      center: lat && lng ? [lng, lat] : start,
      zoom: lat && lng ? 14 : 11
    });
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    const geocoder = new MapboxGeocoder({
      accessToken: token,
      mapboxgl,
      marker: false,
      placeholder: 'Search address or place'
    });
    geocoder.on('result', (e) => setPoint(e.result.center));
    map.addControl(geocoder, 'top-left');

    map.on('click', (e) => setPoint([e.lngLat.lng, e.lngLat.lat]));
    if (lat && lng) setPoint([lng, lat]);
  });

  function confirm() { dispatch('choose', { lat, lng }); }
  function cancel() { dispatch('cancel'); }
</script>

<div class="backdrop" on:click={cancel}>
  <div class="modal" on:click|stopPropagation>
    <div class="map" bind:this={mapEl}></div>
    <div class="bar">
      <button class="pill" on:click={useMyLocation}>Use my location</button>
      <span class="coords">{lat && lng ? `${lat}, ${lng}` : 'Click map or search to choose'}</span>
      <div class="spacer"></div>
      <button class="pill ghost" on:click={cancel}>Cancel</button>
      <button class="pill primary" on:click={confirm} disabled={lat===null || lng===null}>Use this point</button>
    </div>
  </div>
</div>

<style>
  .backdrop{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.45);
    display:grid;
    place-items:center;
    z-index:1000
}

  .modal{
    width:min(900px,75vw);
    height:min(60vh,80vw);
    background:#fff;
    border-radius:16px;
    overflow:hidden;
    display:grid;
    grid-template-rows:1fr auto;
    box-shadow:0 10px 30px rgba(0,0,0,.35)
}

  .map{
    width:100%;
    height:100%
}

  .bar{
    display:flex;
    gap:.5rem;
    align-items:center;
    padding:.6rem .8rem;
    border-top:1px solid #eee
}

  .coords{
    opacity:.75;
    font-size:.9rem
}

  .spacer{
    flex:1
}

  .pill{
    height:40px;
    padding:0 .9rem;
    border-radius:999px;
    border:1.4px solid var(--outline);
    background: var(--background)
}

.pill:hover{
    background:var(--accent);
    color: var(--background);
    border-color:var(--accent)
}
.pill.primary{
    background:var(--accent);
    color:var(--background);
    border-color:var(--accent)
}

  .pill.ghost{
    background:transparent
    }
</style>
