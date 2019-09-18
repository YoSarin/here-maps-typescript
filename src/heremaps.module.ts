declare var H:any

enum HereStatus {
  Off,
  Loading,
  Ready
}

export class HereMaps {

  private static coreLink:string = "https://js.api.here.com/v3/3.1/mapsjs-core.js"
  private static serviceLink:string = "https://js.api.here.com/v3/3.1/mapsjs-service.js"
  private static status:HereStatus = HereStatus.Off;
  private static callbacks:any[];

  private platform:any;

  constructor(apiKey:string) {
    this.platform = new H.service.Platform({
      'apikey': apiKey
    })
  }

  public static OnReady() {
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

  }

  private static createScriptElement(src:string, type:string="text/javascript", charset:string="utf-8"):HTMLScriptElement {
    var link = <HTMLScriptElement>(document.createElement("script"))
    link.setAttribute("src", src)
    link.setAttribute("type", type)
    link.setAttribute("charset", charset)
    return link
  }

  public DrawMapInto(element:HTMLElement):void {

    var defaultLayers = this.platform.createDefaultLayers();

    var map = new H.Map(
      element,
      defaultLayers.vector.normal.map,
      {
        zoom: 10,
        center: { lat: 52.5, lng: 13.4 }
      }
    )
  }
}