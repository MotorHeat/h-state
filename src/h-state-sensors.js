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

import { bindToState } from "./h-state"
import { isFunction, isString } from "./utils"

export function processSensors(getSensors) {
  let activeSensors = new Map() // get(sensorDef) => {props, stop()}
  return function (fstate) {
    const state = fstate()
    const sensors = getSensors(state)

    sensors.forEach(def => {
      const { sensor, props, isActive, action } = def
      let startedData = activeSensors.get(def)
      if (isActive(state)) {
        const newProps = isFunction(props) ? props(state) : props
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
    Array.from(activeSensors.keys())
      .filter(k => !sensors.includes(k))
      .forEach(k => {
        activeSensors.get(k).stop()
        activeSensors.delete(k)
      })
  }
}

export function mapSensor(def, mp, fstate) {
  const mapGet = s => isString(mp) ? s[mp] : mp.get(s)

  return {
    ...def,
    action: bindToState(def.action, mp, fstate),
    props: isFunction(def.props)
      ? s => def.props( mapGet(s) )
      : def.props,

    isActive: isFunction(def.isActive) 
      ? s => def.isActive(mapGet(s))
      : def.isActive,

  }
}

export function attachSensorsEffect(sensors, mapper, action) {
  return [attachSensors, {sensors, mapper, action}]
}

var mappedSensors = new Map()

function attachSensors(fstate, {sensors, mapper, action}) {
  let mapped = sensors
    .filter(s => !mappedSensors.get(s))
    .map(s => {
      let r = mapSensor(s, mapper, fstate)
      mappedSensors.set(s, r)
      return r;
    });
  fstate([action, mapped])
}

export function detachSensorsEffect(sensors, action) {
  return [detachSensors, {sensors, action}]
}

function detachSensors(fstate, {sensors, action}) {
  let mapped = sensors.map(s => {
      let r = mappedSensors.get(s)
      mappedSensors.delete(s)
      return r
    })
    .filter(s => !!s)

  fstate([action, mapped])
}
