import { h, app, mapper } from './f-state'

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

Main.$init = {
    counter: 0,
    show1: true,
    show2: true,
};

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

function Main(s) {
    return <div>
      <Test></Test>
      <h3>Counter is: {s.counter}</h3>
      <Counter $state="cnt1"></Counter>
    </div>
}

let fstate = app( {
  node: document.getElementById("app"),
  view: Main,
  // init: startState,
  // stateChanged: console.log,
  // beforeRender: processSensors(s => s.sensors)
})
