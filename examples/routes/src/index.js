import { app } from "../../../src";
import { Main } from './main'
import { appRoutes } from "./routes";

app( {
  node: document.getElementById("app"),
  view: Main,
  global: {
    routes: appRoutes
  }
})
