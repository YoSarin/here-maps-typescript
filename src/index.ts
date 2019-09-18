import { HereMaps } from './heremaps.module'

HereMaps.onload = function() {
  var apiKey = "ejTEZJO50XcYpGX-FudQXN6PE6X9BiMdTu8eRGiMj_s";
  var map = new HereMaps(apiKey);
  map.DrawMapInto(document.getElementById("mapContainer"))
}