import { mount } from "svelte";
import { initFwHarness } from "./fireweave/fw-harness";
import App from "./composition/App.svelte";
import "./styles.css";

await initFwHarness();

mount(App, { target: document.getElementById("app")! });
