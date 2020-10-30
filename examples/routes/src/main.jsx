import { h, statefull, Router } from "../../../src";
import { appRoutes } from "./routes";

function main() {
  return <div>
    <h1>H-State router sample</h1>
    <Router mp="router"/>
  </div>
}

export const Main = statefull( {
  init: {
    router: {
      currentPath: window.location.pathname,
      routes: appRoutes,
    },
    greeting: {
      name: "H-State",
    }
  }
},
main)