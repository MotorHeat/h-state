import { h, statefull, RouteLink, inject } from "../../../src";

/**
 * Step1 state.
 * 
 * @typedef {object} Step1State
 * @property {string} activeRoute
 */

export const Step1 = statefull({
  /** @type {Step1State} **/
  init: {
    activeRoute: '',
  },
  sensors: () => [ inject("activeRoute", injectActiveRoute) ]
}, state => <div>
  <h2>This is STEP 1 page</h2>
  <h4>Active route is {state.activeRoute}</h4>
  <RouteLink to="/">
    <p>Press here to navigate to main page</p>
  </RouteLink>
</div>)

/**
 * Sets active route value.
 * 
 * @param {Step1State} state -
 * @param {import("src").ActiveRoute} data -
 * @return {Step1State} -
 */
const injectActiveRoute = (state, data) => ({...state, activeRoute: data.path})
