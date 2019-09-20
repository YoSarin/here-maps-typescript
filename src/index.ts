import { HereMaps } from './heremaps.module'

HereMaps.OnReady(async () => {
  var apiKey = "ejTEZJO50XcYpGX-FudQXN6PE6X9BiMdTu8eRGiMj_s";
  var Maps = new HereMaps(apiKey);
  Maps.CreateMap(document.getElementById("mapContainer"), { zoom: 10, center: { lat: 51.0, lng: 12.0 }})

  var place1 = await Maps.Search({searchText: "Rudoltice 50, 788 16 Sobotín, Czech Republic"})
  var place2 = await Maps.Search({searchText: "49.98847,17.44278"})

  console.log(place1)
  console.log(place2)

  Maps.ShowRoute(document.getElementById("routeContainer"), {
    waypoint0: place1.AsGeo(),
    waypoint1: place2.AsGeo(),
    mode: "fastest;car",
    representation: "display"
  });
})