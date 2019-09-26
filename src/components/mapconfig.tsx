import { HereMapsConfig } from "../libs/heremaps.module"

export class MapConfig {

  protected static config:HereMapsConfig

  public static Init(config:HereMapsConfig):void {
    MapConfig.config = config
  }

  public static Get():HereMapsConfig {
    return MapConfig.config
  }
}
