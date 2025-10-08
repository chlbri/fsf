import type { Machine } from './Machine';
import type {
  Config,
  ConfigDef,
  ConfigTypes,
  NoExtraKeysConfig,
  NoExtraKeysConfigDef,
  TransformConfigDef,
} from './types2';

export type CreateLogic_F = <
  const C2 extends
    NoExtraKeysConfigDef<ConfigDef> = NoExtraKeysConfigDef<ConfigDef>,
  const C extends Config & TransformConfigDef<C2> = Config &
    TransformConfigDef<C2>,
  const T extends ConfigTypes<C> = ConfigTypes<C>,
>(
  config: NoExtraKeysConfig<C & { __tsSchema?: NoExtraKeysConfigDef<C2> }>,
  types: T,
) => Machine<C, T>;
