import { createRoot } from "react-dom/client";
import { App } from "./composition/create-app";
import { initFwHarness } from "./fireweave/fw-harness";
import "./styles.css";

await initFwHarness();
createRoot(document.getElementById("app")!).render(<App />);
