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

export const startMouseMoveSensor = (action, isActive) => ({
  sensor: startEventSensor,
  props: {
    eventName: 'mousemove',
    toPayload: e => ({x: e.clientX, y: e.clientY})
  },
  isActive: isActive, 
  action: action, 
})
