import { Source, SourceScript, SourceLink, SourceCollection } from "./external.module"

declare var H:any

enum HereStatus {
  Off,
  Loading,
  Ready
}

export interface ViewModel {
  setLookAtData(options:MapOptions):void
}

export interface MapInterface {
  addObjects(objects:any[]):void
  getViewModel():ViewModel
}

export interface MapOptions {
  zoom?:number
  center?:{lat:number, lng:number}
  bounds?:any
}

export class Position {
  public Latitude:number
  public Longitude:number

  public constructor(coords:{Latitude:number, Longitude:number}) {
    this.Latitude = coords.Latitude
    this.Longitude = coords.Longitude
  }

  public AsGeo():string {
    return `geo!${this.Latitude},${this.Longitude}`
  }
}

export interface RouteOptions {
  mode:string
  representation:string
  waypoint0:string
  waypoint1:string
}

export interface SearchParams {
  searchText:string
}

export interface HereMapsConfig {
  apiKey:string
}

export class HereMaps {

  private static coreLink:Source = new SourceScript("https://js.api.here.com/v3/3.1/mapsjs-core.js")
  private static serviceLink:Source = new SourceScript("https://js.api.here.com/v3/3.1/mapsjs-service.js").dependsOn(HereMaps.coreLink)
  private static eventsLink:Source = new SourceScript("https://js.api.here.com/v3/3.1/mapsjs-mapevents.js").dependsOn(HereMaps.coreLink)
  private static uiLink:Source = new SourceScript("https://js.api.here.com/v3/3.1/mapsjs-ui.js").dependsOn(HereMaps.coreLink)
  private static uiCssLink:Source = new SourceLink("https://js.api.here.com/v3/3.1/mapsjs-ui.css").dependsOn(HereMaps.uiLink)

  private static externalSources:SourceCollection = new SourceCollection(
    HereMaps.coreLink, HereMaps.serviceLink, HereMaps.eventsLink, HereMaps.uiLink, HereMaps.uiCssLink
  )

  private static status:HereStatus = HereStatus.Off;
  private static callbacks:(() => void)[] = [];

  private platform:any;

  constructor(apiKey:string) {
    this.platform = new H.service.Platform({
      'apikey': apiKey
    })
  }

  public static OnReady(callback:() => void) {
    if (HereMaps.status == HereStatus.Ready) {
      callback();
      return
    }
    HereMaps.callbacks.push(callback)
    HereMaps.Init();
  }

  private static Init() {
    if (HereMaps.status == HereStatus.Off) {
      console.log("HereMaps Init")
      HereMaps.status = HereStatus.Loading
      var head = <HTMLElement>document.getElementsByTagName("head")[0]
      HereMaps.externalSources.attach(head).then(() => HereMaps.TriggerReady())
    }
  }

  private static TriggerReady() {
    console.log("HereMaps ready")
    HereMaps.status = HereStatus.Ready;
    for (var callback = HereMaps.callbacks.shift(); callback; callback = HereMaps.callbacks.shift()) {
      callback();
    }
  }

  public CreateMap(element:HTMLElement, options:MapOptions =  { zoom: 10, center: { lat: 52.5, lng: 12.0} }):MapInterface {
    var defaultLayers = this.platform.createDefaultLayers();
    var map = <MapInterface>new H.Map(
      element,
      defaultLayers.vector.normal.map,
      options
    )

    console.log(map)

    H.ui.UI.createDefault(map, defaultLayers)
    var events = new H.mapevents.MapEvents(map)
    new H.mapevents.Behavior(events)

    return map
  }

  public async Search(params:SearchParams):Promise<Position> {
    return new Promise<Position>(
      (resolve, reject) => {
        if (params.searchText.IsCoords()) {
          var splitted = params.searchText.split(',');
          resolve(new Position({Latitude: parseFloat(splitted[0].trim()), Longitude: parseFloat(splitted[1].trim())}));
          return
        }
        var geocoder = this.platform.getGeocodingService()
        geocoder.geocode(
          params,
          (response:any) => {
            var result = new Position(response.Response.View[0].Result[0].Location.DisplayPosition)
            resolve(result)
          },
          (error:any) => {
            reject(error)
          }
        )
      }
    )
  }

  public async ShowRoute(element:HTMLElement, options:RouteOptions):Promise<void> {
    var map = this.CreateMap(element)
    return new Promise(
      (resolve, reject) => {
        this.platform.getRoutingService().calculateRoute(
          options,
          (result:any) => {
            this.drawRouteToMap(result, map)
            resolve()
          },
          (error:any) => reject(error))
      }
    )
  }

  private drawRouteToMap(result:any, map:MapInterface):void {
    var route, routeShape, linestring:any;
    if(result.response.route) {
      // Pick the first route from the response:
      route = result.response.route[0];
      // Pick the route's shape:
      routeShape = route.shape;

      // Create a linestring to use as a point source for the route line
      linestring = new H.geo.LineString();

      // Push all the points in the shape into the linestring:
      routeShape.forEach(function(point:string) {
        var parts = point.split(',');
        linestring.pushLatLngAlt(parts[0], parts[1]);
      });

      // Create a polyline to display the route:
      var routeLine = new H.map.Polyline(linestring, {
        style: { strokeColor: 'blue', lineWidth: 3 }
      });

      // Add the route polyline and the two markers to the map:
      map.addObjects([routeLine]);

      // Set the map's viewport to make the whole route visible:
      map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
    }
  }
}

declare global {
  /** Converts numeric degrees to radians */
  interface String {
      IsCoords():boolean;
  }
}

String.prototype.IsCoords = function():boolean {
  return /^(\d+((\.|,)\d+)?\s*,\s*\d+((\.|,)\d+)?)$/.test(this)
}
