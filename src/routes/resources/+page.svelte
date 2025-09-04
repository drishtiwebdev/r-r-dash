<script lang="ts">
  import { supabase } from '$lib/supabase';

  /** @typedef {{role: 'user'|'assistant', text: string}} Msg */
  /** @type {Msg[]} */
  let messages = [];
  let input = '';
  let busy = false;



  async function useMyLocation() {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { lat = coords.latitude; lng = coords.longitude; },
      () => alert('Could not get your location')
    );
  }

  async function onSubmit(event) {
    event.preventDefault();
    ask();
  }

  async function ask() {
    if (!input.trim() || busy) return;
    busy = true;
    const q = input.trim();
    input = '';
    messages = [...messages, { role: 'user', text: q }];

    const { data, error } = await supabase.functions.invoke('chatbot', {
      body: { question: q }
    });

    const reply = error ? 'Sorry—something went wrong.' : (data?.answer ?? 'No answer.');
    messages = [...messages, { role: 'assistant', text: reply }];
    busy = false;
  }
</script>

<section class="chat-wrap">
  <header class="bar">
    <h1>Ask Kolhapur</h1>
    <button class="pill outline" on:click={useMyLocation}>Use my location</button>
  </header>

  <div class="msgs">
    {#each messages as m, i}
      <div class="msg {m.role}">
        <div class="bubble">{m.text}</div>
      </div>
    {/each}
    {#if busy}<div class="msg assistant"><div class="bubble">Thinking…</div></div>{/if}
  </div>

  <form class="input-row" on:submit={onSubmit}>
    <input
      placeholder="e.g., Where can I find free meals near Shahupuri?"
      bind:value={input}
      autocomplete="off" />
    <button class="pill" type="submit" disabled={busy}>Send</button>
  </form>
</section>

<style>
  .chat-wrap{max-width:860px;margin:1rem auto;padding:1rem;background:#fff;border:1px solid #e5e5e5;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);display:grid;grid-template-rows:auto 1fr auto;gap:.75rem;height:calc(100vh - 8rem)}
  .bar{display:flex;align-items:center;gap:.5rem}
  h1{font-size:1.1rem;margin:0}
  .msgs{overflow:auto;display:flex;flex-direction:column;gap:.5rem;padding:.25rem}
  .msg{display:flex}
  .msg.user{justify-content:flex-end}
  .bubble{max-width:70ch;padding:.6rem .8rem;border-radius:14px;border:1px solid #e5e5e5}
  .msg.user .bubble{background:#eef2ff;border-color:#dbe2ff}
  .msg.assistant .bubble{background:#f7f7f7}
  .input-row{display:flex;gap:.5rem}
  input{flex:1;padding:.65rem .8rem;border:1.4px solid #cfcfcf;border-radius:12px}
  input:focus{outline:none;border-color:var(--accent,#2463eb);box-shadow:0 0 0 3px color-mix(in srgb, var(--accent,#2463eb) 18%, transparent)}
  .pill{height:42px;padding:0 1rem;border-radius:999px;border:1.6px solid #222;background:#222;color:#fff;cursor:pointer}
  .pill[disabled]{opacity:.6;cursor:not-allowed}
  .pill.outline{background:#fff;color:#222}
</style>
