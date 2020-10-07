import { h as hsf, patch, text } from 'superfine';

function applyChange(fstate, setState, change, changePayload) {
  isFunction(change)
    ? applyChange(fstate, setState, change(fstate(), changePayload))
    : isArray(change)
      ? isFunction(change[0])
        ? applyChange(fstate, setState, change[0], change[1])
        : (setState(change[0]),
           change
            .slice(1)
            .forEach(fx => isArray(fx) && isFunction(fx[0]) && fx[0](fstate, fx[1]))
          )
      : setState(change)
}

function newState(listener) {
  let state = undefined;
  const setState = newState => (newState !== state && (state = newState, listener && listener(state)))
  return function fstate() {
    if (arguments.length == 0) return state
    applyChange(fstate, setState, arguments[0], arguments[1])
  }
}

function map(parent, mapperDef, init, listener) {
  if (isString(mapperDef)) mapperDef = mapper(mapperDef);

  const setState = newState => 
    newState !== mapperDef.get(parent()) 
      && (parent(s => mapperDef.set(s, newState)), listener && listener(mapped))

  function mapped() {
    if (arguments.length == 0) return mapperDef.get(parent());
    applyChange(mapped, setState, arguments[0], arguments[1])
  }

  isUndefined(mapped()) ? mapped(init) : (listener && listener(mapped))
  
  return mapped;
}

const mapper = prop => ({
    get: s => s[prop],
    set: (s, v) => s[prop] === v ? s : (s = {...s}, s[prop]=v, s),
})

export function sensor({start, params, action, isActive}) {
  let unsubscribe = null
  let disposed = false
  const stop = () => unsubscribe && (unsubscribe(), unsubscribe = null)
  return function (fstate) {
    (!arguments.length || disposed)
      ? (stop(), disposed = true)
      : isActive(fstate())
        ? !unsubscribe && (unsubscribe = start(data => fstate(action, data), params))
        : stop() 
  }
}

const cleanupMappedStates = (prevUsedState, usedStates, mappedStates) =>
  prevUsedState.forEach( ({parent, mp, done}, s) =>
    !usedStates.get(s) && (
      (mappedStates.get(parent).get(mp).sensors || []).forEach(x => x()), //dispose all the sensors
      done && s(done),
      mappedStates.delete(s),
      mappedStates.get(parent).delete(mp)
    ))

export function app({node, view, init, log}) {
  let fstate = newState(appListener)
  let rendering = false
  let sensors = view.$sensors && view.$sensors()
  const context = createAppContext(fstate)
  function appListener(state) {
    log && (isArray(log) ? log.forEach(l => l(state)) : log(state))
    sensors.forEach(x => x(fstate))
    if (!rendering) {
      rendering = true
      defer( () => {
        const prevUsedState = context.usedStates
        context.usedStates = new Map()
        appContext = context
        try {
          patch(node, view(state))
          cleanupMappedStates(prevUsedState, context.usedStates, context.mappedStates)
        } finally {
          appContext = null;
          rendering = false
        }
      });
    }
  }

  fstate(init || view.$init);
}

let appContext = null;
const createAppContext = (rootState) => ({currentState:[rootState], mappedStates: new Map(), usedStates: new Map()})
const getCurrentState = () => appContext.currentState[appContext.currentState.length - 1]
const createUsedStateMeta = (parent, mp, done) => ({parent, mp, done})
function getMappedState(type, props) {
  let current = getCurrentState()
  let mapped = appContext.mappedStates.get(current)
  if (!mapped) {
    mapped = new Map()
    appContext.mappedStates.set(current, mapped)
  }
  const mappedMeta = mapped.get(props.$state)
  let mstate = mappedMeta && mappedMeta.mstate || null
  if (!mstate) {
    let sensors = type.$sensors && type.$sensors();
    mstate = map(current, 
      props.$state,
      type.$init,
      s => sensors && sensors.forEach(x => x(s))
    );
    mapped.set(props.$state, { mstate, sensors })
  }
  appContext.usedStates.set(mstate, createUsedStateMeta(current, props.$state, props.$done || type.$done))
  return mstate
}

export function h(type, props, ...children) {
  if (isFunction(type)) {
    if (props && props.$state) {
      let mstate = getMappedState(type, props)
      appContext.currentState.push(mstate);
      try { return type(props ? {...props, ...mstate()} : mstate(), children) }
      finally { appContext.currentState.pop(); }
    } else {
      return type(props, children)
    }
  } else {
    return hookEvents(hsf(type, props || {} , 
      [].concat( ...children)
      .filter(c => typeof(c) !== "boolean" && !isUndefined(c) && c !== null)
      .map(c => isString(c) || typeof c === "number" ? text(c) : c)
    ),
    getCurrentState());
  }
}

function hookEvents(vnode, fstate) {
  return !vnode || !vnode.props 
    ? vnode 
    : (Object.keys(vnode.props)
    .filter(p => p.startsWith("on"))
    .map(p => [vnode.props[p], p])
    .forEach(([action, p]) => vnode.props[p] = (e) => 
      isArray(action) 
        ? fstate(action[0], isFunction(action[1]) ? action[1](e) : action[1])
        : fstate(action, e)),
      vnode)
}

const isArray = Array.isArray
const isFunction = obj => typeof(obj) === "function"
const isUndefined = obj => typeof(obj) === "undefined"
const isString = obj => typeof(obj) === "string"

const defer = typeof(requestAnimationFrame) === "undefined" ? setTimeout :  requestAnimationFrame