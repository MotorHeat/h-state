import { patch, h as hsf, text} from 'superfine'
import { isArray, isFunction, isString, isUndefined } from './utils'

export function bindToState(action, mapper, fstate) {
  let mappedState = mapState(fstate, mapper)
  return (_, payload) => (mappedState([action, payload]), fstate())
}

// change could be one of the following (it is assumed that state cannot be function):
// func
// [ func ]
// [ func, payload ]
// [ newState, [ effect1, effectParam1 ], [ effect2, effectParam2 ], ... ], effectParam is optional
// newState

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

// [ [action, payload | func ], ...]
export function batch(actions) {

  async function batchEffect(fstate, payload) {
    let payloadFunctionArgs = [ payload ]
    for(let item of actions) {
      let [action, data, errorAction] = item
      let p = data;
      let payLoadIsFunc = isFunction(p);
      payLoadIsFunc && (p = data(payloadFunctionArgs))
      
      if (p instanceof Promise) {
        try {
          p = await p
        } catch(error){
          if (!isFunction(errorAction)) throw error;
          p = error
          action = errorAction
        }
      } 
      payLoadIsFunc && payloadFunctionArgs.push(p)
      fstate( [action, p] )
    }
  }
  return (state, payload) => [ state, [ batchEffect, payload ] ];
}

function newState(stateChanged) {
  let state = undefined
  let readOnly = false

  function setState(newState) {
    if (readOnly) throw new Error("Cannot change state from listener")
    if (newState !== state) {
      readOnly = true
      try {
        state = newState
        stateChanged && stateChanged(state)
      } finally {
        readOnly = false
      }
    }
  }
  return function fstate() { 
    if (arguments.length == 0) return state
    applyChange(fstate, setState, arguments[0], arguments[1])
  }
}

function mapState(parent, mp, init) {

  const getState = () => isString(mp) ? parent()[mp] : mp.get(parent())

  function mapSet(state, value) {
    let r
    return isString(mp)
      ? (r = {...state}, r[mp] = value, r)
      : mp.set(state, value)
  }

  function mappedState() {
    return arguments.length == 0 
      ? getState()
      : applyChange(
          mappedState, 
          (newState) => (getState() !== newState) && parent([mapSet, newState]),
          arguments[0],
          arguments[1])
  }

  isUndefined(getState()) && !isUndefined(init) && mappedState(init)
  return mappedState
}

export var mount = (get, set) => ({get, set})
export var effect = effect => s =>{
  return [ s, effect ]
}

let currentFState = undefined
let rootFState = undefined

function withState(mp, init, user) {
  let old = currentFState
  currentFState = mp === "" ? rootFState : mapState(currentFState, mp, init)
  try {
    return user(currentFState())
  } finally {
    currentFState = old
  }
}

const MountPointProp = "$mp"
const InitStateProp = "$init"
export var h = (type, props, ...children) => {
  return isFunction(type)
    ? props && (MountPointProp in props) 
      ? withState(props[MountPointProp], props[InitStateProp] || type[InitStateProp], state => type(state, children))
      : type(props, children)
    : hookEvents(
        hsf(
          type,
          props || {},
          [].concat(...children)
            .filter(c => typeof(c) !== "boolean" && !isUndefined(c) && c !== null)
            .map(c => isString(c) || typeof c === "number" ? text(c) : c
            )),
      currentFState)
}

function hookEvents(vnode, fstate) {
  return !vnode || !vnode.props 
    ? vnode 
    : (Object.keys(vnode.props)
    .filter(p => p.startsWith("on"))
    .map(p => [vnode.props[p], p])
    .forEach(([action, p]) => 
        vnode.props[p] = (e) => 
          isArray(action)
            ? fstate(action[0], isFunction(action[1]) ? action[1](e) : action[1])
            : fstate(action)),
    vnode)  
}

export var app = ({node, view, init, stateChanged, beforeRender}) => {
  let rendering = false
  let appState = newState(state => {
    stateChanged && stateChanged(state)
    if (!rendering) {
      rendering = true;
      defer(() => {
        rendering = false
        if (currentFState || rootFState) throw new Error("Render race condition")
        beforeRender && beforeRender(appState)
        rootFState = appState
        try {
          let vnode = h(view, {$mp: "", $init: init})
          patch(node, vnode)
        } finally {
          rootFState = undefined
        }
      })
    }
  })
  appState( isUndefined(init) ? view.$init : init )
  return appState
}

var defer = typeof(requestAnimationFrame) === "undefined" ? setTimeout :  requestAnimationFrame
