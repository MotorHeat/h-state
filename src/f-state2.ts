import { h as hsf, patch, text } from 'superfine';

interface VNode {
  props: object
}

type EffectFunction<S, P = any> = ((fstate: IState<S>, params: P) => void) | ((fstate: IState<S>) => void)
type EffectDef<S, P = any> = [ EffectFunction<S, P>, P ] | [ EffectFunction<S> ]

type NotFunction<S> = S extends Function ? never : S
type StateWithEffects<S> = [ NotFunction<S>, ...EffectDef<S>[] ]
type StateOrStateWithEffects<S> = NotFunction<S> | StateWithEffects<S>

type SimpleAction<S> = (state: S) => StateOrStateWithEffects<S>
type ActionWithPayload<S, P> = (state: S, payload: P) => StateOrStateWithEffects<S>

type Change<S, P = any> = NotFunction<S>
  | StateOrStateWithEffects<S>
  | SimpleAction<S>
  | ActionWithPayload<S, P>
  | [ (state: S, payload: P) => StateOrStateWithEffects<S>, P ]

interface IState<S> {
  (): S
  (change: Change<S>): void
  <P>(change: Change<S, P>, payload: P): void
}

interface IMapper<P, C> {
  get(parent: P): C
  set(parent: P, child: C): P
}

type MapperDef<P, C> = string | IMapper<P, C>

type StopSensorFunc = () => void
type StartSensorFunc<D, P> = (callback: (data: D) => void, params: P) => StopSensorFunc
interface ISensorDef<S, D, P = any> {
  start: StartSensorFunc<D, P>
  params: P
  action: ActionWithPayload<S, D>
  isActive: (state: S) => boolean
}

type Sensor<S> = (fstate?: IState<S>) => void

interface AppParams<S> {
  node: Element
  view: ViewFunction<S>
  init: Change<S>
  log?: ((state: S) => void) | ((state: S) => void)[]
}

function applyChange<S, P>(fstate: IState<S>, setState: (newState: S) => void, change: Change<S, P>, changePayload?: P): void {
  isFunction(change)
    ? applyChange(fstate, setState, (change as ActionWithPayload<S, P>)(fstate(), changePayload))
    : isArray(change)
      ? isFunction(change[0])
        ? applyChange(fstate, setState, change[0], change[1])
        : (setState((change as StateWithEffects<S>)[0]),
            ((change as StateWithEffects<S>).slice(1))
            .forEach(fx => isArray(fx) && isFunction(fx[0]) && fx[0](fstate, fx[1]))
          )
      : setState(change as NotFunction<S>)
}

function newState<S>(listener: (state: S) => void): IState<S> {
  let state: S = undefined;
  const setState = (newState: S) => (newState !== state && (state = newState, listener && listener(state)))
  return function fstate() {
    if (arguments.length == 0) return state
    applyChange(fstate, setState, arguments[0], arguments[1])
  }
}

function map<P, C>(parent: IState<P>, mapperDef: MapperDef<P, C>, init: Change<C>, listener: (mstate: IState<C>) => void): IState<C> {
  const map: IMapper<P, C> = isString(mapperDef) ? mapper<P, C>(mapperDef as string) : mapperDef as IMapper<P, C>

  const setState = (newState: C) => 
    newState !== map.get(parent()) 
      && (parent( ((s: P) => map.set(s, newState)) as SimpleAction<P> ), listener && listener(mapped))

  function mapped(change?: Change<C>, payload?: any) {
    if (arguments.length == 0) return map.get(parent());
    applyChange(mapped, setState, change, payload)
  }

  isUndefined(mapped()) ? mapped(init) : (listener && listener(mapped))
  
  return mapped;
}

const mapper = <P, C>(prop: string): IMapper<P, C> => ({
    get: s => s[prop],
    set: (s, v) => s[prop] === v ? s : (s = {...s}, s[prop]=v, s),
})

export function sensor<S, D>({start, params, action, isActive}: ISensorDef<S, D>): Sensor<S> {
  let unsubscribe: StopSensorFunc = null
  let disposed = false
  const stop = () => unsubscribe && (unsubscribe(), unsubscribe = null)
  return function (fstate) {
    (!arguments.length || disposed)
      ? (stop(), disposed = true)
      : isActive(fstate())
        ? !unsubscribe && (unsubscribe = start(data => fstate(action, data), params))
        : stop() 
  }
}

const cleanupMappedStates = (prevUsedState: Map<IState<any>, IUsedStateMeta>, usedStates: Map<IState<any>, IUsedStateMeta>, mappedStates: Map<IState<any>, Map<MapperDef<any, any>, IMappedStateMeta>>): void =>
  prevUsedState.forEach( ({parent, mp, done}, s) =>
    !usedStates.get(s) && (
      (mappedStates.get(parent).get(mp).sensors || []).forEach(x => x()), //dispose all the sensors
      done && s(done),
      mappedStates.delete(s),
      mappedStates.get(parent).delete(mp)
    ))

export function app<S>({node, view, init, log}: AppParams<S>) {
  let fstate = newState<S>(appListener)
  let rendering = false
  let sensors = view.$sensors && view.$sensors()
  const context = createAppContext(fstate)
  function appListener(state: S): void {
    log && (isArray(log) ? log.forEach(l => l(state)) : log(state))
    sensors.forEach(x => x(fstate))
    if (!rendering) {
      rendering = true
      defer( () => {
        const prevUsedState = context.uStates
        context.uStates = new Map()
        appContext = context
        try {
          patch(node, view(state))
          cleanupMappedStates(prevUsedState, context.uStates, context.mStates)
        } finally {
          appContext = null;
          rendering = false
        }
      });
    }
  }

  fstate(init || view.$init);
}

interface IMappedStateMeta {
  mstate: IState<any>
  sensors: Sensor<any>[]
}

interface IUsedStateMeta {
  parent: IState<any>
  mp: MapperDef<any, any>
  done?: Change<any>
}

interface IAppContext {
  states: IState<any>[]
  mStates: Map<IState<any>, Map<MapperDef<any, any>, IMappedStateMeta>> //mapper states
  uStates: Map<IState<any>, IUsedStateMeta> //used states
}


let appContext: IAppContext = null;
const createAppContext = (rootState: IState<any>): IAppContext => ({states:[rootState], mStates: new Map(), uStates: new Map()})
const getCurrentState = () => appContext.states[appContext.states.length - 1]
const createUsedStateMeta = (parent: IState<any>, mp: MapperDef<any, any>, done: Change<any>): IUsedStateMeta => ({parent, mp, done})

interface ViewFunction<S> {
  (state: S, children?: VNode[]): VNode
  $init?: Change<S>
  $done?: Change<S>
  $sensors?: () => Sensor<S>[]
}

interface FstateProps<S> {
  $state?: MapperDef<any, any>
  $done?: Change<any>
}

function getMappedState<S>(type: ViewFunction<S>, props: FstateProps<S>): IState<S> {
  let current = getCurrentState()
  let mapped = appContext.mStates.get(current)
  if (!mapped) {
    mapped = new Map()
    appContext.mStates.set(current, mapped)
  }
  const mappedMeta = mapped.get(props.$state)
  let mstate = mappedMeta && mappedMeta.mstate || null
  if (!mstate) {
    let sensors = type.$sensors && type.$sensors();
    mstate = map<any, S>(current, 
      props.$state,
      type.$init,
      s => sensors && sensors.forEach(x => x(s))
    );
    mapped.set(props.$state, { mstate, sensors })
  }
  appContext.uStates.set(mstate, createUsedStateMeta(current, props.$state, props.$done || type.$done))
  return mstate
}

export function h(type: string | ViewFunction<any>, props: {} & FstateProps<any>, ...children: VNode[]): VNode {
  if (isFunction(type)) {
    if (props && props.$state) {
      let mstate = getMappedState(type as ViewFunction<any>, props)
      appContext.states.push(mstate);
      try { return (type as ViewFunction<any>)(props ? {...props, ...mstate()} : mstate(), children) }
      finally { appContext.states.pop(); }
    } else {
      return (type as ViewFunction<any>)(props, children)
    }
  } else {
    return hookEvents(hsf(type as string, props || {} , 
      [].concat( ...children)
      .filter(c => typeof(c) !== "boolean" && !isUndefined(c) && c !== null)
      .map(c => isString(c) || typeof c === "number" ? text(c) : c)
    ),
    getCurrentState());
  }
}

function hookEvents(vnode: VNode, fstate: IState<any>): VNode {
  return !vnode || !vnode.props
    ? vnode 
    : (Object.keys(vnode.props)
    .filter(p => p.startsWith("on"))
    .map(p => ([vnode.props[p] as Change<any>, p]) as [Change<any>, string])
    .forEach(([action, p]: [Change<any>, string]) => vnode.props[p] = (e) => 
      isArray(action) 
        ? fstate(action[0], isFunction(action[1]) ? action[1](e) : action[1])
        : fstate(action, e)),
      vnode)
}

const isArray = Array.isArray
const isFunction = obj => typeof(obj) === "function"
const isUndefined = obj => typeof(obj) === "undefined"
const isString = obj => typeof(obj) === "string"

const defer = typeof(requestAnimationFrame) === "undefined" ? setTimeout :  requestAnimationFrame