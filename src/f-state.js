import { patch, h as hsf, text} from 'superfine'

function runAction(fstate, setState, action, payload) {
  let actionResult = action(fstate(), payload)
  if (Array.isArray(actionResult)
      && Array.isArray(actionResult[1])
      && typeof(actionResult[1][0]) === "function") {
    const [ newState, [ effect, effectParams ] ] = actionResult
    setState(newState)
    effect(fstate, effectParams)
  } else {
    setState(actionResult)
  }
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
    runAction(fstate, setState, arguments[0], arguments[1])
  }

  return fstate
}

function mapState(parent, mp, initial) {

  function getState() {
    let state = parent()
    if ( mp in state) return state[mp]
    return initial
  }

  function setMappedState(newState) {
    parent( s => {
      let result = {...s}
      result[mp] = newState
      return result
    })
  }

  return function mappedState() {
    if (arguments.length == 0) return getState()
    runAction(mappedState, setMappedState, arguments[0], arguments[1])
  }
}

function withState(mp, init, user) {
  let fstate = mapState(currentFState, mp, init)
  let old = currentFState
  currentFState = fstate
  try {
    return user(fstate(), fstate)
  } finally {
    currentFState = old
  }
}

const MountPointProp = "$mp"
const InitStateProp = "$init"
export function h (type, props, ...children) {
  if (typeof type === "function") {
    if (props && (MountPointProp in props)) {
      return withState(props[MountPointProp], props[InitStateProp], (state) => type(state, children))
    } else {
      return type(props, children)
    }
  } else {
    return hookEvents(hsf(
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
}

function hookEvents(vnode) {
  if (!vnode || !vnode.props) return vnode
  const setState = currentFState;
  Object.keys(vnode.props)
    .filter(p => p.startsWith("on"))
    .forEach(p => {
      vnode.props[p] = hookAction(setState, vnode.props[p])
    })
  return vnode
}

function hookAction(fstate, actionDef) {
  return function (e) {
    if (Array.isArray(actionDef)) {
      let payload = typeof(actionDef[1]) === "function" ? actiondef[1](e) : actionDef[1];
      fstate(actionDef[0], payload)
    } else {
      fstate(actionDef)
    }
  }
}

var currentFState = undefined

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
  result(() => state)
  return result
}