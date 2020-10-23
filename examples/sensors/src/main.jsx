import { h } from 'h-state'

import { MouseCursor } from "./mouseCursor"

export function Main() {
  return <div>
    <h1>This is example of how to create and to embed components that uses sensors</h1>
    <h2>Click the "watch" button to toggle sensor state</h2>
    <MouseCursor $mp="mouse1"></MouseCursor>
    <MouseCursor $mp="mouse2"></MouseCursor>
  </div>
}

Main.$init = {
  mouse1: MouseCursor.$init,
}