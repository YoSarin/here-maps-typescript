import * as React from "react"
import { MapConfig } from "./mapconfig"
import { HereMaps } from "../libs/heremaps.module"

export interface RouteProperties {
  width?:string
  height?:string

  from:string
  to:string
}

export class Route extends React.Component<RouteProperties> {

    private from:string
    private to:string
    private width:string
    private height:string

    private mapElement:React.RefObject<HTMLDivElement>

    constructor(properties:RouteProperties) {
      if (MapConfig.Get() == null) {
        throw "Map needs to be configured before creation, use Map.Init() before using and instantiationg Map element"
      }
      super(properties)
      this.from = properties.from
      this.to = properties.to
      this.width = properties.width ? properties.width : "480px"
      this.height = properties.height ? properties.height : "200px"
      this.mapElement = React.createRef()

      HereMaps.OnReady(async () => {
        
        var map = new HereMaps(MapConfig.Get().apiKey)
        var from = await map.Search({ searchText: this.from })
        var to = await map.Search({ searchText: this.to })

        console.log("route from", from, " to ", to)

        map.ShowRoute(this.mapElement.current, {
          waypoint0: from.AsGeo(),
          waypoint1: to.AsGeo(),
          mode: "fastest;car",
          representation: "display"
        });
      })
    }

    render() {
      return (
        <div ref={this.mapElement} style={{width: this.width, height:this.height}} />
      )
    }
  }
