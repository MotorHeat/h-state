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

export function loadViewEffect(pathToScript, viewName, action) {
  return [
    loadViewRunner,
    {
      pathToScript, viewName, action
    }
  ]
}

var modules = new Map()

async function loadViewRunner(fstate, {pathToScript, viewName, action}) {
  let module = modules.get(pathToScript)
  if (!module) {
    module = await import(pathToScript)
    modules.set(pathToScript, module)
  }  
  fstate([action, module[viewName]])
}