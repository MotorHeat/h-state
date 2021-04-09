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

/** Interval sensor.
 * 
 * @template S
 * @param { number } interval - action will be called with this interval.
 * @param {(s: S) => boolean} isActive - This function should return true when sensor should be active.
 * @param {(s: S, e: number) => S} action - This action is called each time timer produce a new value.
 * @return {import('./h-state').Sensor<S>} - A new sensor.
 */
 export function intervalSensor(interval, isActive, action) {
  return sensor({
    start: startIntervalSensor,
    action,
    params: interval,
    isActive
  })
}

/** Starts interval sensor.
 * 
 * @param {(interval: number) => void} callback - A function that will be called each time sensor produce a new value.
 * @param { number } interval - Interval at which call back is called.
 * @return {import('./h-state').StopSensorFunc} - Function to stop sensor.
 */
function startIntervalSensor(callback, interval) {
  const id = setInterval(() => callback(interval), interval); 
  return () => clearInterval(id);
}