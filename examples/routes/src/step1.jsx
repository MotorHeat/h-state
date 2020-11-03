import { h, statefull, RouteLink, sensor, getGlobalSensor } from "../../../src";

export const Step1 = statefull({
  init: {
    activeRoute: '',
  },
  sensors: () => [ getGlobalSensor("activeRoute", setActiveRouteAction) ]
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
 * @param {any} state -
 * @param {import("src").ActiveRoute} data -
 * @return {any} -
 */
function setActiveRouteAction(state, data) {
  return {...state, activeRoute: data.path}
}