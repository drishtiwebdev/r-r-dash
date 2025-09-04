<script>
  import { onMount, tick } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import { get } from 'svelte/store';
  import { isReturningToHome } from '$lib/stores/navigation';
  import { browser } from '$app/environment';
  import { fade, fly, slide } from 'svelte/transition';
  import '../lib/i18n/i18n.js';
  import { init, locale, t } from 'svelte-i18n';
  import { selectedCommunity } from '$lib/stores/communityProfile';
  import CommunityProfilePanel from '$lib/components/CommunityProfilePanel.svelte';
  import { base } from '$app/paths';
  import { supabase } from '$lib/supabase';

  init({
    fallbackLocale: 'en',
    initialLocale: 'en'
  });

  let sidebarOpen = false;
  let legendOpen = false;
  let showIntro = true;
  let isSlidingOut = false;
  let showOverlay = true;
  let showMainUI = false;

  let activeTab = 'risk';
  let map;
  let currentStyle = '';
  let reportPhone = '';
  let userCoords = null;
  let markerIdCounter = 0;
  let markers = [];

  // Input Form
  let lat = '';
  let lng = '';
  let name = '';
  let phone = '';
  let description = '';
  let waterCount = 0;
  let mealCount = 0;
  let mealDescription = '';
  let riceCount = 0;
  let clothesCount = 0;
  let clothesDescription = '';
  let babySuppliesCount = 0;
  let babySuppliesDescription = '';
  let medicineCount = 0;
  let medicineDescription = '';
  let hygieneCount = 0;
  let hygieneDescription = '';
  let householdCount = 0;
  let householdDescription = '';
  let evacCount = 0;

  let showCommunityLayer = true;
  let communityMarker;
  let selectedFeatureId = null;

  let riskIndexOpen = true;
  let storiesOpen = true;
  let variableLayersOpen = true;
  let communityVisible = true;

  $: tabs = [
    { id: 'risk', label: $t('Risk Map') },
    { id: 'report', label: $t('Resource Request') }
  ];

  $: if (showMainUI) {
    sidebarOpen = true;
  }

  function toggleTab(id) {
    activeTab = id;
  }

  function enterSite() {
    showIntro = false;
    setTimeout(() => {
      isSlidingOut = true;
      const overlay = document.querySelector('.intro-overlay');
      if (overlay) {
        overlay.classList.add('slide-up');
        const handleEnd = () => {
          showOverlay = false;
          showMainUI = true;
		  sidebarOpen = true;
          if (browser) sessionStorage.setItem('sawSplash', 'true');
          overlay.removeEventListener('animationend', handleEnd);
        };
        overlay.addEventListener('animationend', handleEnd);
      }
    }, 1000);
  }

  function clearFeatureState() {
    if (map && selectedFeatureId !== null) {
      map.setFeatureState(
        { source: 'community-profile-point', id: selectedFeatureId },
        { selected: false }
      );
      selectedFeatureId = null;
    }
  }
  	mapboxgl.accessToken = 'pk.eyJ1Ijoicm9sbG81MDQiLCJhIjoiY21idXBkeTExMGk3ZjJqcXVubnB2OGNvMCJ9.9hYwC_sfm7NAPCQvqLD_HA'
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	const MAPBOX_TOKEN = PUBLIC_MAPBOX_TOKEN;
  
onMount(async () => {
    await tick();

    if (browser) {
      const navEntry = performance.getEntriesByType('navigation')[0];
      const isHardReload = navEntry?.type === 'reload';
      const sawSplash = sessionStorage.getItem('sawSplash') === 'true';
      const cameFromAnotherPage = get(isReturningToHome);

      if (isHardReload || !sawSplash) {
        showIntro = true;
        showOverlay = true;
        showMainUI = true;
      } else {
        showIntro = false;
        showOverlay = false;
        showMainUI = true;
      }
    }

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [74.22891, 16.70221],
      zoom: 12,
      hash: true
    });

    window.map = map;

    // ✅ First load: base layers + recent reports
    map.on('load', async () => {
      currentStyle = 'risk';
      await loadRiskMapLayers();
      await loadRecentReports(); // ← draw saved reports on first load
    });
  });
  

  // === Risk map layers
  async function loadRiskMapLayers() {
    try {
      // --- Land Surface Temperature (LST) ---
      const responseLST = await fetch('data/klh-lst.geojson');
      const lstData = await responseLST.json();
      map.addSource('klh-lst', { type: 'geojson', data: lstData });
      map.addLayer({
        id: 'klh-lst-fill',
        type: 'fill',
        source: 'klh-lst',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'step',
            ['get', '_mean'],
            '#fee5d9', 32.44,
            '#fcae91', 32.68,
            '#fb6a4a', 32.85,
            '#de2d26', 33.26,
            '#a50f15'
          ],
          'fill-opacity': 0.7
        }
      });
      map.addLayer({
        id: 'klh-lst-outline',
        type: 'line',
        source: 'klh-lst',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#000', 'line-width': 0.25 }
      });

      const lstTip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mousemove', 'klh-lst-fill', (e) => {
        const f = e.features?.[0]; if (!f) return;
        const wardName = f.properties.Ward_Name || f.properties.ward || f.properties.name || 'Unnamed Ward';
        const mean = f.properties._mean;
        const popText = Number.isFinite(Number(mean)) ? new Intl.NumberFormat('en-IN').format(mean) : '—';
        lstTip.setLngLat(e.lngLat).setHTML(`<strong>${wardName}</strong><br/>LST (mean): ${popText} C°`).addTo(map);
      });
      map.on('mouseleave', 'klh-lst-fill', () => { lstTip.remove(); });

      // --- Kolhapur MFR (Mean Flood Level) ---
      const responseMFR = await fetch('data/kolhapur-mfr-new.geojson');
      const mfrData = await responseMFR.json();
      map.addSource('kolhapur-mfr-new', { type: 'geojson', data: mfrData });
      map.addLayer({
        id: 'kolhapur-mfr-fill',
        type: 'fill',
        source: 'kolhapur-mfr-new',
        layout: { visibility: 'none' },
        paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.25 }
      });
      map.addLayer({
        id: 'kolhapur-mfr-outline',
        type: 'line',
        source: 'kolhapur-mfr-new',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#000', 'line-width': 0 }
      });

      // --- Population Density (2011) ---
      const responsePop = await fetch('data/klh-pop-den-2011.geojson');
      const popData = await responsePop.json();
      map.addSource('klh-pop-den-2011', { type: 'geojson', data: popData });
      map.addLayer({
        id: 'klh-pop-den-2011-fill',
        type: 'fill',
        source: 'klh-pop-den-2011',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', 'Ward_Densi']],
            '#f7fbff', 5545,
            '#c6dbef', 12362,
            '#6baed6', 17668,
            '#3182bd', 33516,
            '#08519c'
          ],
          'fill-opacity': 0.55
        }
      });
      map.addLayer({
        id: 'klh-pop-den-2011-outline',
        type: 'line',
        source: 'klh-pop-den-2011',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#333', 'line-width': 0.25 }
      });

      const wardPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      const fmt = new Intl.NumberFormat('en-IN');

      map.on('mousemove', 'klh-pop-den-2011-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features && e.features[0];
        if (!f) return;
		const wardName = f.properties.Ward_Name || f.properties.ward || f.properties.name || 'Unnamed Ward';
		const totalPop = Number(f.properties.SUM_TOT_P);
		const density  = Number(f.properties.Ward_Densi);

		const popText  = Number.isFinite(totalPop) ? fmt.format(totalPop) : '—';
		const densText = Number.isFinite(density)  ? fmt.format(density)  : '—';

		wardPopup
			.setLngLat(e.lngLat)
			.setHTML(`
			<strong>${wardName}</strong>
			<br/>Total Population: ${popText} ppl
			<br/>Density: ${densText} ppl/km&sup2;
			`)
			.addTo(map);
		});

		map.on('mouseleave', 'klh-pop-den-2011-fill', () => {
		map.getCanvas().style.cursor = '';
		wardPopup.remove();
		});

      // --- Elderly pop ---
      const responsePopElderly = await fetch('data/klh-pop-den-elderly-2011.geojson');
      const popElderlyData = await responsePopElderly.json();
      map.addSource('klh-pop-den-elderly', { type: 'geojson', data: popElderlyData });
      map.addLayer({
        id: 'klh-pop-den-elderly-fill',
        type: 'fill',
        source: 'klh-pop-den-elderly',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', '_mean']],
            '#f7fbff', 2.113,
            '#c6dbef', 2.149,
            '#6baed6', 2.2,
            '#3182bd', 2.291,
            '#08519c'
          ],
          'fill-opacity': 0.55
        }
      });
      map.addLayer({
        id: 'klh-pop-den-elderly-outline',
        type: 'line',
        source: 'klh-pop-den-elderly',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#333', 'line-width': 0.25 }
      });

      const elderlyPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mousemove', 'klh-pop-den-elderly-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features && e.features[0];
        if (!f) return;
        const wardName = f.properties.Ward_Name || f.properties.ward || f.properties.name || 'Unnamed Ward';
        const elderlyPop = Number(f.properties._sum);
		const fmtInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });  // 0 decimals

		const elderlyDensity = Number(f.properties.Density);

        const popText = Number.isFinite(elderlyPop) ? fmtInt.format(elderlyPop) : '—';
		const densText = Number.isFinite(elderlyDensity) ? fmt.format(elderlyDensity) : '—';
        
		wardPopup
			.setLngLat(e.lngLat)
			.setHTML(`
			<strong>${wardName}</strong>
			<br/>Elderly Population: ${popText} ppl
			<br/>Elderly Density: ${densText} ppl/km&sup2;
			`)
			.addTo(map);
      });
      map.on('mouseleave', 'klh-pop-den-elderly-fill', () => { 
		map.getCanvas().style.cursor = ''; 
		wardPopup.remove(); });

      // --- Children pop ---
      const responsePopChildren = await fetch('data/klh-pop-den-youth-2011.geojson');
      const popChildrenData = await responsePopChildren.json();
      map.addSource('klh-pop-den-youth', { type: 'geojson', data: popChildrenData });
      map.addLayer({
        id: 'klh-pop-den-youth-fill',
        type: 'fill',
        source: 'klh-pop-den-youth',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', '_mean']],
            '#f7fbff', 1.34,
            '#c6dbef', 1.36,
            '#6baed6', 1.39,
            '#3182bd', 1.46,
            '#08519c'
          ],
          'fill-opacity': 0.55
        }
      });
      map.addLayer({
        id: 'klh-pop-den-youth-outline',
        type: 'line',
        source: 'klh-pop-den-youth',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#333', 'line-width': 0.25 }
      });

      const childrenPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

      map.on('mousemove', 'klh-pop-den-youth-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features && e.features[0];
        if (!f) return;
        
		const wardName = f.properties.Ward_Name || f.properties.ward || f.properties.name || 'Unnamed Ward';
       
		const childrenPop = Number(f.properties._sum);
		const fmtInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

		const childDensity = Number(f.properties.Density);

        const popText = Number.isFinite(childrenPop) ? fmtInt.format(childrenPop) : '—';
		const densText = Number.isFinite(Number(childDensity)) ? fmt.format(Number(childDensity)) : '—';

        wardPopup
			.setLngLat(e.lngLat)
			.setHTML(`
			<strong>${wardName}</strong>
			<br/>Children Population: ${popText} ppl
			<br/>Children Density: ${densText} ppl/km&sup2;
			`)
			.addTo(map);
      });
      map.on('mouseleave', 'klh-pop-den-youth-fill', () => { map.getCanvas().style.cursor = ''; childrenPopup.remove(); });

      // --- Women pop ---
      const responsePopWomen = await fetch('data/klh-pop-den-women-2011.geojson');
      const popWomenData = await responsePopWomen.json();
      map.addSource('klh-pop-den-women', { type: 'geojson', data: popWomenData });
      map.addLayer({
        id: 'klh-pop-den-women-fill',
        type: 'fill',
        source: 'klh-pop-den-women',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', '_mean']],
            '#f7fbff', 8.76,
            '#c6dbef', 8.91,
            '#6baed6', 9.11,
            '#3182bd', 9.49,
            '#08519c'
          ],
          'fill-opacity': 0.55
        }
      });
      map.addLayer({
        id: 'klh-pop-den-women-outline',
        type: 'line',
        source: 'klh-pop-den-women',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#333', 'line-width': 0.25 }
      });

      const womenTip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mousemove', 'klh-pop-den-women-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features?.[0]; if (!f) return;
        
		const wardName = f.properties.Ward_Name || f.properties.ward || f.properties.name || 'Unnamed Ward';

        const womenSum = Number(f.properties._sum);
		const fmtInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });  // 0 decimals
		
        const popText = Number.isFinite(Number(womenSum)) ? fmtInt.format(Number(womenSum)) : '—';
		const densText = Number.isFinite(Number(f.properties.Density)) ? fmt.format(Number(f.properties.Density)) : '—';

        wardPopup
			.setLngLat(e.lngLat)
			.setHTML(`
			<strong>${wardName}</strong>
			<br/>Women Population: ${popText} ppl
			<br/>Women Density: ${densText} ppl/km&sup2;
			`)
			.addTo(map);
      });
      map.on('mouseleave', 'klh-pop-den-women-fill', () => { map.getCanvas().style.cursor = ''; womenTip.remove(); });

      // --- NDVI ---
      const responseNDVI = await fetch('data/klh-ndvi.geojson');
      const ndviData = await responseNDVI.json();
      map.addSource('klh-ndvi', { type: 'geojson', data: ndviData });
      map.addLayer({
        id: 'klh-ndvi-fill',
        type: 'fill',
        source: 'klh-ndvi',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', '_mean']],
            '#f7fcf5', 1057,
            '#e5f5e0', 1467,
            '#c7e9c0', 1918,
            '#74c476', 2753,
            '#006d2c'
          ],
          'fill-opacity': 0.7
        }
      });
      map.addLayer({
        id: 'klh-ndvi-outline',
        type: 'line',
        source: 'klh-ndvi',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#000', 'line-width': 0.25 }
      });

      const ndviPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mousemove', 'klh-ndvi-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features && e.features[0]; if (!f) return;
        const wardName = f.properties.Ward_Name || f.properties.ward || f.properties.name || 'Unnamed Ward';
        const meanRaw = Number(f.properties._mean);
        const ndvi = Number.isFinite(meanRaw) ? meanRaw / 10000 : null;
        ndviPopup.setLngLat(e.lngLat).setHTML(`<strong>${wardName}</strong><br/>NDVI (mean): ${ndvi === null ? '—' : ndvi.toFixed(3)}`).addTo(map);
      });
      map.on('mouseleave', 'klh-ndvi-fill', () => { map.getCanvas().style.cursor = ''; ndviPopup.remove(); });

      // --- Tree cover ---
      const responseTreeCover = await fetch('data/klh-tree-cover.geojson');
      const treeCoverData = await responseTreeCover.json();
      map.addSource('klh-tree-cover', { type: 'geojson', data: treeCoverData });
      map.addLayer({
        id: 'klh-tree-cover-fill',
        type: 'fill',
        source: 'klh-tree-cover',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'step',
            ['to-number', ['get', '_mean']],
            '#f7fcf5', 4.33,
            '#e5f5e0', 5.29,
            '#c7e9c0', 7.00,
            '#74c476', 8.61,
            '#006d2c'
          ],
          'fill-opacity': 0.7
        }
      });
      map.addLayer({
        id: 'klh-tree-cover-outline',
        type: 'line',
        source: 'klh-tree-cover',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#000', 'line-width': 0.25 }
      });

      const treeCoverTip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mousemove', 'klh-tree-cover-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features && e.features[0]; if (!f) return;
        const wardName = f.properties.Ward_Name || f.properties.ward || f.properties.name || 'Unnamed Ward';
        const meanRaw = Number(f.properties._mean);
        const mean = Number.isFinite(meanRaw) ? meanRaw : null;
        treeCoverTip.setLngLat(e.lngLat).setHTML(`<strong>${wardName}</strong><br/>Tree Cover (mean): ${mean === null ? '—' : mean.toFixed(2)}`).addTo(map);
      });
      map.on('mouseleave', 'klh-tree-cover-fill', () => { map.getCanvas().style.cursor = ''; treeCoverTip.remove(); });

      // --- KLH Hospitals ---
      const responseHospitals = await fetch('data/klh-hospitals.geojson');
      const hospitalsData = await responseHospitals.json();
      map.addSource('klh-hospitals', { type: 'geojson', data: hospitalsData });

      map.loadImage(`${base}/icons/hospital-icon.png`, (err, img) => {
        if (err) { console.error('icon load failed:', err); return; }
        if (!map.hasImage('hospital-icon')) {
          map.addImage('hospital-icon', img);
        }
        if (!map.getLayer('klh-hospitals')) {
          map.addLayer({
            id: 'klh-hospitals',
            type: 'symbol',
            source: 'klh-hospitals',
            layout: {
              visibility: 'none',
              'text-field': '+',
              'text-size': 32,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-allow-overlap': true
            },
            paint: {
              'text-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                '#023cf5',
                ['boolean', ['feature-state', 'hover'], false],
                '#023cf5',
                '#023cf5'
              ],
              'text-halo-color': '#023cf5',
              'text-halo-width': 1
            }
          });
        }
      });

      const hospitalPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mousemove', 'klh-hospitals', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = e.features && e.features[0]; if (!f) return;
        const hospitalName = f.properties.name || 'Unnamed Hospital';
        const hospitalPhone = f.properties.phone || 'No phone provided';
        const hospitalWebsite = f.properties.website || 'No website provided';
        hospitalPopup.setLngLat(e.lngLat).setHTML(`<strong>${hospitalName}</strong><br/><strong>Phone:</strong> ${hospitalPhone}<br/><strong>Website:</strong> ${hospitalWebsite}<br/>*click for live links`).addTo(map);
      });
      map.on('mouseleave', 'klh-hospitals', () => { map.getCanvas().style.cursor = ''; hospitalPopup.remove(); });

      map.on('click', 'klh-hospitals', (e) => {
        const f = e.features[0];
        const name = f.properties.name || 'Unnamed Hospital';
        const phone = f.properties.phone || '';
        const website = f.properties.website || '';
        const phoneHTML = phone ? `<a href="tel:${phone.replace(/\s+/g, '')}">${phone}</a>` : '';
        const websiteHTML = website && website !== 'none' ? `<a href="${website}" target="_blank">${website}</a>` : '';
        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(`<strong>${name}</strong><br/>${phoneHTML}<br/>${websiteHTML}`).addTo(map);
      });

      // --- Community Profile Points (kept as-is) ---
      map.addSource('community-profile-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { id: 1, type: 'Feature', properties: { title: 'Shahupuri' }, geometry: { type: 'Point', coordinates: [74.235090, 16.699877] } },
            { id: 2, type: 'Feature', properties: { title: 'Chikhali' }, geometry: { type: 'Point', coordinates: [74.179973, 16.734972] } }
          ]
        }
      });

      map.addLayer({
        id: 'community-profile-layer',
        type: 'symbol',
        source: 'community-profile-point',
        layout: { 'text-field': '*', 'text-size': 42, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': true },
        paint: {
          'text-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#023cf5',
            ['boolean', ['feature-state', 'hover'], false], '#023cf5',
            '#FFFFFF'
          ],
          'text-halo-color': '#023cf5',
          'text-halo-width': 1
        }
      });

      map.addLayer({
        id: 'community-profile-layer',
        type: 'symbol',
        source: 'community-profile-point',
        layout: { 'text-field': '✚', 'text-size': 28, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-allow-overlap': true },
        paint: {
          'text-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#023cf5',
            ['boolean', ['feature-state', 'hover'], false], '#023cf5',
            '#FFFFFF'
          ],
          'text-halo-color': '#023cf5',
          'text-halo-width': 1
        }
      });

      let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      let hoveredFeatureId = null;

      map.on('mouseenter', 'community-profile-layer', (e) => {
        const feature = e.features[0];
        const coords = feature.geometry.coordinates;
        const name = feature.properties.title;

        if (hoveredFeatureId !== null) {
          map.setFeatureState({ source: 'community-profile-point', id: hoveredFeatureId }, { hover: false });
        }
        hoveredFeatureId = feature.id;
        map.setFeatureState({ source: 'community-profile-point', id: hoveredFeatureId }, { hover: true });

        popup.setLngLat(coords).setHTML(`<strong>${name}</strong><br /><small>Click for more details</small>`).addTo(map);
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'community-profile-layer', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
        if (hoveredFeatureId !== null) {
          map.setFeatureState({ source: 'community-profile-point', id: hoveredFeatureId }, { hover: false });
          hoveredFeatureId = null;
        }
      });

      map.on('click', 'community-profile-layer', (e) => {
        const feature = e.features[0];
        const featureId = feature.id;

        if (selectedFeatureId !== null && selectedFeatureId !== featureId) {
          map.setFeatureState({ source: 'community-profile-point', id: selectedFeatureId }, { selected: false });
        }

        selectedFeatureId = featureId;
        map.setFeatureState({ source: 'community-profile-point', id: selectedFeatureId }, { selected: true });

        selectedCommunity.set({ title: feature.properties.title, coords: feature.geometry.coordinates });
      });

    } catch (error) {
      console.error('Error loading risk map layers:', error);
    }
  }

  // === Find My Location
  function findMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        lat = position.coords.latitude.toFixed(5);
        lng = position.coords.longitude.toFixed(5);
      }, (err) => {
        alert('Location access denied or unavailable.');
      });
    } else {
      alert('Geolocation not supported');
    }
  }

  // === Build popup HTML for DB rows
  function popupHtmlFromRow(r) {
    let html = `
      <div class="popup-content">
        <strong>${r.name}</strong><br/>
        (${Number(r.lat).toFixed(5)}, ${Number(r.lng).toFixed(5)})<br/>
        Phone: ${r.phone}<br/>
        <p>${r.description ?? ''}</p>
    `;
    if (r.water_count > 0) html += `<p><strong>Water Needed:</strong> ${r.water_count}</p>`;
    if (r.meal_count > 0 || r.meal_description) html += `<p><strong>Meals Needed:</strong> ${r.meal_count}${r.meal_description ? ' ('+r.meal_description+')' : ''}</p>`;
    if (r.clothes_count > 0 || r.clothes_description) html += `<p><strong>Clothes Needed:</strong> ${r.clothes_count}${r.clothes_description ? ' ('+r.clothes_description+')' : ''}</p>`;
    if (r.baby_supplies_count > 0 || r.baby_supplies_description) html += `<p><strong>Baby Supplies Needed:</strong> ${r.baby_supplies_count}${r.baby_supplies_description ? ' ('+r.baby_supplies_description+')' : ''}</p>`;
    if (r.medicine_count > 0 || r.medicine_description) html += `<p><strong>Medicine Needed:</strong> ${r.medicine_count}${r.medicine_description ? ' ('+r.medicine_description+')' : ''}</p>`;
    if (r.hygiene_count > 0 || r.hygiene_description) html += `<p><strong>Hygiene Supplies Needed:</strong> ${r.hygiene_count}${r.hygiene_description ? ' ('+r.hygiene_description+')' : ''}</p>`;
    if (r.household_count > 0 || r.household_description) html += `<p><strong>Household Items Needed:</strong> ${r.household_count}${r.household_description ? ' ('+r.household_description+')' : ''}</p>`;
    if (r.evac_count > 0) html += `<p><strong>Evacuation Needed:</strong> ${r.evac_count}</p>`;
    html += `</div>`;
    return html;
  }

  // === Load recent reports from Supabase and render markers
  async function loadRecentReports() {
    // clear previous markers to avoid duplicates
    for (const m of markers) m.remove();
    markers = [];

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('Load failed:', error); return; }

    data.forEach(r => {
      const mk = new mapboxgl.Marker({ color: '#023cf5' })
        .setLngLat([r.lng, r.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtmlFromRow(r)))
        .addTo(map);
      markers.push(mk);
    });
  }

  // === Submit a report
  async function submitReport() {
    if (!lat || !lng || !name || !phone) {
      alert('Please complete all fields.');
      return;
    }

    const payload = {
      lat: parseFloat(lat), lng: parseFloat(lng), name, phone, description,
      water_count: waterCount,
      meal_count: mealCount, meal_description: mealDescription,
      clothes_count: clothesCount, clothes_description: clothesDescription,
      baby_supplies_count: babySuppliesCount, baby_supplies_description: babySuppliesDescription,
      medicine_count: medicineCount, medicine_description: medicineDescription,
      hygiene_count: hygieneCount, hygiene_description: hygieneDescription,
      household_count: householdCount, household_description: householdDescription,
      evac_count: evacCount
    };

    const { error } = await supabase.from('reports').insert(payload);
    if (error) {
      console.error('Insert failed:', error);
      alert('Could not save report. Please try again.');
      return;
    }

    // Refresh markers from DB so the new one appears (RLS ensures last 30 days only)
    await loadRecentReports();
  }

	// helper: show/hide all report markers (Marker DOM elements)
	function setReportMarkersVisible(visible) {
	markers.forEach((m) => {
		m.getElement().style.display = visible ? '' : 'none';
	});
	}

	$: if (map && activeTab && activeTab !== currentStyle) {
	currentStyle = activeTab;
	map.setStyle('mapbox://styles/mapbox/light-v10');

	map.once('styledata', async () => {
		if (activeTab === 'risk') {
		await loadRiskMapLayers();
		// hide all pins on Risk
		setReportMarkersVisible(false);
		setNgoMarkersVisible(false);
		} else if (activeTab === 'report') {
		await loadReportMapLayers();
		// (re)load pins only on Report
		await loadRecentReports();
		await loadNgoReports();
		setReportMarkersVisible(true);
		setNgoMarkersVisible(true);
		}
	});
	}
	



  // === Citizen report layers
  async function loadReportMapLayers() {
    try {
      const responseWard = await fetch('data/kolhapur-wards-fixed.geojson');
      const wardRiskData = await responseWard.json();
      console.log('Sample coord:', wardRiskData.features[0].geometry.coordinates[0][0][0]);

      map.addSource('kolhapur-wards-fixed', { type: 'geojson', data: wardRiskData });
      map.addLayer({
        id: 'kolhapur-wards-hover-fill',
        type: 'fill',
        source: 'kolhapur-wards-fixed',
        layout: {},
        paint: { 'fill-color': '#e0e0e0', 'fill-opacity': 0.6 },
        filter: ['==', 'Ward_Name', ''] // Start with empty filter
      });
      map.addLayer({
        id: 'kolhapur-wards-outline',
        type: 'line',
        source: 'kolhapur-wards-fixed',
        paint: { 'line-color': '#8c8c8c', 'line-width': .5 }
      });
      map.addLayer({
        id: 'kolhapur-wards-hover',
        type: 'fill',
        source: 'kolhapur-wards-fixed',
        paint: { 'fill-color': '#000000', 'fill-opacity': 0 }
      });

      let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

      map.on('mousemove', 'kolhapur-wards-hover', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const coordinates = e.lngLat;
        const wardName = feature.properties.Ward_Name || 'Unnamed Ward';
        popup.setLngLat(coordinates).setHTML(`<strong>${wardName}</strong>`).addTo(map);
      });

      map.on('mouseleave', 'kolhapur-wards-hover', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      let hoveredWardName = null;
      map.on('mousemove', 'kolhapur-wards-hover', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const coordinates = e.lngLat;
        const wardName = feature.properties.Ward_Name || 'Unnamed Ward';

        popup.setLngLat(coordinates).setHTML(`<strong>${wardName}</strong>`).addTo(map);

        if (hoveredWardName !== wardName) {
          hoveredWardName = wardName;
          map.setFilter('kolhapur-wards-hover-fill', ['==', 'Ward_Name', wardName]);
        }
      });

      map.on('mouseleave', 'kolhapur-wards-hover', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
        hoveredWardName = null;
        map.setFilter('kolhapur-wards-hover-fill', ['==', 'Ward_Name', '']);
      });

    } catch (error) {
      console.error('Error loading report map layers:', error);
    }
  }

  // --- NGO markers (JS-only) ---
  let ngoMarkers = [];

  function markerFromSvg(path, size = 34) {
    const el = document.createElement('img');
    el.src = `${base}${path}`;   // works with GitHub Pages base path
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.transform = 'translateY(-4px)'; // small lift
    return el;
  }

  function setNgoMarkersVisible(show) {
    ngoMarkers.forEach((m) => {
      m.getElement().style.display = show ? '' : 'none';
    });
  }

  async function loadNgoReports() {
    // clear old markers
    ngoMarkers.forEach((m) => m.remove());
    ngoMarkers = [];

    const { data, error } = await supabase
      .from('ngo_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('NGO load failed:', error);
      return;
    }

    data.forEach((r) => {
      const el = markerFromSvg('/icons/help-pin.svg', 36); // your custom icon
      const mk = new mapboxgl.Marker({ element: el })
        .setLngLat([r.lng, r.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<strong>${r.org_name ?? 'NGO'}</strong><br/>
             (${Number(r.lat).toFixed(5)}, ${Number(r.lng).toFixed(5)})<br/>
             ${r.contact_phone ? `Phone: ${r.contact_phone}<br/>` : ''}
             ${r.description ? `<p>${r.description}</p>` : ''}
             <div style="margin-top:.25rem">
               ${r.water_available ? `Water: ${r.water_available}<br/>` : ''}
               ${r.meals_available ? `Meals: ${r.meals_available}<br/>` : ''}
               ${r.medicine_available ? `Medicine: ${r.medicine_available}<br/>` : ''}
               ${r.hygiene_available ? `Hygiene: ${r.hygiene_available}<br/>` : ''}
               ${r.shelter_capacity ? `Shelter cap: ${r.shelter_capacity}` : ''}
             </div>`
          )
        )
        .addTo(map);

      ngoMarkers.push(mk);
    });
  }


  function toggleLayer(...layerIds) {
    for (const layerId of layerIds) {
      if (map.getLayer(layerId)) {
        const visibility = map.getLayoutProperty(layerId, 'visibility');
        map.setLayoutProperty(layerId, 'visibility', visibility === 'none' ? 'visible' : 'none');
      }
    }
  }
</script>



<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" rel="stylesheet" />
</svelte:head>

{#if showIntro || showOverlay}
	<div class="intro">
		{#if showIntro}
			<div class="intro-overlay">
				<div class="intro-box" out:fade={{ duration: 800 }}>
					<h2>Risk + Resiliency</h2>
					<h3>Disaster recovery in the city of Kolhapur</h3>
					<p>
						This dashboard maps climate risk through layered spatial data and community narratives, offering a multi-scalar understanding of vulnerability across the city. 
						It also proposes a citizen-led reporting system to improve coordination of grassroots disaster relief by leveraging AI chatbots, real-time maps, and SMS alerts.
					</p>
					<button on:click={enterSite}>Enter</button>
				</div>
									<video class="splash-video" autoplay muted loop playsinline>
						<source src="./video/kolhapur-intro.mp4" type="video/mp4" />
					</video>
			</div>
		{/if}
	</div>
{/if}
<CommunityProfilePanel clearFeatureState={clearFeatureState} />
<!-- Sidebar Container (always rendered) -->
<div class="sidebar-container">
	{#if showMainUI}
		<!-- Sidebar Layout -->
		<div class="sidebar {sidebarOpen ? '' : 'hidden'}">
			{#each tabs as tab (tab.id)}
				<div class="accordion-tab">
					<button class="accordion-header" on:click={() => toggleTab(tab.id)}>
						{tab.label}
						<span>{activeTab === tab.id ? '-' : '+'}</span>
					</button>

					{#if activeTab === tab.id}
						<div class="accordion-body" transition:slide>
							{#if tab.id === 'risk'}
					
								<p class="description">{$t('*Toggle the following layers to see areas of overlapping climate risk.')}</p>
						<div class="risk-scrollable">
						<!-- Risk Index -->
						<button type="button" class="header" on:click={() => riskIndexOpen = !riskIndexOpen}>
							{riskIndexOpen ? '-' : '+'} {$t('Risk Index')}
						</button>
						{#if riskIndexOpen}
							<div class="layer-toggle">
								<!-- Your risk index layer toggles go here -->
							</div>
						{/if}

						<!-- Stories -->
						<button type="button" class="header" on:click={() => storiesOpen = !storiesOpen}>
							{storiesOpen ? '-' : '+'} {$t('Stories')}
						</button>
						{#if storiesOpen}
							<div class="layer-toggle">
								<label>
									<input
										type="checkbox"
										bind:checked={communityVisible}
										on:change={() => {
											map.setLayoutProperty(
												'community-profile-layer',
												'visibility',
												communityVisible ? 'visible' : 'none'
											);
										}}
									/>
									{$t('Community Profiles')}
								</label>								
							</div>
						{/if}

						<!-- Variable Layers -->
						<button type="button" class="header" on:click={() => variableLayersOpen = !variableLayersOpen}>
							{variableLayersOpen ? '-' : '+'} {$t('Variable Layers')}
						</button>
						{#if variableLayersOpen}
							<div class="layer-toggle">
								<!-- Kolhapur LST (Land Surface Temperature) -->
								<label>
									<input
										type="checkbox"
										on:change={() => toggleLayer('klh-lst-fill', 'klh-lst-outline')}
									/>
									Land Surface Temperature (LST)
									</label>
									<div class="legend-gradient" style="
									width:150px;height:12px;border:1px solid #aaa;margin:0 0 2px 1.5rem;
									background: linear-gradient(to left,#A50F15,#DE2D26,#FB6A4A,#FCAE91,#FEE5D9);
									"></div>
									<div class="legend-labels">
									<span>Low</span><span>C°</span><span>High</span>
									</div>
								
									<!-- Kolhapur AVG Hottest Ward -->
								 <!---
								<label>
									<input type="checkbox" checked on:change={() => toggleLayer('kolhapur-heat-risk-fill', 'kolhapur-heat-risk-outline')} />
									Avg Hottest Wards - April
								</label>
								<div class="legend-gradient heat-legend"></div>
								<div class="legend-labels">
									<span>Low</span>
									<span>High</span>
								</div> -->
								
								<!-- Kolhapur Pop Density -->
								<label>
								<input
									type="checkbox"
									on:change={() => toggleLayer('klh-pop-den-2011-fill', 'klh-pop-den-2011-outline')}
								/>
								Population Density (2011)
								</label>
								<div class="legend-gradient" style="
								width:150px;height:12px;border:1px solid #aaa;margin:0 0 2px 1.5rem;
								background: linear-gradient(to left,#08519c,#3182bd,#6baed6,#c6dbef,#f7fbff);
								"></div>
								<div class="legend-labels">
								<span>Low</span><span>ppl/km²</span><span>High</span>
								</div>

								<!-- Kolhapur Pop Density Elderly-->
								<label>
									<input
										type="checkbox"
										on:change={() => toggleLayer('klh-pop-den-elderly-fill', 'klh-pop-den-elderly-outline')}
									/>
									Elderly Population Density (65+ years)
								</label>
								<div class="legend-gradient" style="
								width:150px;height:12px;border:1px solid #aaa;margin:0 0 2px 1.5rem;
								background: linear-gradient(to left,#08519c,#3182bd,#6baed6,#c6dbef,#f7fbff);
								"></div>
								<div class="legend-labels">
								<span>Low</span><span>ppl/km²</span><span>High</span>
								</div>

								<!-- Kolhapur Pop Density Children-->
								<label>
									<input
										type="checkbox"
										on:change={() => toggleLayer('klh-pop-den-youth-fill', 'klh-pop-den-youth-outline')}
									/>
									Children Population Density (5 years)
								</label>
								<div class="legend-gradient" style="
								width:150px;height:12px;border:1px solid #aaa;margin:0 0 2px 1.5rem;
								background: linear-gradient(to left,#08519c,#3182bd,#6baed6,#c6dbef,#f7fbff);
								"></div>
								<div class="legend-labels">
								<span>Low</span><span>ppl/km²</span><span>High</span>
								</div>

								<!-- Kolhapur Pop Density Women -->
								<label>
									<input
										type="checkbox"
										on:change={() => toggleLayer('klh-pop-den-women-fill', 'klh-pop-den-women-outline')}
										/>
									Women Population Density 
								</label>	
								<div class="legend-gradient" style="
								width:150px;height:12px;border:1px solid #aaa;margin:0 0 2px 1.5rem;
								background: linear-gradient(to left,#08519c,#3182bd,#6baed6,#c6dbef,#f7fbff);
								"></div>
								<div class="legend-labels">
								<span>Low</span><span>ppl/km²</span><span>High</span>
								</div>

								<!--- Kolhapur NDVI -->
								<label>
									<input
										type="checkbox"
										on:change={() => toggleLayer('klh-ndvi-fill', 'klh-ndvi-outline')}
									/>
									Normalized Difference Vegetation Index (NDVI)
								</label>
								<div class="legend-gradient" style="
								width:150px;height:12px;border:1px solid #aaa;margin:0 0 2px 1.5rem;
								background: linear-gradient(to right, #f7fcf5, #e5f5e0, #c7e9c0, #74c476, #006d2c);
								"></div>
								<div class="legend-labels">
								<span>Low</span><span>High</span>
								</div>

								<!-- Kolhhapur Tree Cover -->
								<label>
								<input
									type="checkbox"
									on:change={() => toggleLayer('klh-tree-cover-fill','klh-tree-cover-outline')}
								/>
								Tree Cover
								</label>
								<div class="legend-gradient" style="
								width:150px;height:12px;border:1px solid #aaa;border-radius:3px;
								margin:0 0 2px 1.5rem;
								background: linear-gradient(to right, #f7fcf5, #e5f5e0, #c7e9c0, #74c476, #006d2c);
								"></div>
								<div class="legend-labels"><span>Low</span><span>High</span></div>

								
								<!-- Kolhapur MFL -->
								<label>
									<input type="checkbox"  
									on:change={() => toggleLayer('kolhapur-mfr-fill', 'kolhapur-mfr-outline')} />
									Mean Flood Level
								</label>
								<div class="legend-swatch flood-swatch"></div>
								</div>

								<!-- Kolhapur Hospitals -->
								<label>
								<input
									type="checkbox"
									on:change={() => toggleLayer('klh-hospitals')}
								/>
								Hospitals
								</label>
						{/if}
							</div>
							{/if}

							{#if tab.id === 'report'}
							<div class="citizen-data-panel">
								<p class="description">{$t('Experiencing a climate related crisis? Fill out the following form to report your immediate needs to different NGO and Disaster Management teams.')}</p>
								<div class="citizen-scrollable">
									<!-- Citizen Data Form -->
										<div class="form-group">
											<button class="location-button" on:click={findMyLocation}>
												<img src="icons/noun-crosshair-627572.svg" alt="Find Location" class="location-icon" />
												<span>Find My Location</span>
											</button>

											<!-- Auto-filled Lat/Lng Boxes -->
											<div class="coord-fields">
												<input type="text" bind:value={lat} readonly placeholder="Latitude" />
												<input type="text" bind:value={lng} readonly placeholder="Longitude" />
											</div>

											<!-- Name + Phone Inputs -->
											<input type="text" bind:value={name} placeholder="Name" />
											<input type="tel" bind:value={phone} placeholder="Phone #" />

											<input type="text" bind:value={description} placeholder="Landmarks, nearby shops, building color..." class="description-input" />
											
											<!-- Resources -->
											<div class="resource-list">
												<!-- Water Request Card -->
												<div class="resource-card">
													<img src={`${base}/icons/bottled-water.svg`} alt="Water Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Water</h4>
														<div class="counter-row">
															<button type="button" on:click={() => waterCount = Math.max(0, waterCount - 1)}>−</button>
															<span>{waterCount} liters</span>
															<button type="button" on:click={() => waterCount++}>+</button>
														</div>
													</div>
												</div>

												<!-- Meals Request Card -->
												<div class="resource-card">
													<img src={`${base}/icons/food-tray.svg`} alt="Ready-to-Eat Meals Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Ready to Eat Meals</h4>
														
														<!-- Input instead of paragraph -->
														<textarea
															rows="2"
															placeholder="Include sizes, types, etc."
															bind:value={mealDescription}
															class="resource-input"
														/>

														<div class="counter-row">
															<button type="button" on:click={() => mealCount = Math.max(0, mealCount - 1)}>−</button>
															<span>{mealCount} packs</span>
															<button type="button" on:click={() => mealCount++}>+</button>
														</div>
													</div>
												</div>

												<!-- Clothes -->
												<div class="resource-card">
													<img src={`${base}/icons/saree.svg`} alt="Clothes Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Clothes</h4>

														<!-- Input instead of paragraph -->
														<textarea
															rows="2"
															placeholder="Include sizes, types, etc."
															bind:value={clothesDescription}
															class="resource-input"
														/>

														<div class="counter-row">
															<button type="button" on:click={() => clothesCount = Math.max(0, clothesCount - 1)}>−</button>
															<span>{clothesCount} sets</span>
															<button type="button" on:click={() => clothesCount++}>+</button>
														</div>
													</div>
												</div>

												<!-- Baby Supplies -->
												<div class="resource-card">
													<img src={`${base}/icons/baby-supplies.svg`} alt="Baby Supplies Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Baby Supplies</h4>

														<!-- Input instead of paragraph -->
														<textarea
															rows="2"
															placeholder="I need baby food, diapers, etc."
															bind:value={babySuppliesDescription}
															class="resource-input"
														/>

														<div class="counter-row">
															<button type="button" on:click={() => babySuppliesCount = Math.max(0, babySuppliesCount - 1)}>−</button>
															<span>{babySuppliesCount} packs</span>
															<button type="button" on:click={() => babySuppliesCount++}>+</button>
														</div>
													</div>
												</div>

												<!-- Medicine -->
												<div class="resource-card">
													<img src={`${base}/icons/medicine.svg`} alt="Medicine Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Medicine</h4>

														<!-- Input instead of paragraph -->
														<textarea
															rows="2"
															placeholder="Input medical needs, prescriptions, etc."
															bind:value={medicineDescription}
															class="resource-input"
														/>

														<div class="counter-row">
															<button type="button" on:click={() => medicineCount = Math.max(0, medicineCount - 1)}>−</button>
															<span>{medicineCount} kits</span>
															<button type="button" on:click={() => medicineCount++}>+</button>
														</div>
													</div>
												</div>

												<!-- Hygiene -->
												<div class="resource-card">
													<img src={`${base}/icons/hygiene.svg`} alt="Hygiene Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Hygiene</h4>

														<!-- Input instead of paragraph -->
														<textarea
															rows="2"
															placeholder="I need toothpaste, sanitary pads, etc."
															bind:value={hygieneDescription}
															class="resource-input"
														/>

														<div class="counter-row">
															<button type="button" on:click={() => hygieneCount = Math.max(0, hygieneCount - 1)}>−</button>
															<span>{hygieneCount} kits</span>
															<button type="button" on:click={() => hygieneCount++}>+</button>
														</div>
													</div>
												</div>

												<!-- Household Items -->
												<div class="resource-card">
													<img src={`${base}/icons/cleaning-supplies.svg`} alt="Household Items Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Household Items</h4>

														<!-- Input instead of paragraph -->
														<textarea
															rows="2"
															placeholder="I need brooms, buckets, etc."
															bind:value={householdDescription}
															class="resource-input"
														/>

														<div class="counter-row">
															<button type="button" on:click={() => householdCount = Math.max(0, householdCount - 1)}>−</button>
															<span>{householdCount}</span>
															<button type="button" on:click={() => householdCount++}>+</button>
														</div>
													</div>
												</div>

												<!-- Evacuation -->
												<div class="resource-card">
													<img src={`${base}/icons/evacuation.svg`} alt="Evacuation Icon" class="resource-icon" />
													<div class="resource-content">
														<h4>Evacuation</h4>
														<div class="counter-row">
															<button type="button" on:click={() => evacCount = Math.max(0, evacCount - 1)}>−</button>
															<span>{evacCount} people</span>
															<button type="button" on:click={() => evacCount++}>+</button>
														</div>
													</div>
												</div>
											</div>
										</div>

										<!-- Submit Button -->
										<button class="submit-button" on:click={submitReport}>Submit</button>
									</div>
								</div>

								{#if userCoords}
									<p class="coords-output">Latitude: {userCoords.lat.toFixed(5)}, Longitude: {userCoords.lng.toFixed(5)}</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Toggle Button: always visible -->
	<button
		type="button"
		class="toggle-button"
		on:click={() => {
			sidebarOpen = !sidebarOpen;
				showMainUI = sidebarOpen;
		}}
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				sidebarOpen = !sidebarOpen;
				e.preventDefault();
			}
		}}
		aria-pressed={sidebarOpen}
	>
		{#if sidebarOpen}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
		{:else}
			<div class="sidebar-vertical-text">{$t('tools')}</div>
		{/if}
	</button>
</div>

		<!-- Legend Toggle -->
		<!--
		<div
			class="legend-toggle-button {legendOpen ? 'legend-open' : 'legend-closed'}"
			on:click={() => (legendOpen = !legendOpen)}
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					legendOpen = !legendOpen;
					e.preventDefault();
				}
			}}
			tabindex="0"
			role="button"
			aria-pressed={legendOpen}
		>
			{#if legendOpen}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-legend">
					<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
				</svg>
			{:else}
				<div class="vertical-text">{$t('legend')}</div>
			{/if}
		</div>

		
		<div class="legend-panel {legendOpen ? '' : 'collapsed'}">
			<h4>{$t('legend')}</h4>
			<div class="legend-item">
				<div class="legend-line" style="background-color: red;"></div>
				<span>{$t('district boundary')}</span>
			</div>
			
		</div>
		-->
<!-- Mapbox Map (should be outside of the conditionals) -->
<div class="map-container">
	<div id="map"></div>
</div>


<style>
	:root{
		--sidebar-width: 335px;
		--sidebar-height: 80vh;
		--legend-width: 220px;
		--sidebar-margin: 24px;
	}

	/* === TOOLBAR BUTTON=== */
	.toggle-button {
		position: absolute;
		top: 50%;
		left: 100%;
		transform: translateY(-50%);
		width: 1.6rem;
		height: 6rem;
		background-color: var(--background);
		color: var(--accent);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--outline);
		border-radius: 50px;
		transition: background-color 0.3s ease;
	}

	.sidebar-vertical-text {
		transform: rotate(-90deg);
		white-space: nowrap;
		font-size: 0.75rem;
		font-family: 'PP Neue Machina Regular', sans-serif;
		color: var(--accent);
	}

	.toggle-button:hover {
		background-color: var(--accent);
		color: var(--background);
		border-right: solid 2px var(--outline);
		border-top: solid 2px var(--outline);
		border-bottom: solid 2px var(--outline);
	}



	.icon {
	    width: 1rem;
	    height: 1rem;
	    stroke: var(--accent);
    }

    /* === TOOLBAR === */
	.sidebar-container {
		position: relative;
		width: fit-content;
		height: 100%;
	}

	.sidebar-container,
	.toggle-button {
		z-index: 101;
	}


  	.sidebar {
		position: absolute;
		left: 0;
		top: 0;
		height: var(--sidebar-height);
		width: var(--sidebar-width);
		background-color: var(--background);
		color: var(--accent);
		display: flex;
		flex-direction: column;
		padding: 0;
		font-family: sans-serif;
		border: solid 2px var(--outline) !important;
		border-radius: 35px;
		overflow: hidden;
		justify-content: flex-start;
		margin-left: 1.5rem;
		transform: translateX(0%);
		transition: transform 1.6s ease-in-out, margin-left 1.6s ease-in-out;
		z-index: 20;
 	}

    .sidebar.hidden {
		transform: translateX(calc(-100% - 1.5rem));
		transition: transform 1.6s ease-in-out;
	}

	.accordion-tab {
		flex-shrink: 0;
		border-bottom: 2px solid var(--outline);
	}

	
	.accordion-header {
		width: 100%;
		background: var(--background);
		color: var(--outline);
		text-align: left;
		padding: 1rem;
		font-size: 1rem;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: 'pp Neue Machina Bold', sans-serif;
	}

	.accordion-header:hover {
		background: var(--accent);
		color: var(--background);
		border-right: solid 2px var(--accent);
	}

	.accordion-body {
		background: var(--background);
		color: var(--outline);
		padding: 1rem;
		height: calc(var(--sidebar-height) - 6.4rem);
		background-color: rgb(244, 244, 244);
		font-size: 0.9rem;
		font-family: 'PP Neue Machina Regular', sans-serif;
	}

	.description{
		color: var(--accentgrey);
		margin-bottom: .5rem;
	}

	.header {
		font-weight: 600;
		cursor: pointer;
		font-weight: bold;
		user-select: none;
		margin-top: 0.75rem;
		border: none;
		display: flex;
	}

	.header:hover {
		color: var(--accent);
	}

	label {
		font-size: .8rem;
	}

	/* Legend common styles */
	.legend-gradient,
	.legend-swatch {
		margin-left: 1.5rem;
		margin-top: 0.25rem;
		margin-bottom: 0.75rem;
		border-radius: 3px;
	}

	/* Flood Swatch Legend */
	.flood-swatch {
		width: 24px;
		height: 12px;
		background-color: #3b83f63b; /* Same as your map fill color */
		border: 1px solid #aaa;
	}

	.legend-labels {
		display: flex;
		justify-content: space-between;
		margin-left: 1.5rem;
		font-size: 0.5rem;
		color: var(--accentgrey);
		width: 150px;
	}

	input[type="checkbox"] {
		accent-color: var(--accent); /* or whatever blue you prefer */
	}

	input[type="checkbox"]:hover {
		cursor: pointer;
		accent-color: var(--hover);
	}

	/* === MAP BODY === */	
    .map-container {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 0;
    }

    #map {
        width: 100%;
        height: 100%;
    }

	.risk-scrollable {
		max-height: calc(100vh - 328px); /* adjust depending on header height */
		overflow-y: scroll;
		padding-right: 0.5rem;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	
	/* === CITIZEN DATA === */
	/* === LOCATION BUTTON === */
	.citizen-scrollable {
		max-height: calc(100vh - 328px); /* adjust depending on header height */
		overflow-y: scroll;
		padding-right: 0.5rem;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.citizen-scrollable::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 1rem;
	}

	.coord-fields {
		display: flex;
		gap: 0.5rem;
	}

	.coord-fields input {
		flex: 1;
		text-align: center;
	}

	input[type="text"],
	input[type="tel"] {
		padding: 0.5rem;
		font-size: .8rem;
		border: 1px solid var(--outline);
		border-radius: 6px;
		width: 100%;
	}

	.description-input {
		width: 100%;
		padding: 0.75rem;
		margin-top: 0rem;
		border: 1px solid black;
		border-radius: 0.5rem;
		font-family: inherit;
		resize: none;
		box-sizing: border-box;
		margin-bottom: 0.75rem;
		}

	.submit-button {
		background-color: var(--outline);
		color: var(--background);
		padding: 0.6rem;
		width: 100%;
		margin-bottom: 1.6rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: bold;
	}

	.submit-button:hover {
		background-color: var(--accent);
	}

	.location-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0rem;
		border: 1px solid var(--outline);
		border-radius: 8px;
		cursor: pointer;
		background-color: var(--white);
	}

	.location-button:hover {
		background-color: var(--accent);
		color: var(--background);
	}

	.location-icon {
		width: 40px;
		height: 40px;
	}
	
	/* === RESOURCE CARDS === */
	.resource-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.resource-card {
		display: flex;
		align-items: flex-start;
		gap: .6rem;
		padding: 1rem;
		border-radius: 1rem;
		background: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
		margin-bottom: 0.75rem;
	}

	.resource-icon {
		width: 60px;
		height: 60px;
		object-fit: contain;
	}

	.resource-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding-right: 16px;
	}

	.resource-content h4 {
		margin: 0 0 0.5rem 0;
		font-family: 'PP Neue Machina Bold', sans-serif;
		font-size: .8rem;
		color: var(--text-dark);
	}

	.resource-input {
		font-size: 0.6rem;
		color: #666;
		width: 100%;
		border: 1px solid var(--outline);
		border-radius: 0.4rem;
		padding: 0.4rem 0.6rem;
		font-family: inherit;
		margin-bottom: 0.5rem;
		margin-right: 1rem;
		box-sizing: border-box;
		resize: none;
	}

	.counter-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.counter-row button {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.3rem;
		border: 1px solid var(--outline);
		background-color: white;
		color: var(--accent);
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.counter-row button:hover {
		background-color: var(--accent);
		color: var(--background);
	}

	.counter-row span {
		font-size: .75rem;
		min-width: 20px;
		text-align: center;
		font-family: 'PP Neue Machina Regular', sans-serif;
	}



	/* === MAP LEGEND === */
	/*
	.legend-panel {
		position: absolute;
		top: 50%;
		right: 0;
		width: var(--legend-width);
		height: 500px;
		background-color: var(--white);
		color: var(--black);
		padding: 1rem;
		z-index: 3;
		font-size: 1 rem;
		font-family: 'PP Neue Machina Bold', sans-serif;
		border-left: solid 2px var(--black);
		border-top: solid 2px var(--black);
		border-bottom: solid 2px var(--black);

		transition: transform 1.6s ease;
	}

	.legend-panel.collapsed {
		transform: translateX(100%);
	}

	.legend-toggle-button {
		position: absolute;
		top: 80%;
		width: 2rem;
		height: 6rem;
		background-color: var(--white);
		color: var(--blue);
		cursor: pointer;
		z-index: 4;
		display: flex;
		align-items: center;
		justify-content: center;
		border-left: solid 2px var(--black);
		border-top: solid 2px var(--black);
		border-bottom: solid 2px var(--black);

		transform: translateY(-50%);
		transition: right 1.6s ease;
	}

	:global(.legend-toggle-button.legend-open) {
		right: var(--legend-width);
	}

	:global(.legend-toggle-button.legend-closed) {
		right: 0;
	}

	:global(.legend-open){
		right: var(--legend-width);
	}

	.legend-toggle-button:hover {
		background-color: var(--blue);
		color: var(--white);
	}

	.vertical-text {
		transform: rotate(-90deg);
		white-space: nowrap;
		font-size: 0.75rem;
		font-family: 'PP Neue Machina Regular', sans-serif;
	}

	.icon-legend {
		width: 1rem;
		height: 1rem;
		stroke: var(--blue);
	}

	.legend-item {
		display: flex;
		align-items: center;
		margin-top: 0.75rem;
		font-size: 0.75rem;
		font-family: 'PP Neue Machina Regular', sans-serif;
	}

	.legend-line {
		width: 30px;
		height: 3px;
		margin-right: 0.5rem;
	}
	*/

    /* INTRO SPLASH SCREEN */
	.splash-video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		object-fit: cover;
		z-index: -1;
		opacity: 0.8;
	}

	.intro-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 100000;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: sans-serif;

		background-color: rgba(255, 255, 255, 0.85); /* faded white */
		backdrop-filter: blur(5px); /* soft blur */
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* subtle depth */

		/* optional polish */
		transition: background-color 0.6s ease-in-out;
	}
	
	.intro-overlay::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgb(0, 0, 0);
		z-index: -1;
	}
    
	.intro-box {
		max-width: 650px;
		padding: 2rem;
		text-align: center;
		border-radius: 20px;
		color: var(--background);
		text-decoration: glow;
		/*background-color: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); */
	}

    .intro-box h2 {
        font-family: 'PP Neue Machina Bold', sans-serif;
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .intro-box h3 {
		font-family: 'PP Neue Machina Regular', sans-serif;
		font-size: 1.2rem;
		margin-bottom: 1rem;
	}

    .intro-box p {
        font-family: 'PP Neue Machina Regular', sans-serif;
        font-size: 1rem;
        line-height: 1.5;
        margin-bottom: 1.5rem;
    }

	.intro-box button {
		background: none;
		color: var(--background);
		border-radius: 20px;
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--background);
		cursor: pointer;
		font-weight: bold;
	}

	.intro-box button:hover {
		background: var(--background);
		color: var(--outline);
	}

	.layer-toggle {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.85rem;
	}
	
	.layer-toggle label {
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	 /* === 
	.slide-up {
		animation: slideUp 1s ease-in-out forwards;
	}

	@keyframes slideUp {
		from {
			transform: translateY(0%);
			opacity: .8;
		}
		to {
			transform: translateY(-100%);
			opacity: 0;
		}
	} === */

	@media (max-width: 768px) {
		:root{
			--sidebar-width: 250px;
			--legend-width: 180px;
			--sidebar-height: 70vh;
		}

		.accordion-body{
			height: calc(var(--sidebar-height) - 6.4rem)
		}

		.sidebar {
			width: 250px;
			height: var(--sidebar-height);
			border-radius: 20px;
			margin-left: 1rem;
			margin-top: 1rem;
 		}

		.sidebar.hidden {
			transform: translateX(calc(-100% - 1rem));
			transition: transform 1.6s ease-in-out;
		}

		.toggle-button {
			top: 40%;
			width: 2rem;
			width: 1.1rem;
		}

		.risk-scrollable, .citizen-scrollable {
			max-height: calc(100vh - 420px); /* adjust depending on header height */
		}

		.description{
			font-size: .8rem;
		}

		.header {
			font-size: .7rem;
			color: var(--outline);
		}
	
	}
</style>
