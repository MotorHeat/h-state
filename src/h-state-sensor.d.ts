type SensorDataReciever<D> = (data: D) => void;
type Sensor<D,P> = (notify: SensorDataReciever<D>, props?: P) => () => void;

interface ISensorDefinition<S, D, P = any> {
  sensor: Sensor<D,P>
  props?: P | ((state: S) => P)
  isActive: (state: S) => boolean
  action: (state: S, data: D) => S
}

interface IMapper<S,C> {
  get(state: S): C
  set(state: S, value: C): S
}

function processSensors<S, D>(getSensors: ((state: S) => ISensorDefinition<S, D>[])): (state: S) => void;
function mapSensor<S, C, D>(sensorDef: ISensorDefinition<C,D>, mapper: IMapper<S, C>): ISensorDefinition<S, D>;
function mapSensors<S, C, D>(sensorDef: ISensorDefinition<C,D>[], mapper: IMapper<S, C>): ISensorDefinition<S, D>[];
// function mount(get: ((state: S) => C), set: ((state: S, value: C) => S)): IMapper<S,C>;
