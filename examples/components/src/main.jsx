import { h, timeoutEffect, logEffect, mount, statefull } from '../../../src'
import { Counter, counterInit } from './counter'

const mainActions = {
  toggleShow1: s => ({...s, show1: !s.show1}),
  toggleShow2: s => ({...s, show2: !s.show2}),
  toggleShow1WithDelay: s => [s, timeoutEffect(1000, mainActions.toggleShow1)],
  injectCounter1: (s, v) => [
    {...s, c1: v},
    logEffect("State of counter 1 injected")
  ]
}

const mpCounter1 = mount( s => s.c1, mainActions.injectCounter1 );

const mainInit = {
  show1: true,
  show2: true,
  c2: {...counterInit, name: "'second counter'"}
}

export const Main = statefull( {
    init: mainInit,
  },
  s => <div>
    <button onclick={mainActions.toggleShow1WithDelay}>Show/hide counter 1 with delay</button>
    <button onclick={mainActions.toggleShow1}>Show/hide counter 1</button>
    <button onclick={mainActions.toggleShow2}>Show/hide counter 2</button>

    { s.show1 && <Counter mp={mpCounter1}/>}
    { s.show2 && <Counter mp="c2"/>}
  </div>
)
