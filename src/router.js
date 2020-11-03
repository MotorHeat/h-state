import { h, statefull, sensor, setGlobalEffect, getGlobalSensor } from './h-state'
/**
 * Route path.
 *
 * @template S 
 * @typedef RoutePath
 * @property {string} path
 * @property {import('./h-state').ViewFunction<import('./h-state').StatefulProps<S>>} view
 * @property {import('./h-state').MapperDef<any, S>} mp
 */

/**
 * Router state.
 * 
 * @typedef RouterState
 * @property {string} currentPath
 * @property {RoutePath<any>[]} routes
 * @property {RoutePath<any>} current
 */

/**
 * Router view.
 * 
 * @param {RouterState} state -
 * @return {import('./h-state').VNode} -
 */
const routerView = state => {
  return state.current && h(state.current.view, {mp: state.current.mp})
}

/** 
 * Executes effect to change current route. Can be called on top of any state. Current state does't changed.
 * 
 * @param {any} state -
 * @param {string} newLocation -
 * @return {import('./h-state').Change<any>} -
 */
const historyPushState = (state, newLocation) => [
  state,
  [ historyPushStateEffect, newLocation ]
]

/**
 * 
 * @typedef ActiveRoute
 * @property {string} path
 */

/**
 * Sets current path and calculates current view according to routes.
 * 
 * @param {RouterState} state -
 * @param {string} path -
 * @return {import('./h-state').StateWithEffects<RouterState>} -
 */
function setCurrentRouterPathAction(state, path) {
  // TODO: implement smart route parsing
  const route = state.routes.find(x => x.path === path)
  return [
    {...state, currentPath: path, current: route},
    [ setGlobalEffect, {name: "activeRoute", value: {path: path}} ]
  ]
}

const routerEvent = 'h-state-router-event'

/**
 * Effect function that sets new route.
 * 
 * @param {import('./h-state').FState<RouterState>} fstate 
 * @param {string} location
 * @return {void}
 */
function historyPushStateEffect(fstate, location) {
  history.pushState(location, '', location)
  window.dispatchEvent(new CustomEvent(routerEvent, { detail: location }))
}

/**
 * Start listening to history events.
 * 
 * @param {(path: string) => void} callback - A function that will be called each time sensor produce a new value.
 * @return {import('./h-state').StopSensorFunc} - Function to stop sensor.
 */
function startPopStateSensor(callback) {
  const doRouterEvent = () => callback(window.location.pathname)
  window.addEventListener('popstate', doRouterEvent)
  window.addEventListener(routerEvent, doRouterEvent)
  return () => {
    window.removeEventListener(routerEvent, doRouterEvent)
    window.removeEventListener('popstate', doRouterEvent)
  }
}

export const Router = statefull( {
    init: {
      currentPath: window.location.pathname,
      routes: [],
      current: null,
    },
    sensors: () => [
      sensor({
        start: startPopStateSensor,
        isActive: () => true,
        action: setCurrentRouterPathAction,
      }),
      getGlobalSensor('routes', (s, v) => setCurrentRouterPathAction({...s, routes: v}, s.currentPath))
    ],
  },
  routerView
)

export function RouteLink({ to }, children) {
  return h("a", {
      _target: 'blank',
      href: to,
      onclick: [historyPushState, e => (e.preventDefault(),e.stopPropagation(),to)]
    },
    children)
}