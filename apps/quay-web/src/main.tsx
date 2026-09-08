import { render } from "solid-js/web";
import { App } from "./composition/create-app";
import { initFwHarness } from "./fireweave/fw-harness";
import "./styles.css";

await initFwHarness();
render(() => <App />, document.getElementById("app")!);
