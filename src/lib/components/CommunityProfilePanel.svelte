<script>
	import { selectedCommunity } from '$lib/stores/communityProfile';
	export let clearFeatureState;

	function closeProfilePanel() {
		selectedCommunity.set(null);
		if (typeof clearFeatureState === 'function') {
			clearFeatureState();
		}
	}
</script>

{#if $selectedCommunity}
	<div class="profile-panel">
		<button class="close-button" on:click={closeProfilePanel}>×</button>
		<h2>{$selectedCommunity.title}</h2>

		{#if $selectedCommunity.title === 'Shahupuri'}
			<video class="profile-video"
				src="{import.meta.env.BASE_URL + 'video/100.mp4'}"
				autoplay
				muted
				loop
				controls
				playsinline
				preload="metadata"
				style="width: 100%; border-radius: 12px;"
			>
			<track
				src="{import.meta.env.BASE_URL + 'video/100.vtt'}"
				kind="captions"
				srclang="en"
				label="English"
				default
			/>
			</video>
			<p class="caption">Video of channelized Jayanti Nala in Shahupuri, Kolhapur</p>
			<br>
			<p class="qoute">“We don’t wait for the government to warn us — we watch the nallah.”</p>
			<br>
			<div class="body-text">
				Shahupuri, a dense ward nestled in central Kolhapur, is one of the city’s most chronically flood-affected areas. It’s the first to flood when monsoon waters rise and often the last to dry out. From 2–4 feet of water in a “normal” year to 12 feet during major floods, Shahupuri lives with the certainty of water entering homes, workplaces, and lives.
				<br>
				<img
				src="{import.meta.env.BASE_URL + 'photos/84.jpg'}"
				alt="Flood in Shahupuri, Kolhapur"
				class="img-wrapper"
				/>				
				<p class="caption">Waterline on home in Shahupuri</p>
				Despite the frequency, municipal warnings often arrive at midnight with no support for evacuation. Over time, residents have stopped waiting. Instead, they’ve built their own system of monitoring local nallah levels and sharing updates via peer networks. At the heart of this system is Amar Samarth, a community organizer, who coordinates neighborhood volunteers and provides trusted on-ground assessments via WhatsApp and phone calls.
				<br>
				<video
				class="profile-video"
				src="{import.meta.env.BASE_URL + 'video/80.mp4'}"
				autoplay
				muted
				loop
				controls
				playsinline
				preload="metadata"
				style="width: 100%; border-radius: 12px;"
				></video>
				<p class="caption">Amar Samarth (far right) with Transitions Researchers and other community members.</p>
				With nearly 1000 homes affected each year, the damage goes well beyond watermarks: employment is disrupted for weeks, walls remain damp for months, and diseases like leptospirosis, caused by nallah-contaminated floodwaters, pose real health risks. Yet relief is patchy. NGOs typically reach only a fraction of those affected—50 homes, by Amar’s estimate—and there’s little coordination around who gets aid. Most residents evacuate informally to relatives' homes or low-cost lodges, with only the poorest accessing municipal school shelters.
				<br>
				<video
				class="profile-video"
				src="{import.meta.env.BASE_URL + 'video/93.mp4'}"
				autoplay
				muted
				loop
				controls
				playsinline
				preload="metadata"
				style="width: 100%; border-radius: 12px;"
				></video>
				<p class="caption">Local artisan pulling up photos of the 2021 flood damage to his workshop.</p>
				Despite the hardships, Shahupuri’s commercial heart remains strong. Known for its idol makers, digital printers, and artists, local businesses have chosen adaptation over relocation. Floods may shutter their shops temporarily, but roots here run deep. However, their location in the designated flood red zone now makes it impossible to secure insurance for expensive machinery, even as climate uncertainty makes risk harder to predict. Business owners have begun advocating for special insurance frameworks for flood-prone urban areas.
				<br>
				<video
				class="profile-video"
				src="{import.meta.env.BASE_URL + 'video/88.mp4'}"
				autoplay
				muted
				loop
				controls
				playsinline
				preload="metadata"
				style="width: 100%; border-radius: 12px;"
				></video>
				<p class="caption">Local artisan priming statues of Ganesh for painting.</p>
				In Shahupuri, resilience is not a plan but a lived practice. It shows up in gendered evacuation strategies, in lobbying that won compensation for multi-storey homes, and in the quiet defiance of staying put, year after year. But it also reveals the risks of over-relying on individual leaders, and the need to embed these community-driven practices into formal urban resilience systems.
				<br>
				<video
				class="profile-video"
				src="{import.meta.env.BASE_URL + 'video/83.mp4'}"
				autoplay
				muted
				loop
				controls
				playsinline
				preload="metadata"
				style="width: 100%; border-radius: 12px;"
				></video>
				<p class="caption">Community leaders guiding Transitions Researchers through Shahupuri.</p>
				It raises a crucial question: what happens in communities where there is no Amar? Its story reveals both the strength and fragility of volunteer-led resilience—impressive in its reach, but vulnerable to burnout and the absence of succession.
			</div>
			<!-- Add Shahupuri-specific content here -->

		{:else if $selectedCommunity.title === 'New Community'}
			<!-- Add new profile video or text here -->

		{:else}
			<video class="profile-video"
				src="{import.meta.env.BASE_URL + 'video/155.mp4'}"
				autoplay
				muted
				loop
				controls
				playsinline
				preload="metadata"
				style="width: 100%; border-radius: 12px;"
			>
				<track
					src="{import.meta.env.BASE_URL + 'video/155.vtt'}"
					kind="captions"
					srclang="en"
					label="English"
					default
				/>
			</video>
			<p class="caption">Video of confluence at the Panchaganga.</p>
			<br>
			<p class="qoute">“Every year we prepare for the flood. No one prepares for what happens after.”</p>
			<br>
			<div class="body-text">
				Located on the periphery of Kolhapur city, Chikli is a rural village that has learned to navigate the rhythms of seasonal flooding. Here, floods are not framed as exceptional disasters, but as expected disruptions in the monsoon cycle—anticipated, endured, and absorbed into the social fabric.
				<video
					class="profile-video"
					src="{import.meta.env.BASE_URL + 'video/161.mp4'}"
					autoplay
					muted
					loop
					controls
					playsinline
					preload="metadata"
					style="width: 100%; border-radius: 12px;"
				></video>
				<p class="caption">Life amongst the river is intertwined with every aspect of everyday life.</p>
				Every flood season, the Gram Panchayat tracks daily migration, maintaining records of who has left the village and who has returned. Alongside this, the local dairy cooperative records livestock deaths, underscoring the centrality of cattle to rural livelihoods. These forms of recordkeeping are rarely seen in nearby urban areas but still remain disconnected from formal loss and damage systems.
				<img
				src="{import.meta.env.BASE_URL + 'photos/145.jpg'}"
				alt="Flood in Shahupuri, Kolhapur"
				class="img-wrapper"
				/>
				<p class="caption">Photo of home that was washed out during last year's flood event.</p>
				Flood preparation in Chikli begins well before the rain. Households routinely stockpile ration kits, medicines, and first aid boxes, drawing from lived knowledge rather than external advisories. Compensation is uniform—₹10,000 per household—regardless of size or the scale of loss. A separate fund for single women introduces a layer of gender sensitivity, even as broader support remains insufficient. While NGOs visit with emergency relief, most residents don’t know who they are or where the support is coming from, pointing to gaps in coordination and continuity.
				<video
					class="profile-video"S
					src="{import.meta.env.BASE_URL + 'video/148.mp4'}"
					autoplay
					muted
					loop
					controls
					playsinline
					preload="metadata"
					style="width: 100%; border-radius: 12px;"
				></video>
				<p class="caption">Clothes drying outside a home in Chikhali.</p>
				Despite recurring inundation, residents have resisted relocation. Even when offered land for resettlement within Chikli, many repurpose it for farming or rental income, seeing floods as temporary rather than existential threats. But this resistance comes at a cost: homes located in flood ‘red zones’ are ineligible for private insurance or housing loans, pushing families toward informal, high-interest credit to finance repairs. Floods also lead to the closure of schools for two or more weeks, and post-flood outbreaks of viral infections are common.
				<video
					class="profile-video"
					src="{import.meta.env.BASE_URL + 'video/150.mp4'}"
					autoplay
					muted
					loop
					controls
					playsinline
					preload="metadata"
					style="width: 100%; border-radius: 12px;"
				></video>
				<p class="caption">*I need the name of the man who showed us around</p>
				Chikli’s story is one of resilience structured through local governance, informal preparedness, and adaptive livelihood strategies. It also surfaces structural blind spots: flat compensation regardless of scale, exclusion from formal finance, and uncoordinated aid from anonymous actors. Local systems exist, but they are unsupported. Community responses are strong, but largely invisible to the state. The village underscores the need to bridge formal disaster systems with local realities, particularly around financing, education, and public health—all of which are directly affected but rarely addressed in long-term planning.
			</div>
		{/if}
	</div>
{/if}

<style>

	:root{
		--profile-width: 500px;
		--profile-height: 80vh;
		--legend-width: 220px;
		--profile-margin: 24px;
	}

	.profile-panel {
		position: absolute;
		right: 20px;
		width: var(--profile-width);
		max-width: 50vw;
		height: var(--profile-height);
		margin-top: 0rem;
		margin-right: .28rem;;
		background: var(--background);
		border: solid 2px var(--outline) !important;
		border-radius: 35px;
		padding: 1.5rem;
		overflow-y: auto;
		font-family: 'PP Neue Machina Bold', sans-serif;
        font-size: 1rem;
		z-index: 999;
		scrollbar-width: none; 
		-ms-overflow-style: none;
	}

	.profile-panel::-webkit-scrollbar {
		display: none; 
	}

	p {
		font-family: 'PP Neue Machina', sans-serif;
		font-size: 1rem;
		color: var(--outline);
	}

	.close-button {
		position: absolute;
		top: 12px;
		right: 16px;
		font-size: 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #555;
		transition: color 0.2s ease;
	}

	.close-button:hover {
		color:var(--accent);
	}

	.qoute {
		font-style: italic;
		color: var(--primary);
		margin: 1rem 0;
		font-weight: 600;
	}

	.body-text {
		font-size: 0.9rem;
		font-family: 'PP Neue Machina', sans-serif;
		line-height: 1.5;
		color: var(--outline);
		text-align: justify;
	}

	.profile-video {
		margin-top: 1rem;
		width: 100%;
		border-radius: 12px;
	}

	.caption {
		font-size: 0.7rem;
		color: var(--hover);
		text-align: left;
		font-style: italic;
		margin-top: .6rem;
		margin-bottom: 1.6rem;
	}

	.img-wrapper {
		max-width: 100%;
		height: auto;
		border-radius: 12px;
		margin-top: 1rem;
	}


	@media (max-width: 768px) {
		:root{
			--profile-width: 90vw;
			--legend-width: 180px;
			--profile-height: 70vh;
		}

		.profile-panel {
			width: var(--profile-width);
			max-width: 89vw;
			border-radius: 20px;
			margin-left: 1rem;
			margin-right:0rem;
			margin-top: 1rem;
			height: var(--profile-height);
 		}

		h2{
			font-size: 1.2rem;
		}

		p{
			font-size: 0.9rem;
		}
	}

	
</style>
