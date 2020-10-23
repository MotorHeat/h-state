import { app } from 'h-state'
import { Users } from './users'

app( {
  node: document.getElementById("app"),
  view: Users,
})
