import { createRoot } from "react-dom/client";
import { initFwHarness } from "../fireweave/fw-harness";
import { App } from "./composition/create-app";
import "./styles.css";

async function main() {
  await initFwHarness();
  createRoot(document.getElementById("app")!).render(<App />);
}

void main();
