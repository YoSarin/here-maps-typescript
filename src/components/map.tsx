import * as React from "react"
import { MapConfig } from "./mapconfig"
import { HereMaps } from "../libs/heremaps.module"

export interface MapProperties {
  width:string
  height:string

  location?:string
}

export class Map extends React.Component<MapProperties> {

  private location?:string;
  private width:string
  private height:string

  private mapElement:React.RefObject<HTMLDivElement>

  constructor(properties:MapProperties = {width: "480px", height: "200px"}) {
    if (MapConfig.Get() == null) {
      throw "Map needs to be configured before creation, use Map.Init() before using and instantiationg Map element"
    }
    super(properties)
    this.location = properties.location
    this.width = properties.width
    this.height = properties.height
    this.mapElement = React.createRef()
    HereMaps.OnReady(async () => {
      var map = new HereMaps(MapConfig.Get().apiKey)
      var result = await map.Search({ searchText: this.location })

      map.CreateMap(this.mapElement.current, { zoom: 10, center: { lat: result.Latitude, lng: result.Longitude }})
    })
  }

  render() {
    return (
      <div ref={this.mapElement} style={{width: this.width, height:this.height}} />
    )
  }
}
