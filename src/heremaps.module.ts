declare var H:any

enum HereStatus {
  Off,
  Loading,
  Ready
}

export interface ViewModel {
  setLookAtData(options:MapOptions):void
}

export interface Map {
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

export class HereMaps {

  private static coreLink:string = "https://js.api.here.com/v3/3.1/mapsjs-core.js"
  private static serviceLink:string = "https://js.api.here.com/v3/3.1/mapsjs-service.js"
  private static eventsLink:string = "https://js.api.here.com/v3/3.1/mapsjs-mapevents.js"
  private static uiLink:string = "https://js.api.here.com/v3/3.1/mapsjs-ui.js"
  private static uiCssLink:string = "https://js.api.here.com/v3/3.1/mapsjs-ui.css"

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
    }
    HereMaps.callbacks.push(callback)
    HereMaps.Init();
  }

  private static Init() {
    if (HereMaps.status == HereStatus.Off) {
      HereMaps.status = HereStatus.Loading
      var head = <HTMLElement>document.getElementsByTagName("head")[0]
      var core = HereMaps.createScriptElement(HereMaps.coreLink)
      core.onload = function() {
        var service = HereMaps.createScriptElement(HereMaps.serviceLink)
        service.onload = function() {
          var events = HereMaps.createScriptElement(HereMaps.eventsLink)
          events.onload = function() {
            var ui = HereMaps.createScriptElement(HereMaps.uiLink)
            var uiCss = HereMaps.createLinkElement(HereMaps.uiCssLink)
            ui.onload = function () {
              HereMaps.TriggerReady()
            }
            head.appendChild(ui);
            head.appendChild(uiCss)
          }
          head.appendChild(events)
        }
        head.appendChild(service)
      }
      head.appendChild(core);
    }
  }

  private static TriggerReady() {
    HereMaps.status = HereStatus.Ready;
    for (var callback = HereMaps.callbacks.pop(); callback; callback = HereMaps.callbacks.pop()) {
      callback();
    }
  }

  private static createScriptElement(src:string, type:string="text/javascript", charset:string="utf-8"):HTMLScriptElement {
    var link = <HTMLScriptElement>(document.createElement("script"))
    link.setAttribute("src", src)
    link.setAttribute("type", type)
    link.setAttribute("charset", charset)
    return link
  }

  private static createLinkElement(src:string, type:string="text/css", rel:string="stylesheet"):HTMLLinkElement {
    var link = <HTMLLinkElement>(document.createElement("link"))
    link.setAttribute("href", src)
    link.setAttribute("type", type)
    link.setAttribute("rel", rel)
    return link
  }

  public CreateMap(element:HTMLElement, options:MapOptions =  { zoom: 10, center: { lat: 52.5, lng: 12.0} }):Map {
    var defaultLayers = this.platform.createDefaultLayers();
    var map = <Map>new H.Map(
      element,
      defaultLayers.vector.normal.map,
      options
    )

    console.log(map)

    var ui = H.ui.UI.createDefault(map, defaultLayers)
    var events = new H.mapevents.MapEvents(map)
    var behavior = new H.mapevents.Behavior(events)

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

  private drawRouteToMap(result:any, map:Map):void {
    var route, routeShape, startPoint, endPoint, linestring:any;
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

      // Retrieve the mapped positions of the requested waypoints:
      startPoint = route.waypoint[0].mappedPosition;
      endPoint = route.waypoint[1].mappedPosition;

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