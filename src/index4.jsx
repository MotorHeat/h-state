import { patch, h as hsf, text} from 'superfine'

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

var currentFState = undefined

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

const counterActions = {
  inc: state => ({...state, counter: state.counter + 1}),
  add: (state, value) => ({...state, counter: state.counter + value}),
}

function CounterLocalState2(state) {
    return <div>
    <h3>Counter {state.name} is: {state.counter}</h3>
    <button onclick={counterActions.inc}>INC</button>
    <button onclick={[counterActions.add, 3]}>+3</button>
    <button onclick={[counterActions.add, -3]}>-3</button>
  </div>
}

function Test() {
  return <div>
    <h1>H1 child</h1>
    <p>paragraph</p>
  </div>
}

const mainActions = {
  toggleShow1: s => ({...s, show1: !s.show1}),
  toggleShow2: s => ({...s, show2: !s.show2}),
  toggleShow1WithDelay: s => [s, timeoutEffect(1000, mainActions.toggleShow1)]
}

function timeoutEffect(interval, action, payload) {
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
  // setTimeout( () => runAction(fstate, action, payload), interval)
  setTimeout( () => fstate(action, payload), interval)
}


function Main(s) {
    return <div>
      <Test></Test>
      <h3>Counter is: {s.counter}</h3>
      <button onclick={mainActions.toggleShow1WithDelay}>Toggle 1 with delay</button>

      { s.show1 && <CounterLocalState2 $mp="c1" $init={({name: "FIRST", counter: 0})} />}
      <button onclick={mainActions.toggleShow1}>Toggle 1</button>
      { s.show2 && <CounterLocalState2 $mp="c2" $init={({name: "SECOND", counter: 10})}/>}
      <button onclick={mainActions.toggleShow2}>Toggle 2</button>
    </div>
}

const startState = {
  counter: 0,
  show1: true,
  show2: true,
}

let fstate = app(document.getElementById("app"), Main, startState)


