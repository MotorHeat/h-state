import { sensor } from './h-state'

export function startEventSensor(notify, {eventName, toPayload, target}) {
  function listener(e) {
    notify( toPayload ? toPayload(e) : e)
  }
  (target || window).addEventListener(eventName, listener)
  return () => window.removeEventListener(eventName, listener)
}

export function startTimeIntervalSensor(notify, {interval, payload}) {
  let handle = setInterval( () => notify(payload), interval || 100)
  return () => clearInterval(handle)
}

// TODO: delete this function
export const createMouseMoveSensor = (action, isActive) => ({
  sensor: startEventSensor,
  props: {
    eventName: 'mousemove',
    toPayload: e => ({x: e.clientX, y: e.clientY})
  },
  isActive: isActive, 
  action: action, 
})

/** Creates mouse cursor sensor.
 * 
 * @template S
 * @param {(s: S) => boolean} isActive - This function should return true when sensor should be active.
 * @param {(s: S, e: MouseEvent) => S} action - This action is called each time sensor produce a new value.
 * @return {import('./h-state').Sensor<S>} - A new sensor.
 */
export function mouseCursorSensor(isActive, action) {
  return sensor({
    start: startMouseCursorSensor,
    action,
    isActive
  })
}

/** Starts mouse event listener.
 * 
 * @param {(data: MouseEvent) => void} callback - A function that will be called each time sensor produce a new value.
 * @return {import('./h-state').StopSensorFunc} - Function to stop sensor.
 */
function startMouseCursorSensor(callback) {
  const listener = e => callback(e)  
  window.addEventListener("mousemove", listener)
  return () => window.removeEventListener("mousemove", listener)
}
