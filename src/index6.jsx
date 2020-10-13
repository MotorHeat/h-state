import { logEffect, timeoutEffect } from './effects'
import { h, app, mount } from './h-state'
import { MouseCursor } from './mouseCursor'
import { Users } from './users'

const counterActions = {
  inc: state => ({...state, counter: state.counter + 1}),
  add: (state, value) => ({...state, counter: state.counter + value}),
}

function Counter(state) {
  return <div>
    <h3>Counter {state.name} is: {state.counter}</h3>
    <button onclick={counterActions.inc}>INC</button>
    <button onclick={[counterActions.add, 3]}>+3</button>
    <button onclick={[counterActions.add, -3]}>-3</button>
  </div>
}

Counter.$init = {
  name: "<no name>",
  counter: 0,
}

Main.$init = [ {
    counter: 0,
    show1: true,
    show2: true,
    mouse: MouseCursor.$init,
    sensors: []
  },
  logEffect("Main.$init effect")
]

const mainActions = {
  toggleShow1: s => ({...s, show1: !s.show1}),
  toggleShow2: s => ({...s, show2: !s.show2}),
  toggleShow1WithDelay: s => [s, timeoutEffect(1000, mainActions.toggleShow1)],
  injectCounter1: (s, v) => [
    {...s, c1: v},
    logEffect("State of counter 1 injected")
  ],
  setMouseCursor: (s, v) => ({...s, mouse: {...s.mouse, cursor: v}}),
  addSensor: (s, sensor) => ({...s, sensors: [...s.sensors, sensor]}),
  addSensors: (s, sensors) => ({...s, sensors: s.sensors.concat(sensors)}),
  removeSensor: (s, sensor) => ({...s, sensors: s.sensors.filter(ss => ss !== sensor)}),
  removeSensors: (s, sensors) => ({...s, sensors: s.sensors.filter(ss => !sensors.includes(ss))}),
}

const mpCounter1 = mount( s => s.c1, mainActions.injectCounter1 );


function Main(s) {
    return <div>
      <MouseCursor $mp="mouse"></MouseCursor>
      <h3>Counter is: {s.counter}</h3>
      <button onclick={mainActions.toggleShow1WithDelay}>Toggle 1 with delay</button>

      { s.show1 && <Counter $mp={mpCounter1} $init={({name: "FIRST", counter: 0})} />}
      <button onclick={mainActions.toggleShow1}>Toggle 1</button>
      { s.show2 && <Counter $mp="c2"/>}
      <button onclick={mainActions.toggleShow2}>Toggle 2</button>

      <Users $mp="users"></Users>
    </div>
}

app( {
  node: document.getElementById("app"),
  view: Main,
  log: console.log,
})
