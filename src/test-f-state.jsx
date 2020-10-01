import { h, app, sensor } from './f-state'

Counter.$init = {
  name: "<no name>",
  counter: 0,
}

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

Counter.$sensors = [
  intervalSensor(
    s => s.counter < 10,
    counterActions.inc,
    1000, 
    24),
]

function intervalSensor(isActive, action, interval, data) {
  return sensor({
    start: startIntervalSensor,
    params: {
      interval,
      data,
    },
    action,
    isActive
  })
}

function startIntervalSensor(callback, {data, interval}) {
  let handle = setInterval(() => callback(data), interval)
  return () => clearInterval(handle);
}

function mouseCursorSensor(isActive, action) {
  return sensor({
    start: startMouseCursorSensor,
    action,
    isActive
  })
}

function startMouseCursorSensor(callback) {
  function listener(e) {
    callback(e)
  }
  
  window.addEventListener("mousemove", listener)
  return () => window.removeEventListener("mousemove", listener)
}

Main.$init = {
    counter: {...Counter.$init, name: "First" },
    show1: true,
    show2: true,
    mouse: {
      active: false,
      x: 0,
      y: 0,
    }
};

const mainActions = {
  setMouseCursor: (s, e) => ({...s, mouse: {...s.mouse, x: e.screenX, y: e.screenY}}),
  setMouseState: (s, v) => ({...s, mouse: {...s.mouse, active: v}}),
}

function Main(s) {
    return <div>
      <h3>Mouse sensor</h3>
      <p>Active: {s.mouse.active ? 'yes' : 'no'}</p>
      <p>{`Cursor x: ${s.mouse.x}, y: ${s.mouse.y}`}</p>
      <label>Mouse sensor state</label>
      <input type="checkbox" checked={s.mouse.active} onchange={[mainActions.setMouseState, e => e.target.checked]}></input>
      <Counter $state="counter"></Counter>
      <Counter $state="counter2"></Counter>
      <Counter $state="counter3"></Counter>
    </div>
}

Main.$sensors = [
  mouseCursorSensor(
    s => s.mouse.active,
    mainActions.setMouseCursor
  )
]

app( {
  node: document.getElementById("app"),
  view: Main,
})
