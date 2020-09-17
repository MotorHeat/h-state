import { patch, h as hsf, text} from 'superfine'

const isArray = Array.isArray
const isFunction = obj => typeof(obj) === "function"

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
            .forEach(fx => fx && fx !== true && fx[0](fstate, fx[1]))
          )
      : setState(change)
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
        stateChanged && stateChanged(fstate)
      } finally {
        readOnly = false
      }
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
  function setState(newState) {
    if (getState() !== newState) {
      parent(parentState => {
        let result = {...parentState}
        result[mp] = newState
        return result
      })
    }
  }
  return function mappedState() {
    return arguments.length == 0 
      ? getState()
      : applyChange(mappedState, setState, arguments[0], arguments[1])
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
      ? withState(props[MountPointProp], props[InitStateProp] || type[InitStateProp], state => type(state, children))
      : type(props, children)
    : hookEvents(
        hsf(
          type,
          props || {},
          [].concat(...children)
            .filter(c => typeof(c) !== "boolean")
            .map((any) =>
              typeof any === "string" || typeof any === "number" ? text(any) : any
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

export function app({node, view, init, stateChanged, beforeRender}) {
  let rendering = false
  let result = newState(fstate => {
    stateChanged && stateChanged(fstate())
    if (!rendering) {
      rendering = true;
      defer(() => {
        if (currentFState) throw new Error("Render race condition")
        beforeRender && beforeRender(fstate)
        currentFState = fstate
        try {
          let vnode = h(view, {$mp: "$root", $init: init})
          patch(node, vnode)
        } finally {
          currentFState = undefined
        }
        rendering = false
      })
    }
  })
  result({$root: init})
  return result
}

var defer = typeof requestAnimationFrame !== "undefined"
    ? requestAnimationFrame
    : setTimeout