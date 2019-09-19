import { HereMaps } from './heremaps.module'

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

HereMaps.OnReady(async () => {
  var apiKey = "ejTEZJO50XcYpGX-FudQXN6PE6X9BiMdTu8eRGiMj_s";
  var Maps = new HereMaps(apiKey);
  var map = Maps.DrawMapInto(document.getElementById("mapContainer"))
  await delay(3000)
  map.getViewModel().setLookAtData({ zoom: 9, center: { lat: 51.0, lng: 12.0 }});
})