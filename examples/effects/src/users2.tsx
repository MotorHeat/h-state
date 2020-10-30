import { h, batch, logEffect, statefull, Change, StateWithEffects, FState } from '../../../src'

interface UsersState {
  data: any[]
  error: string | Error
  loading: boolean
}

const usersActions = {
  setUsers: (s: UsersState, d: any[]): UsersState => ({...s, data: d}),
  setLoading: (s: UsersState, v: boolean): UsersState => ({...s, loading: v}),
  setError: (s: UsersState, v: Error | null): StateWithEffects<UsersState> => [ {...s, error: v && v.message || v}, logEffect<UsersState>("setError")],
  deleteUser: (s: UsersState, id: string): UsersState => ({...s, data: s.data.filter(x => x.id !== id)}),
}

const usersActionsWithEffects = {
  loadUsers: (s: UsersState) => [
    ({...s, data: [], loading: true, error: null}),
    loadUsersEffect(usersActionsWithEffects.setUsers, usersActionsWithEffects.setError)
  ],
  setUsers: (s, v) => ({...s, loading: false, data: v}),
  setError: (s: UsersState, v: Error | null): StateWithEffects<UsersState> => [ {...s, loading: false, error: v && v.message || v}, logEffect<UsersState>("setError") ],
}

const loadUsersEffect = (ok, err) => [ loadUsersEffectRunner, {ok, err} ]

function loadUsersEffectRunner(fstate, {ok, err}) {
  loadUsersAsync()
    .then(data => fstate([ok, data]))
    .catch(e => fstate([err, e]))
}

const loadUsersBatch = batch<UsersState>( [
  [ usersActions.setLoading, true ],
  [ usersActions.setError, null ],
  [ usersActions.setUsers, [] ],
  [ usersActions.setUsers, loadUsersAsync, usersActions.setError ],
  [ usersActions.setLoading, false ],
]);

const usersInit: Change<UsersState> = [ {
    data: [],
    loading: false,
    error: null,
  },
  [ initUsersEffect ]
]

const deleteUserBatch = batch<UsersState>([
  [ usersActions.setLoading, true ],
  [ usersActions.setError, null ],
  [ usersActions.deleteUser, async ([id]) => await deleteUserAsync(id), usersActions.setError ],
  [ usersActions.setLoading, false ],
])

export const Users = statefull<UsersState>( {
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


function initUsersEffect(fstate: FState<UsersState>) {
  fstate(loadUsersBatch)
}

async function loadUsersAsync(): Promise<any[]> {
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

async function deleteUserAsync(id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`User with id ${id} deleted on server`);
      resolve(id)
    }, 1000)
  })
}