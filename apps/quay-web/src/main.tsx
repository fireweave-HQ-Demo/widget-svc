import { render } from "solid-js/web";
import { App } from "./composition/create-app";
import "./styles.css";

render(() => <App />, document.getElementById("app")!);
