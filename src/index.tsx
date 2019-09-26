import { HereMaps } from './libs/heremaps.module'
import { Map } from "./components/map"
import { Route } from "./components/route"
import { MapConfig } from "./components/mapconfig"
import * as React from 'react'
import * as ReactDOM from 'react-dom'

MapConfig.Init({apiKey:"ejTEZJO50XcYpGX-FudQXN6PE6X9BiMdTu8eRGiMj_s"})

HereMaps.OnReady(() => {
  var root = document.getElementById("root")
  console.log("root:", root)
  ReactDOM.render(
    [
      <Map location="Prague" width="800px" height="400px" />,
      <Map location="Brno" width="800px" height="400px" />,
      <Route from="Prague" to="Brno" width="800px" height="400px" />,
      <Route from="Rudoltice 50, 788 16 Sobotín, Czech Republic" to="49.98847,17.44278" width="800px" height="400px" />
    ],
    root
  );
})
