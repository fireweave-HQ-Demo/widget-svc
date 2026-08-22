<script setup lang="ts">
import { ref } from "vue";
import type { RuntimeContext } from "../../../core/runtime-context";
import { buildHomeModel } from "../application/home-model";
import { probeApi } from "../application/probe-api";

const props = defineProps<{ ctx: RuntimeContext }>();
const model = buildHomeModel(props.ctx);
const probe = ref("Idle — probe the pair API.");
const klass = ref("");

async function onProbe() {
  const result = await probeApi(props.ctx.apiBase);
  probe.value = result.body;
  klass.value = result.ok ? "ok" : "bad";
}
</script>

<template>
  <main class="shell">
    <div class="brand"><strong>fireweave</strong><span>fixture · vue</span></div>
    <h1>{{ model.title }}</h1>
    <p class="lede">Vite + Vue pair UI. Probes the sibling API over the host-mapped port.</p>
    <dl class="card">
      <div class="row"><dt>Environment</dt><dd>{{ model.environment }}</dd></div>
      <div class="row"><dt>Destination</dt><dd>{{ model.destination }}</dd></div>
      <div class="row"><dt>Framework</dt><dd>{{ model.framework }}</dd></div>
      <div class="row"><dt>API</dt><dd>{{ model.apiBase }}</dd></div>
      <div class="row"><dt>Browser OTLP</dt><dd>{{ model.otlp }}</dd></div>
    </dl>
    <div class="actions">
      <button type="button" @click="onProbe">Probe API /health</button>
      <a class="link" :href="model.apiBase + '/health'" target="_blank" rel="noreferrer">Open API health</a>
    </div>
    <pre class="probe" :class="klass">{{ probe }}</pre>
  </main>
</template>
