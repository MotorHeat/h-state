import { h, statefull } from '../../../src'
import { Timer, timerInit } from './timer'

const mainInit = {
  timer: timerInit,
  timer2: timerInit,
}

export const Main = statefull( {
    init: mainInit,
  },
  s =>
  <div>
    <Timer mp="timer"/>
    <Timer mp="timer2"/>
  </div>
)
