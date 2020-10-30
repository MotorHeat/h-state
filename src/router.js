import { h, statefull, sensor } from './h-state'
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
 */

/**
 * Router view.
 * 
 * @param {RouterState} state 
 * @return {import('./h-state').VNode}
 */
function routerView(state) {
  // TODO: implement smart route parsing
  const route = state.routes.find(x => x.path === state.currentPath)
  return route && h(route.view, {mp: route.mp, level: 0})
}

const routerActions = {
  setCurrentPath: (state, path) => ({...state, currentPath: path}),
  historyPushState: (/** @type {any} */ state, /** @type {string} */ newLocation) => [
    state,
    [ historyPushStateEffect, newLocation ]
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
function startRouterSensor(callback) {
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
      currentPath: '',
      routes: [],
    },
    sensors: () => [
      sensor({
        start: startRouterSensor,
        isActive: () => true,
        action: routerActions.setCurrentPath,
      })
    ],
  },
  routerView
)

export function RouteLink({ to }, children) {
  return h("a", {
      _target: 'blank',
      href: to,
      onclick: [routerActions.historyPushState, e => { e.preventDefault(); e.stopPropagation(); return to }]
    },
    children)
}