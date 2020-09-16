import { patch, h as hsf, text as hstext} from 'superfine'

let nodeIndex = 0

function text(any) {
  let r = hstext(any)
  r.order = nodeIndex++
  r.j = JSON.stringify(r)
  return r
}
export function h (type, props, ...children) {
  if (typeof type === "function") {
    return type(props, children)
  } else {
    return hsf(
      type,
      props || {},
      []
        .concat(...children)
        .map((any) =>
          typeof any === "string" || typeof any === "number" ? text(any) : any
        )
    )
    // r.order = nodeIndex++
    // r.j = JSON.stringify(r)
    // return r
  }
}

var currentFState = undefined

export function app(node, view, mp) {
  let result = newState(fstate => {
    currentFState = result
    nodeIndex = 0
    let vnode = view({mp})
    // console.log(vnode)
    patch(node, vnode)
    currentFState = undefined
    // console.log(result())
  })
  result({})
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

function useState(mp, initial) {

  function getState() {
    let state = currentFState()
    if ( mp in state) return state[mp]
    return initial
  }

  if (!currentFState) throw new Error("Cannot access state outside view")

  return function () {
    if (arguments.length == 0) return getState()
    let newState = {...currentFState()}
    newState[mp] = arguments[0]
    currentFState(newState)
  }
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

function CounterLocalState({name, mp}) {
  const fstate = useState(mp, {counter: 0})
  return <div>
    <h3>Counter {name} is: {fstate().counter}</h3>
    <button onclick={() => fstate({...fstate(), counter: fstate().counter + 1})}>INC</button>
  </div>
}

function CounterLocalState2({name, mp}) {
  return withState(mp, {counter: 0}, (state, setState) => {
    return <div>
    <h3>Counter {name} is: {state.counter}</h3>
    <button onclick={() => setState({...state, counter: state.counter + 1})}>INC</button>
  </div>
  })
}

function Test() {
  return <div>
    <h1>H1 child</h1>
    <p>paragraph</p>
  </div>
}
function Main({mp}) {
  return withState(mp, startState, (s, setState) => {
    return <div>
      <Test></Test>
      <h3>Counter is: {s.counter}</h3>
      { s.show1 && <CounterLocalState2 name="FIRST" mp="c1" />}
      <button onclick={() => setState({...s, show1: !s.show1})}>Toggle 1</button>
      { s.show2 && <CounterLocalState2 name="SECOND" mp="c2"/>}
      <button onclick={() => setState({...s, show2: !s.show2})}>Toggle 2</button>

    </div>
  })
}

const startState = {
  counter: 0,
  show1: true,
  show2: true,
}

let fstate = app(document.getElementById("app"), Main, 'root')


