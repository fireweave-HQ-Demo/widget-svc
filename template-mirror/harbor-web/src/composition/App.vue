<script setup lang="ts">
import HomePage from "../features/home/presentation/HomePage.vue";
import { loadRuntimeFromEnv } from "../features/runtime/infrastructure/env-runtime";
import { startBrowserOtel } from "../features/telemetry/infrastructure/start-browser-otel";

const ctx = loadRuntimeFromEnv("harbor-web", "vue");
void startBrowserOtel(ctx);
</script>

<template>
  <HomePage :ctx="ctx" />
</template>
