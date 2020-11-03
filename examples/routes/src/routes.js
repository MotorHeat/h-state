import { Greeting } from "./greeting";
import { Step1 } from "./step1";

/** @type {import("../../../src/router").RoutePath<any>[]} */
export const appRoutes = [
  {
    path: "/",
    view: Greeting,
    mp: "greeting"
  },
  {
    mp: "step1",
    path: "/step1",
    view: Step1,
  },
  {
    mp: "step1",
    path: "/step2",
    view: Step1,
  },
  {
    mp: "step1",
    path: "/step3",
    view: Step1,
  }
]
