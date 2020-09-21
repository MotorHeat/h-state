import { h } from './h-state'
import { logEffect, timeoutEffect } from "./effects"
import { batch, effect } from "./h-state"

Users.$init = {
  data: [],
  loading: false,
  error: null,
}

const usersActions = {
  load: s => [ s, loadUsersEffect(usersActions.setUsers) ],
  setUsers: (s, d) => ({...s, data: d}),
  setLoading: (s, v) => ({...s, loading: v}),
  setError: (s, v) => [ {...s, error: v && v.message || v}, logEffect("setError")],
  deleteUser: (s, id) => ({...s, data: s.data.filter(x => x.id !== id)}),

}

const loadUsersBatch = batch( [
  [ usersActions.setLoading, true ],
  [ usersActions.setError, null ],
  [ usersActions.setUsers, [] ],
  [ usersActions.setUsers, loadUsersAsync, usersActions.setError ],
  [ usersActions.setLoading, false ],
]);

const deleteUserBatch = batch([
  [ usersActions.setLoading, true ],
  [ usersActions.setError, null ],
  [ usersActions.deleteUser, async ([id]) => (await deleteUserAsync(id),id), usersActions.setError ],
  [ usersActions.setLoading, false ],
])

export function Users(state) {
  return <div>
    {state.error && <p>{state.error}</p>}
    {!state.error && <ul>
      {state.data.map(User)}
    </ul> }
    <button disabled={state.loading} onclick={loadUsersBatch}>Load users</button>
    {state.data.length > 0 && <button disabled={state.loading} onclick={[deleteUserBatch, state.data[state.data.length - 1].id]}>Dlete last user</button>}
  </div>
}

function User({name, email, age}) {
  return <li>
    <h4>Name: {name}</h4>
    <h4>Email: {email}</h4>
    <h4>Age: {age}</h4>
  </li>
}

async function loadUsersAsync() {
  return new Promise( (resolve, reject) => {

    setTimeout( () => {
      // reject(new Error("connection error"));
      resolve( [
        {id: "1", name: "John", email: "john@server.net", age: 21},
        {id: "2", name: "Doe", email: "doe@server.net", age: 32},
      ]);
    },
    1000 );
  })
}

async function deleteUserAsync(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`User with id ${id} deleted on server`);
      resolve()
    }, 1000)
  })
}