import { h, batch, logEffect, statefull } from '../../../src'

/**
 * @typedef UsersState
 * @property {any[]} data
 * @property {string | Error} error
 * @property {boolean} loading
 */

const usersActions = {
  setUsers: (s, d) => ({...s, data: d}),
  setLoading: (s, v) => ({...s, loading: v}),
  setError: (s, v) => [ {...s, error: v && v.message || v}, logEffect("setError")],
  deleteUser: (s, id) => ({...s, data: s.data.filter(x => x.id !== id)}),
}

const usersActionsWithEffects = {
  loadUsers: s => [
    ({...s, data: [], loading: true, error: null}),
    loadUsersEffect(usersActionsWithEffects.setUsers, usersActionsWithEffects.setError)
  ],
  setUsers: (s, v) => ({...s, loading: false, data: v}),
  setError: (s, v) => [ {...s, loading: false, error: v && v.message || v}, logEffect("setError") ],
}

const loadUsersEffect = (ok, err) => [ loadUsersEffectRunner, {ok, err} ]

function loadUsersEffectRunner(fstate, {ok, err}) {
  loadUsersAsync()
    .then(data => fstate([ok, data]))
    .catch(e => fstate([err, e]))
}


const loadUsersBatch = batch( [
  [ usersActions.setLoading, true ],
  [ usersActions.setError, null ],
  [ usersActions.setUsers, [] ],
  [ usersActions.setUsers, loadUsersAsync, usersActions.setError ],
  [ usersActions.setLoading, false ],
]);

/** @type {import('../../components/web_modules/h-state').Change<UsersState>} */
const usersInit = [ {
    data: [],
    loading: false,
    error: null,
  },
  [ initUsersEffect ]
]

const deleteUserBatch = batch([
  [ usersActions.setLoading, true ],
  [ usersActions.setError, null ],
  [ usersActions.deleteUser, async ([id]) => (await deleteUserAsync(id), id), usersActions.setError ],
  [ usersActions.setLoading, false ],
])

export const Users = statefull( {
    init: usersInit,
  },
  (state) => <div>
    <button disabled={state.loading} onclick={loadUsersBatch}>Load users</button>
    <button disabled={state.loading} onclick={usersActionsWithEffects.loadUsers}>Load users (effects)</button>
    {state.data.length > 0 && <button disabled={state.loading} onclick={[deleteUserBatch, state.data[state.data.length - 1].id]}>Delete last user</button>}

    {state.error && <p>{state.error}</p>}
    {!state.error && <ul>
      {state.data.map(User)}
    </ul> }
  </div>
)

function User({name, email, age}) {
  return <li>
    <h4>Name: {name}</h4>
    <h4>Email: {email}</h4>
    <h4>Age: {age}</h4>
  </li>
}


function initUsersEffect(fstate) {
  fstate([ loadUsersBatch ])
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