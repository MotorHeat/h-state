export interface FState<S> {
  (): S;
  (change: Change<S>): void;
  <P>(action: ActionWithPayload<S, P>, payload: P): void
}

export type Change<S> = StateOrStateWithEffects<S> | SimpleAction<S> | [ ActionWithPayload<S, any>, any ]
export type ActionWithPayload<S, P> = (state: S, payload: P) => StateOrStateWithEffects<S>
export type SimpleAction<S> = (state: S) => StateOrStateWithEffects<S>
export type StateOrStateWithEffects<S> = S | StateWithEffects<S>
export type StateWithEffects<S> = [ S, ...EffectDef<S>[] ]
export type EffectDef<S> = [EffectFunction<S, any>, any] | [ EffectFunction<S, any> ]
export type EffectFunction<S, P> = (fstate: FState<S>, params: P) => void

export interface VNode {
  props: object
}

export type Sensor<S> = (fstate?: FState<S>) => void //fstate - Functional state that has changed. If it is ommitted then sensor moves to disposed state.

export interface StatefulMetadata<S> {
  init?: Change<S>
  done?: Change<S>
  sensors?: () => Sensor<S>[]
}

export type ViewFunction<S> = (state: S, children?: VNode[]) => VNode;

export interface IMapper<P, C> {
  get: (parent: P) => C
  set: (parent: P, child: C) => P
}

export type MapperDef<P,C> = string | IMapper<P, C>

export interface StatefulProps<S> {
  mp: MapperDef<any, S>;
  key?: any
}
  
export type StopSensorFunc = () => void;
export type StartSensorFunc<D, P> = (callback: (data: D) => void, params: P) => StopSensorFunc;

export interface ISensorDef<S, D, P> {
  start: StartSensorFunc<D, P>
  params?: P
  action: ActionWithPayload<S, D>
  isActive: (state: S) => boolean
    
}

export type Logger<S> = (state: S) => void
export interface AppParams<S> {
  node: Element
  view: ViewFunction<StatefulProps<S>>
  log?: Logger<S> | Logger<S>[]
}

type MakeSureActionWithPayload<S, A> = A extends ActionWithPayload<S, infer P> ? [ActionWithPayload<S, P>, P] : never

export type ActionInBatch<S> = ( 
    [ SimpleAction<S> ]
  | [ ActionWithPayload<S, any>, any]
  | [ ActionWithPayload<S, any>, (args: Array<any>) => Promise<any>]
  | [ ActionWithPayload<S, any>, (args: Array<any>) => Promise<any>, ActionWithPayload<S, Error>]
  )

export function h<S>(type: string | ViewFunction<S>, props: S, ...children: VNode[]): VNode
export function batch<S, P>(actions: ActionInBatch<S>[]): ActionWithPayload<S, P>
export function batch<S>(actions: ActionInBatch<S>[]): SimpleAction<S>
export function mount<P, C>(get: (parent: P) => C, set: (parent: P, child: C) => P): IMapper<P, C>
export function app<S>(params: AppParams<S>): void
export function sensor<S, D, P>(params: ISensorDef<S, D, P>): Sensor<S>
export function statefull<S>(metadata: StatefulMetadata<S>, view: ViewFunction<S>): ViewFunction<StatefulProps<S>>
//export function logEffect<S>(message: string): EffectDef<S>