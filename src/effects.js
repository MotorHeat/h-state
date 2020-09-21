export function logEffect(message) {
  return [ (d, m) => console.log(m), message]
}

export function timeoutEffect(interval, action, payload) {
  return [
    timeOutEffectRunner,
    {
      interval: interval,
      action: action,
      payload: payload
    }
  ]
}

function timeOutEffectRunner(fstate, {action, payload, interval}) {
  setTimeout( () => fstate(action, payload), interval)
}
