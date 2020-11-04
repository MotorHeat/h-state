import { h, statefull, Router, setTranslate, inject, injectTranslate } from "../../../src";
import { en, en2 } from "./trans";

function main({tr}) {
  return <div>
    {/* <h1>H-State router sample</h1> */}
    <h1>{tr('main.title')}</h1>
    <button onclick={s => [s, setTranslate(en)]}>{tr('main.set-en')}</button>
    <button onclick={s => [s, setTranslate(en2)]}>{tr('main.set-en1')}</button>
    <Router mp="router"/>
  </div>
}

export const Main = statefull( {
  init: [
    {
      tr: (key) => key,
    },
    setTranslate(en)
  ],
  sensors: () => [
    injectTranslate((s, v) => ({...s, tr: v}))
  ]
  
  },
  main)
