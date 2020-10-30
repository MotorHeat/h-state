import { h, mouseCursorSensor, statefull } from '../../../src'

const logEffectRunner = (d, m) => {
  console.log(...m)
  d(mouseCursorActions.incLogCounter)
}

function logEffect() {
  return [logEffectRunner, arguments]
}

const mouseCursorActions = {
  toggleWatch: s => ({...s, watch: !s.watch}),
  incLogCounter: s => ({...s, logCounter: s.logCounter + 1}),
  setCursor: (s, v) => [ 
    {...s, cursor: v}, 
    logEffect('mouseCursor component set cursor effect', "arg 2")
  ],
  setCursorFromSensor: (s, v) => mouseCursorActions.setCursor(s, {x: v.clientX, y: v.clientY}),
}

export const mouseCursorInit = {
  logCounter: 0,
  watch: false,
  cursor: { x: 0, y: 0 },
}

export const MouseCursor = statefull( {
  init: mouseCursorInit,
  sensors: () => [
    mouseCursorSensor(
      s => s.watch,
      mouseCursorActions.setCursorFromSensor
    )
  ]
},
  ({watch, cursor}) => <div>
    <p>Active: {watch ? "yes" : "no"}</p>
    <p>{`Mouse X: ${cursor.x} Y: ${cursor.y}`}</p>
    <button onclick={mouseCursorActions.toggleWatch}>watch</button>
  </div>
)
