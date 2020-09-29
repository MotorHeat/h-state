import { h as hsf, patch, text } from 'superfine';
import { isString } from './utils';

export function newState() {
  let state = undefined;
  function fstate() {
    if (arguments.length) {
      let newState = arguments[0](state, arguments[1]);
      if (newState !== state) {
        state = newState;
        fstate.listeners.forEach(l => l(state));
      }
    } else {
      return state;
    }
  }

  fstate.listeners = [];
  return fstate;
}

export function listen(fstate, listener) {
  fstate.listeners.push(listener)
  return function () {
    let index = fstate.listeners.indexOf(listener);
    if (index >= 0) {
      fstate.listeners.splice(index, 1);
    }
  }
}

export function map(parent, mapperDef, init) {
  if (isString(mapperDef)) mapperDef = mapper(mapperDef);
  function mapped() {
    let state = mapperDef.get(parent());
    if (state === undefined) state = init;
    if (arguments.length) {
      let newState = arguments[0](state, arguments[1]);
      if (newState !== state) {
        parent(s => mapperDef.set(s, newState));
        mapped.listeners.forEach(l => l(state));
      }
    } else {
      return state;
    }
  }
  mapped.listeners = [];
  return mapped;
}

export function mapper(prop) {
  return {
    get: s => s[prop],
    set: (s, v) => s[prop] === v ? s : (s = {...s}, s[prop]=v, s),
  }
}
export function app({node, view, init}) {
  let fstate = newState()

  function appListener(state) {
    currentState.push(fstate)
    try {
      let vnode = view(state)
      patch(node, vnode)
    } finally {
      currentState.pop()
    }
  }

  listen(fstate, appListener)
  fstate(() => init || view.$init);
  return fstate;
}

let currentState = [];

export function h(type, props, ...children) {
  if (isFunction(type)) {
    if (props && props['$state']) {
      let state = map(currentState[currentState.length - 1], props['$state'], type['$init']);
      currentState.push(state);
      try {
        return type(state(), children)
      } finally {
        currentState.pop();
      }
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