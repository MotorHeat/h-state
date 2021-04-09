import { h, intervalSensor, statefull, animationEffect, easeOutBounce, AnimationState } from '../../../src'

/**
 * @typedef TimerState
 * @property {number} timer
 * @property {boolean} running
 * @property {number} hours
 * @property {number} minutes
 * @property {number} seconds
 * @property {number} milliseconds
 * @property {string} animateTimerStyle
 * @property {number} animationState
 */

const timerActions = {
  /**
   * 
   * @param {TimerState} state 
   * @param {number} value 
   * @return {TimerState}
   */
  add: (state, value) => ({...state, timer: state.timer + value}),

  /**
   * 
   * @param {TimerState} s 
   * @param {number} v 
   * @return {TimerState}
   */
  animateTimer: (s, v) => ({...s, animateTimerStyle: `transform: translateY(${v}px) translateX(${v}px); background-color: green;`}),
  /**
   * 
   * @param {TimerState} state 
   * @return {import('src/h-state').Change<TimerState>}
   */
  start: state => [
    {...state, running: true, animationState: AnimationState.Running}, 
    animationEffect(
      timerActions.animateTimer,
      {
        from: 0,
        to: 200,
        // interval: 10,
        duration: 3000,
        easing: easeOutBounce,
        completed: s => [
          {...s, running: false},
          animationEffect(
            timerActions.animateTimer,
            {
              from: 200,
              to: 0,
              completed: s => ({...s, animateTimerStyle: ''})
            }
          )
        ],
        status: s => s.animationState
      }
    )
  ],
  /**
   * 
   * @param {TimerState} state 
   * @return {TimerState}
   */
  pause: state => state.running ? ({...state, running: false, animationState: AnimationState.Paused}) : state,
  /**
   * 
   * @param {TimerState} state 
   * @return {TimerState}
   */
  unpause: state => ({...state, running: true, animationState: AnimationState.Running}),
  /**
   * 
   * @param {TimerState} state 
   * @return {TimerState}
   */
  stop: state => ({...state, running: false, timer: 0, animateTimerStyle: '', animationState: AnimationState.Canceled}),
}

/** @type {TimerState} */
export const timerInit = {
  timer: 0,
  hours: 0,
  milliseconds: 0,
  minutes: 0,
  seconds: 0,
  running: false,
  animateTimerStyle: '',
  animationState: AnimationState.Canceled,
}

export const Timer = statefull(
  {
    init: timerInit,
    sensors: () => [
      intervalSensor(10, s => s.running, timerActions.add)
    ] 
  }, 
  (state) => <div>
      <h3 style={state.animateTimerStyle}>{state.timer}</h3>
      <button onclick={timerActions.start} disabled={state.running || state.animationState == AnimationState.Paused}>START</button>
      <button onclick={timerActions.stop}>STOP</button>
      <button onclick={timerActions.pause}>PAUSE</button>
      <button onclick={timerActions.unpause}>UNPAUSE</button>
    </div>
  )

