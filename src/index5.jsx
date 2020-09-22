import { logEffect, timeoutEffect } from './effects'
import { h, app, mount, effect } from './h-state'
import { processSensors, attachSensorsEffect, detachSensorsEffect} from './h-state-sensors'
import { MouseCursor, mouseCursorSensors } from './mouseCursor'
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

function Test() {
  return <div>
    <h1>H1 child</h1>
    <p>paragraph</p>
  </div>
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

  attachSensors: (s, {sensors, mapper}) => [
    s,
    attachSensorsEffect(sensors, mapper, mainActions.addSensors)
  ],

  detachSensors: (s, sensors) => [
    s,
    detachSensorsEffect(sensors, mainActions.removeSensors)
  ]
}

const mpCounter1 = mount( s => s.c1, mainActions.injectCounter1 );

const attachMouseCursorSensorsEffect = attachSensorsEffect(mouseCursorSensors, 'mouse', mainActions.addSensors)
const detachMouseCursorSensorsEffect = detachSensorsEffect(mouseCursorSensors, mainActions.removeSensors)

function Main(s) {
    return <div>
      <Test></Test>
      <MouseCursor $mp="mouse"></MouseCursor>
      <button
        disabled={s.sensors.length !== 0}
        // onclick={[mainActions.attachSensors, {sensors: mouseCursorSensors, mapper: 'mouse'}]}>
        onclick={effect(attachMouseCursorSensorsEffect)}>
          Attach mouse sensor
      </button>
      <button
        disabled={s.sensors.length === 0}
        // onclick={[mainActions.detachSensors, mouseCursorSensors]}>
        onclick={effect(detachMouseCursorSensorsEffect)}>
          Detach mouse sensor
      </button>
      <h3>Counter is: {s.counter}</h3>
      <button onclick={mainActions.toggleShow1WithDelay}>Toggle 1 with delay</button>

      { s.show1 && <Counter $mp={mpCounter1} $init={({name: "FIRST", counter: 0})} />}
      <button onclick={mainActions.toggleShow1}>Toggle 1</button>
      { s.show2 && <Counter $mp="c2"/>}
      <button onclick={mainActions.toggleShow2}>Toggle 2</button>

      <Users $mp="users"></Users>
    </div>
}

let fstate = app( {
  node: document.getElementById("app"),
  view: Main,
  // init: startState,
  stateChanged: console.log,
  beforeRender: processSensors(s => s.sensors)
})
