import { h, statefull, RouteLink, inject } from "../../../src";

/**
 * GreetingState.
 * 
 * @typedef {object} GreetingState
 * @property {string} name
 * @property {string} activeRoute
 */

export const Greeting = statefull({
  /** @type {GreetingState} */ init: {
    name: '',
    activeRoute: '',
  },
  sensors: () => [
    inject('activeRoute', injectActiveRoute)    
  ]
  
}, ({name, activeRoute}, childred) => <div>
  <h2>Hello {name}</h2>
  <p>This is staring page</p>
  <p>Active route is {activeRoute}</p>
  <RouteLink to="/step1">
    Click here to go to the Step 1
  </RouteLink>
  <RouteLink to="/step2">
    Click here to go to the Step 2
  </RouteLink>
  <RouteLink to="/step3">
    Click here to go to the Step 3
  </RouteLink>
</div>)

/**
 * Inject active route.
 * 
 * @param {GreetingState} state -
 * @param {import("src").ActiveRoute} activeRoute -
 * @return {GreetingState} -
 */
const injectActiveRoute = (state, activeRoute) => ({...state, activeRoute: activeRoute.path})
