import { patch, h as hsf, text} from 'superfine'

const isArray = Array.isArray
function isFunction(obj) {
  return typeof(obj) === "function"
}

// change could be one of the following (it is assumed that state cannot be function):
// func
// [ func ]
// [ func, payload ]
// [ newState, [ effect1, effectParam1 ], [ effect2, effectParam2 ], ... ], effectParam is optional
// newState

function applyChange(fstate, setState, change, changePayload) {
  function runEffect(fx) {
    fx && fx !== true && fx[0](fstate, fx[1])
  }

  isFunction(change)
    ? applyChange(fstate, setState, change(fstate(), changePayload))
    : isArray(change)
      ? isFunction(change[0])
        ? applyChange(fstate, setState, change[0], change[1])
        : change
            .slice(1)
            .map(runEffect, setState(change[0]))
      : setState(change)
}

function newState(stateChanged) {
  let state = undefined
  let readOnly = false

  function setState(newState) {
    if (readOnly) throw new Error("Cannot change state from listener")

    readOnly = true
    try {
      state = newState
      stateChanged && stateChanged(fstate)
    } finally {
      readOnly = false
    }
    
  }
  
  function fstate() { 
    if (arguments.length == 0) return state
    applyChange(fstate, setState, arguments[0], arguments[1])
  }
  return fstate
}

function mapState(parent, mp, initial) {

  function getState() {
    let state = parent()
    return (mp in state) ? state[mp] : initial
  }

  function mergeStateAction(parentState, newChildState) {
    let result = {...parentState}
    result[mp] = newChildState
    return result
  }

  function setState(newState) {
    parent(mergeStateAction, newState)
  }

  return function mappedState() {
    if (arguments.length == 0) return getState()
    applyChange(mappedState, setState, arguments[0], arguments[1])
  }
}

let currentFState = undefined

function withState(mp, init, user) {
  let old = currentFState
  currentFState = mapState(currentFState, mp, init)
  try {
    return user(currentFState())
  } finally {
    currentFState = old
  }
}

const MountPointProp = "$mp"
const InitStateProp = "$init"
export function h (type, props, ...children) {
  return isFunction(type)
    ? props && (MountPointProp in props) 
      ? withState(props[MountPointProp], props[InitStateProp], (state) => type(state, children))
      : type(props, children)
    : hookEvents(hsf(
      type,
      props || {},
      []
        .concat(...children)
        .filter(c => typeof(c) !== "boolean")
        .map((any) =>
          typeof any === "string" || typeof any === "number" ? text(any) : any
        )
    ))
}

function hookEvents(vnode) {
  return !vnode || !vnode.props 
    ? vnode 
    : (Object.keys(vnode.props)
    .filter(p => p.startsWith("on"))
    .forEach(p => vnode.props[p] = hookAction(currentFState, vnode.props[p])),
    vnode)  
}

function hookAction(fstate, actionDef) {
  return function (e) {
    if (isArray(actionDef)) {
      fstate(
        actionDef[0], 
        isFunction(actionDef[1]) ? actiondef[1](e) : actionDef[1]
      )
    } else {
      fstate(actionDef)
    }
  }
}

export function app(node, view, init) {
  let result = newState(fstate => {
    if (currentFState) throw new Error("Render race condition")
    currentFState = fstate
    let vnode = h(view, {$mp: "$root", $init: init})
    patch(node, vnode)
    currentFState = undefined
  })

  let state = {}
  state[MountPointProp] = init
  result(state)
  return result
}