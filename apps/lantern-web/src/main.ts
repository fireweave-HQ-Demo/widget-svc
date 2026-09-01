import { mount } from "svelte";
import App from "./composition/App.svelte";
import { initFwHarness } from "./fireweave/fw-harness";
import "./styles.css";

await initFwHarness();
mount(App, { target: document.getElementById("app")! });
