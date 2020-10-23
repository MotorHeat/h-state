import { h as hsf, patch, text } from 'superfine';

/**
 * Functional state.
 * 
 * @template S
 * @typedef { ReadState<S> & SetState<S> } FState
 */

/**
 * @template S
 * @typedef { () => S } ReadState
 */

/**
 * @template S
 * @typedef { ((change: Change<S>) => void) & (CallActionWithPayload<S>)} SetState
 */

/** 
 * @template S
 * @typedef {<P>(action: ActionWithPayload<S, P>, payload: P) => void} CallActionWithPayload
 */

/**
 * @template S
 * @typedef { S | SimpleAction<S> | ([ActionWithPayload<S, any>, any]) } Change
 */

/**
 * Simple action. It accepts current state and should return a new state (possibly with effects).
 * 
 * @template S
 * @typedef { (state: S) => StateOrStateWithEffects<S> } SimpleAction
 */

 /**
  * Action with payload is a tuple of action and payload argument.
  * 
  * @template S
  * @template P
  * @typedef {(state: S, payload: P) => S} ActionWithPayload
  */

/**
 * Effect Function.
 * 
 * @template S
 * @template P
 * @callback EffectFunction
 * @param { FState<S> } fstate - Functional state, effect function can read state and change state via this parameter.
 * @param {P} [params] - An optional parameters to the effect function.
 * @return {void}
 */

 /**
  * Effect definition.
  * 
  * @template S
  * @typedef {([EffectFunction<S, any>, any] | [ EffectFunction<S, any> ])} EffectDef
  */

/**
 * State with effects.
 * 
 * @template S
 * @typedef { [ S, ...EffectDef<S>[] ] } StateWithEffects
 */

 /** 
  * StateOrStateWithEffects.
  * 
  * @template S
  * @typedef { S | StateWithEffects<S> } StateOrStateWithEffects
  */

 /**
  * Listener is called each time state has changed. The new state is passed as an argument.
  * 
  * @template S
  * @callback StateListener
  * @param {S} state - The new state value.
  * @return {void}
  */

/**
 * Mapper interface.
 * 
 * @template P
 * @template C
 * @typedef IMapper
 * @property {(parent: P) => C} get - Extracts child state from parent.
 * @property {(parent: P, child: C) => P} set - It should inject a child state to the parent one and return a new(!) parent state.
 */
 
/**
 * Mapper definition. It can be either string or IMapper.
 * 
 * @template P
 * @template C
 * @typedef { string | IMapper<P, C> } MapperDef
 */
 
/**
 * Sensor is a functions that is called on each state change. 
 * It checks if sensor should be active or not and activates or deactivates it accordingly.
 * Sensor also can be in disposed state - in this state it doesn't react to state changes.
 * To move sensor to disposed state call it without arguments.
 * 
 * @template S
 * @callback Sensor
 * @param { FState<S> } [fstate] - Functional state that has changed. If it is ommitted then sensor moves to disposed state.
 * @return { void }
 */

/** Sensor defintion structure.
 * 
 * @template S
 * @template D
 * @template P
 * @typedef ISensorDef
 * @property {StartSensorFunc<D, P>} start - Start sensor function.  
 * @property {P} [params]
 * @property {ActionWithPayload<S, D>} action
 * @property {(state: S) => boolean} isActive
 */

/** Start sensor function. Once called this function should call "callback" on each sensor event.
 * 
 * @template D
 * @template P
 * @typedef {(callback: (data: D) => void, params: P) => StopSensorFunc} StartSensorFunc
 */

/** Stop sensor function.
 * 
 * @typedef {() => void} StopSensorFunc
 */

/** Application entry parameters.
 * 
 * @template S
 * @typedef AppParams
 * @property {Element} node
 * @property {View<S>} view
 * @property {Change<S>} [init]
 * @property {((state: S) => void) | (((state: S) => void)[])} [log]
 */

 /** View function.
  * 
  * @template S
  * @callback ViewFunction
  * @param {S} state
  * @param {VNode[]} [children]
  * @return {VNode}
  * 
  */

/** View function custom properties.
 * 
 * @template S
 * @typedef ViewFunctionMeta
 * @property {Change<S>} [$init] - If parent state has "undefined" for the component state then this value witll be injected instead.
 * @property {Change<S>} [$done] - When child component's state is disposed then this change will be inserted to it. Be carefull with effects here.
 * @property {() => Sensor<S>[]} [$sensors] - This function is called when component state is attached for the first time. It should return array of Sensors that will be bounded to a component's state.
 */

/** View.
 * 
 * @template S
 * @typedef {ViewFunction<S> & ViewFunctionMeta<S>} View
 */

/** VNode interface.
 *
 * @typedef VNode
 * @property {object} props 
 */
 
/**
 * Mapped state metadata. Used internally. 
 * 
 * @typedef IMappedStateMeta
 * @property {FState<any>} mstate - Mapped state.
 * @property {Sensor<any>[]} sensors - Bounded to the mapped state sensors.
 */

/**
 * Used state metadata. Used internally.
 * 
 * @typedef IUsedStateMeta
 * @property {FState<any>} parent - A parent state.
 * @property {MapperDef<any, any>} mp - Mapper definition that was used upon mapped state creation.
 * @property {Change<any>} [done] - Optional change that will be applied just before disposing mapped state.
 */
 
/**
 * App context interface.
 * 
 * @typedef IAppContext
 * @property {FState<any>[]} states 
 * @property {Map<FState<any>, Map<MapperDef<any, any>, IMappedStateMeta>>} mStates
 * @property {Map<FState<any>, IUsedStateMeta>} uStates
 */

 /** Well known props.
  * 
  * @typedef WellKnownProps
  * @property {MapperDef<any, any>} [$mp]
  * @property {any} [key]
  */

/** FState props
 * @template S
 * @typedef { WellKnownProps & ViewFunctionMeta<S>} ViewFunctionOptionalProps
 */

 /** View function props.
  * 
  * @template S
  * @typedef {S & ViewFunctionOptionalProps<S>} Props<S>
  */

/** Applies changes to the functional state. Used internally.
 * 
 * @template S
 * @param {FState<S>} fstate - Functional state that will be passed to effects.
 * @param {(newState: S) => void} setState - A function that should save a new state that is passed as an argument.
 * @param {Change<S>} change - A change to apply to a functional state.
 * @param {any} actionPayload - A payload that will besent to a action if required.
 */
function applyChange(fstate, setState, change, actionPayload) {
  isFunction(change)
    // @ts-ignore
    ? applyChange(fstate, setState, change(fstate(), actionPayload))
    : isArray(change)
      ? isFunction(change[0])
        // @ts-ignore
        ? applyChange(fstate, setState, change[0], change[1])
        // @ts-ignore
        : (setState(change[0]),
           change
            .slice(1)
            .forEach(fx => isArray(fx) && isFunction(fx[0]) && fx[0](fstate, fx[1]))
          )
      // @ts-ignore
      : setState(change)
}

/** Creates new functional state.
 * 
 * @template S
 * @param {StateListener<S>} listener
 * @return {FState<S>}
 */
function newState(listener) {
  let state = undefined;
  // eslint-disable-next-line jsdoc/require-description
  /**
   * @template S 
   * @type {(newState: S) => void} */
  const setState = newState => (newState !== state && (state = newState, listener && listener(state)))
  return function fstate(change, payload) {
    if (arguments.length == 0) return state
    applyChange(fstate, setState, change, payload)
  }
}

/** Creates a new mapped functional state.
 * 
 * @template P
 * @template C
 * @param {FState<P>} parent 
 * @param {MapperDef<P,C>} mapperDef 
 * @param {Change<C>} init 
 * @param {(fstate: FState<C>) => void} listener 
 * @return {FState<C>}
 */
function map(parent, mapperDef, init, listener) {
  /** @type {IMapper<P,C>} */
  // @ts-ignore
  const mp = isString(mapperDef) ? mapper(mapperDef) : mapperDef
  const setState = newState => 
    newState !== mp.get(parent()) 
      && (parent(s => mp.set(s, newState)), listener && listener(mapped))

  function mapped(change, payload) {
    if (arguments.length == 0) return mp.get(parent());
    applyChange(mapped, setState, change, payload)
  }

  isUndefined(mapped()) ? mapped(init) : (listener && listener(mapped))
  
  return mapped;
}

/** Creates a new mapper from a property name.
 * @template P
 * @template C
 * @param {string} prop - Property name. Child state will be stored in parent using this property name.
 * @return {IMapper<P, C>} - IMapper interface.
 */
const mapper = prop => ({
    get: s => s[prop],
    set: (s, v) => s[prop] === v ? s : (s = {...s}, s[prop]=v, s),
})

/** Creates mount point from functions
 * 
 * @template P
 * @template C
 * @param {(parent: P) => C} get
 * @param {(parent: P, child: C) => P} set
 * @return {IMapper<P, C>}
 */
export const mount = (get, set) => ({get, set})

/** Creates a new sensor.
 * 
 * @template S
 * @template D
 * @template P
 * @param {ISensorDef<S, D, P>} params 
 * @return {Sensor<S>}
 */
export function sensor({start, params, action, isActive}) {
  let unsubscribe = null
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

/** Disposes mapped states. State will be disposed if after rendering it was never accessed.
 * This method also stops all the sensors and will apply change defined in "$done" property.
 * 
 * @param {Map<FState<any>, IUsedStateMeta>} prevUsedState 
 * @param {Map<FState<any>, IUsedStateMeta>} uStates 
 * @param {Map<FState<any>, Map<MapperDef<any, any>, IMappedStateMeta>>} mStates
 * @return {void}
 */
const cleanupMappedStates = (prevUsedState, uStates, mStates) =>
  prevUsedState.forEach( ({parent, mp, done}, s) =>
    !uStates.get(s) && (
      (mStates.get(parent).get(mp).sensors || []).forEach(x => x()), //dispose all the sensors
      done && s(done),
      mStates.delete(s),
      mStates.get(parent).delete(mp)
    ))

/** Application entry point. It creates application state and calls rendering each time state is changed.
 * 
 * @template S
 * @param {AppParams<S>} params - Application parameters.
 * @return {void}
 */
export function app({node, view, init, log}) {
  let fstate = newState(appListener)
  let rendering = false
  let sensors = view.$sensors && view.$sensors()
  const context = createAppContext(fstate)
  /** @param {S} state */
  function appListener(state) {
    log && (isArray(log) ? log.forEach(l => l(state)) : log(state))
    sensors && sensors.forEach(x => x(fstate))
    if (!rendering) {
      rendering = true
      defer( () => {
        const prevUsedState = context.uStates
        context.uStates = new Map()
        appContext = context
        try {
          patch(node, view(fstate()))
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

/** Action in a batch
 * 
 * @template S
 * @template P
 * @typedef { ( [ ActionWithPayload<S, P>, P]
    | [ ActionWithPayload<S, P>, (arg0?: [P, ...any[]]) => Promise<P> ]
    | [ ActionWithPayload<S, P>, (arg0?: [P, ...any[]]) => Promise<P>, ActionWithPayload<S, any> ]) } ActionInBatch
 */
 
  /** Creates a single acctions from the series of actions that can have Promise as a payload.
 * 
 * @template S
 * @template P
 * @param {[ActionInBatch<S, P>, ...ActionInBatch<S, any>[]]} actions
 * @return {CallActionWithPayload<S>} - Action with payload.
 */
export function batch(actions) {
  /** Batch effect.
   * 
   * @template P
   * @param {FState<S>} fstate
   * @param {P} payload
   */
  async function batchEffect(fstate, payload) {
    let payloadFunctionArgs = [ payload ]
    for(let item of actions) {
      let [action, data, errorAction] = item
      let p = data;
      let payLoadIsFunc = isFunction(p);
      // @ts-ignore
      payLoadIsFunc && (p = data(payloadFunctionArgs))
      
      if (p instanceof Promise) {
        try {
          p = await p
        } catch(error){
          if (!isFunction(errorAction)) throw error;
          p = error
          action = errorAction
        }
      } 
      // @ts-ignore
      payLoadIsFunc && payloadFunctionArgs.push(p)
      // @ts-ignore
      fstate( [action, p] )
    }
  }
  return (state, payload) => [ state, [ batchEffect, payload ] ];
}


/**
 * @type { IAppContext }
 */
let appContext = null;

/**
 * Creates a new application context for the provided fstate.
 * 
 * @param { FState<any> } rootState
 * @return { IAppContext }
 */
const createAppContext = (rootState) => ({states: [rootState], mStates: new Map(), uStates: new Map()})
const getCurrentState = () => appContext.states[appContext.states.length - 1]
const createUsedStateMeta = (parent, mp, done) => ({parent, mp, done})

/** Returns mapped state for a view.
 * 
 * @template C
 * @param {View<C>} type 
 * @param {ViewFunctionOptionalProps<C>} props 
 * @return {FState<C>}
 */
function getMappedState(type, props) {
  let current = getCurrentState()
  let mapped = appContext.mStates.get(current)
  if (!mapped) {
    mapped = new Map()
    appContext.mStates.set(current, mapped)
  }
  const mappedMeta = mapped.get(props.$mp)
  let mstate = mappedMeta && mappedMeta.mstate || null
  if (!mstate) {
    let sensors = type.$sensors && type.$sensors();
    mstate = map(current, 
      props.$mp,
      props.$init || type.$init,
      s => sensors && sensors.forEach(x => x(s))
    );
    mapped.set(props.$mp, { mstate, sensors })
  }
  appContext.uStates.set(mstate, createUsedStateMeta(current, props.$mp, props.$done || type.$done))
  return mstate
}

/** Creates virtual node.
 * 
 * @template S
 * @param {string | View<S>} type 
 * @param {ViewFunctionOptionalProps<S>} props 
 * @param  {...any} children 
 * @return {VNode}
 */
export function h(type, props, ...children) {
  if (isFunction(type)) {
    if (props && props.$mp) {
      // @ts-ignore
      let mstate = getMappedState(type, props)
      appContext.states.push(mstate);
      // @ts-ignore
      try { return type(props ? {...props, ...mstate()} : mstate(), children) }
      finally { appContext.states.pop(); }
    } else {
      // @ts-ignore
      return type(props, children)
    }
  } else {
    return hookEvents(hsf(type, props || {} , 
      [].concat( ...children)
      .filter(c => typeof(c) !== "boolean" && !isUndefined(c) && c !== null)
      .map(c => isString(c) || typeof c === "number" ? text(c) : c)
    ),
    getCurrentState());
  }
}

/** Hooks events bounded to vnode and routes them as @see Change to a relevant state.
 * 
 * @template S
 * @param {VNode} vnode 
 * @param {FState<S>} fstate
 * @return {VNode}
 */
function hookEvents(vnode, fstate) {
  return !vnode || !vnode.props 
    ? vnode 
    : (Object.keys(vnode.props)
    .filter(p => p.startsWith("on"))
    .map(p => [vnode.props[p], p])
    .forEach(([action, p]) => vnode.props[p] = (e) => 
      isArray(action) && isFunction(action[0])
        ? fstate(action[0], isFunction(action[1]) ? action[1](e) : action[1])
        : fstate(action, e)),
      vnode)
}

const isArray = Array.isArray
const isFunction = obj => typeof(obj) === "function"
const isUndefined = obj => typeof(obj) === "undefined"
const isString = obj => typeof(obj) === "string"

const defer = typeof(requestAnimationFrame) === "undefined" ? setTimeout :  requestAnimationFrame