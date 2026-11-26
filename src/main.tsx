import { render } from "preact";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles.css";
import "./discord.css";
import { App } from "./App";

render(<App />, document.getElementById("app")!);
