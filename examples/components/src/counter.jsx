import { h, sensor, statefull } from 'h-state'

const counterActions = {
  inc: state => ({...state, counter: state.counter + 1}),
  add: (state, value) => ({...state, counter: state.counter + value}),
}

export const counterInit = {
  name: "<no name>",
  counter: 0,
}

export const Counter = statefull(
  {
    init: counterInit,
  }, 
  (state) => <div>
      <h3>Counter {state.name} is: {state.counter}</h3>
      <button onclick={counterActions.inc}>INC</button>
      <button onclick={[counterActions.add, -1]}>DEC</button>
      <button onclick={[counterActions.add, 3]}>+3</button>
      <button onclick={[counterActions.add, -3]}>-3</button>
    </div>
  )
