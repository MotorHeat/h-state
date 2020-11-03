import { h, statefull, Router, setGlobalEffect } from "../../../src";

function main() {
  return <div>
    <h1>H-State router sample</h1>
    <Router mp="router"/>
  </div>
}

export const Main = statefull( {
  init: {}  
  },
  main)