import { h, statefull, RouteLink } from "../../../src";

export const Greeting = statefull({}, ({name}, childred) => <div>
  <h2>Hello {name}</h2>
  <p>This is staring page</p>
  <RouteLink to="/step1">
    Click here to go to the next screen
  </RouteLink>
</div>)