/**
 * @callback AnimationEasing
 * @param {number} x
 * @return {number}
 */

/**
 * @enum {number}
 */
export const AnimationState = {
  Running: 1,
  Paused: 2,
  Canceled: 3,
}
/**
 * @template S
 * @typedef Animation
 * @property {number} from
 * @property {number} to
 * @property {number} [interval]
 * @property {number} [duration]
 * @property {import('src/h-state').SimpleAction<S>} [completed]
 * @property {AnimationEasing} [easing]
 * @property {(state: S) => AnimationState} [status]
 */

/**
 * @template S
 * @param {import('src/h-state').ActionWithPayload<S, number>} action 
 * @param {Animation<S>} animationParams
 * @return {import('src/h-state').EffectDef<S>}
 */
 export function animationEffect(action, animationParams) {
  return [
    animationEffectFunction,
    {
      params: animationParams,
      action: action,
    }
  ]
}

/**
 * @template S
 * @typedef AnimationEffectFunctionParams 
 * @property {import('src/h-state').ActionWithPayload<S, number>} action 
 * @property {import('src/h-state').SimpleAction<S>} [completed]
 * @property {Animation<S>} params
 */

/**
 * @template S
 * @param {import('src/h-state').FState<S>} fstate 
 * @param {AnimationEffectFunctionParams<S>} params 
 */
function animationEffectFunction(fstate, {action, params}) {
  let values = [];
  const duration = params.duration ? params.duration : 250;
  const interval = params.interval ? params.interval : 10;
  const easing = params.easing ? params.easing : x => x; 

  let n = Math.floor(duration / interval);
  let delta = (params.to - params.from) / n;
  for(let i=1; i <= n; i++) {
    let t = i / n;
    let d = delta * i * easing(t) / t;
    let v = params.from + d ;
    values.push(v);
}

let t = 0;
const id = setInterval(() => {
    if (params.status) {
      const status = params.status(fstate());
      if (status === AnimationState.Canceled) {
        clearInterval(id);
        return;
      }

      if (status === AnimationState.Paused) {
        return;
      }
    }
    fstate(action, values[t]);
    t++;
    if (t >= values.length) {
      clearInterval(id);
      if (params.completed) fstate(params.completed);
    }
  },
  duration / n);
}

/**
 * 
 * @param {number} x 
 * @return {number}
 */
export function easeOutBounce(x) {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
      return n1 * x * x;
  } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}
