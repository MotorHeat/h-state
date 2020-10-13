// eslint-disable-next-line no-unused-vars
import { h } from './h-state'

Main.$init = {
  counter: 200,
  greeting: "World",
}

const setGreeting = (s, v) => ({...s, greeting: v})

export function Main(state) {
  return <div>
    <h1>{`Hello ${state.greeting}`}</h1>
    <input type="text" value={state.greeting} oninput={[setGreeting, e => e.target.value]}></input>
    <h3>View in separate file!</h3>
    <p>{`Counter: ${state.counter}`}</p>
  </div>
}


Main.$done = () => undefined