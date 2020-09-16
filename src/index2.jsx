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
      const event = vnode.props[p]
      vnode.props[p] = e => event(e, setState)
    })
  return vnode
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
  result(state)
  return result
}

function newState(listener) {
  let state = undefined
  let readOnly = false

  function setState(newState) {
    if (readOnly) throw new Error("Cannot change state from listener")

    readOnly = true
    try {
      state = newState
      listener && listener(fstate)
    } finally {
      readOnly = false
    }
    
  }
  
  function fstate() { 
    if (arguments.length == 0) return state
    setState(arguments[0])
  }

  return fstate
}

function mapState(parent, mp, initial) {

  function getState() {
    let state = parent()
    if ( mp in state) return state[mp]
    return initial
  }

  return function () {
    if (arguments.length == 0) return getState()
    let newState = {...parent()}
    newState[mp] = arguments[0]
    parent(newState)
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

function CounterLocalState2(state) {
    return <div>
    <h3>Counter {state.name} is: {state.counter}</h3>
    <button onclick={(e, setState) => setState({...state, counter: state.counter + 1})}>INC</button>
  </div>
}

function Test() {
  return <div>
    <h1>H1 child</h1>
    <p>paragraph</p>
  </div>
}
function Main(s) {
    return <div>
      <Test></Test>
      <h3>Counter is: {s.counter}</h3>
      { s.show1 && <CounterLocalState2 $mp="c1" $init={({name: "FIRST", counter: 0})} />}
      <button onclick={(e, setState) => setState({...s, show1: !s.show1})}>Toggle 1</button>
      { s.show2 && <CounterLocalState2 $mp="c2" $init={({name: "SECOND", counter: 10})}/>}
      <button onclick={(e, setState) => setState({...s, show2: !s.show2})}>Toggle 2</button>
    </div>
}

const startState = {
  counter: 0,
  show1: true,
  show2: true,
}

let fstate = app(document.getElementById("app"), Main, startState)


