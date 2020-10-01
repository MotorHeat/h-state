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

  const setState = newState => newState !== mapperDef.get(parent()) 
    && (parent(s => mapperDef.set(s, newState)), listener && listener(mapped))

  function mapped() {
    if (arguments.length == 0) {
      let state = mapperDef.get(parent());
      return isUndefined(state)
        ? (mapped(init), mapped())
        : state
    }
    applyChange(mapped, setState, arguments[0], arguments[1])
  }
  return mapped;
}

const mapper = prop => ({
    get: s => s[prop],
    set: (s, v) => s[prop] === v ? s : (s = {...s}, s[prop]=v, s),
})

export function sensor({start, params, action, isActive}) {
  let unsubscribe = null
  return function (fstate) {
    if (isActive(fstate())) {
      if (!unsubscribe) {
        unsubscribe = start(data => fstate(action, data), params);
      }
    } else {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }
  }
}

export function app({node, view, init, log}) {
  let fstate = newState(appListener)
  let rendering = false

  function appListener(state) {
    log && (isArray(log) ? log.forEach(l => l(state)) : log(state))
    view.$sensors && view.$sensors.forEach(x => x(fstate))
    if (!rendering) {
      rendering = true
      defer( () => {
        currentState.push(fstate)
        try {
          let vnode = view(state)
          patch(node, vnode)
        } finally {
          currentState.pop()
          rendering = false
        }
      });
    }
  }

  fstate(init || view.$init);
}

let currentState = [];

export function h(type, props, ...children) {
  if (isFunction(type)) {
    if (props && props.$state) {
      let state = map(currentState[currentState.length - 1], props.$state, type.$init, s => type.$sensors && type.$sensors.forEach(x => x(s)));
      currentState.push(state);
      try { return type(state(), children) }
      finally { currentState.pop(); }
    } else {
      return type(props, children)
    }
  } else {
    return hookEvents(hsf(type, props || {} , 
      [].concat( ...children)
      .filter(c => typeof(c) !== "boolean" && !isUndefined(c) && c !== null)
      .map(c => isString(c) || typeof c === "number" ? text(c) : c)
    ),
    currentState[currentState.length - 1]);
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