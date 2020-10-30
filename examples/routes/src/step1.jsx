import { h, statefull, RouteLink } from "../../../src";
export const Step1 = statefull({
  init: {
    counter: 0,
  }
}, state => <div>
  <h2>This is STEP 1 page</h2>
  <RouteLink to="/">
    <p>Press here to navigate to main page</p>
  </RouteLink>
</div>)