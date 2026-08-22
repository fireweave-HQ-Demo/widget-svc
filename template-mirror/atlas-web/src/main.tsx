import { createRoot } from "react-dom/client";
import { App } from "./composition/create-app";
import "./styles.css";

createRoot(document.getElementById("app")!).render(<App />);
