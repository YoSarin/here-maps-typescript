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
}

export class HereMaps {

  private static coreLink:string = "https://js.api.here.com/v3/3.1/mapsjs-core.js"
  private static serviceLink:string = "https://js.api.here.com/v3/3.1/mapsjs-service.js"
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
        service.onload = function () {
          HereMaps.TriggerReady()
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

  public DrawMapInto(element:HTMLElement, options:MapOptions =  { zoom: 10, center: { lat: 52.5, lng: 12.0} }):Map {
    var defaultLayers = this.platform.createDefaultLayers();
    return <Map>new H.Map(
      element,
      defaultLayers.vector.normal.map,
      options
    )
  }
}