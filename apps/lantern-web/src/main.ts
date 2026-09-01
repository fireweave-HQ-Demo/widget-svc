import { mount } from "svelte";
import App from "./composition/App.svelte";
import "./styles.css";

mount(App, { target: document.getElementById("app")! });
