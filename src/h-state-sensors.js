/* 
Sensor is a function that returns function that will stop sensor.
Sensor accepts 2 arguments: a callback function that will get a new value from sensor and 
some payload that has paramters of how to create sensor.

Sensor can be defined like this (TypeScript):
type Sensor<D,P> = function (notify: (data: D) => void, props?: P): () => void;
D - is data structure produced by sensor
P - payload type that is used to initialise sensor
Sensor definition is a following structure:

Example:

export function startMouseMoveSensor(notify) {
  const listener = (e) => notify( {x: e.clientX, y: e.clientY} )
  window.addEventListener('mousemove', listener)
  return () => window.removeEventListener(eventName, listener)
}


interface ISensorDefinition<S, D, P = any> {
  sensor: Sensor<D,P>;
  props?: P | (state: S) => P
  isActive: boolean | (state: S) => boolean,
  action: (state: S, data: D) => S
}

S - is a state on top of which we want our sensor will work
action - this action is called to inject a new value from sensor to the state

*/

export function processSensors(getSensors) {
  let activeSensors = new Map() // get(sensorDef) => {props, stop()}
  //TODO: remove from activeSensors deleted sensors 
  return function (fstate) {
    const state = fstate()
    const sensors = getSensors(state)

    sensors.forEach(def => {
      const { sensor, props, isActive, action } = def
      let startedData = activeSensors.get(def)
      if (isActive(state)) {
        const newProps = typeof(props) === "function" ? props(state) : props
        if (startedData) {
          if (startedData.props !== newProps) {
            startedData.stop()
            startedData.props = newProps
            startedData.stop = sensor(data => fstate(action, data), newProps)
          }
        } else {
          startedData = {
            props: newProps,
            stop: sensor(data => fstate(action, data), newProps)
          }
          activeSensors.set(def, startedData)
        }
      } else {
        if (startedData) {
          startedData.stop()
          activeSensors.delete(def)
        }
      }
    })
  }
}
