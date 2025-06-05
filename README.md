# Getting started

Use the [vitejs](https://vitejs.dev/guide/) template with React and Typescript preset.

```
npm create vite@latest
create-vite@5.2.3
Ok to proceed? (y) y
√ Project name: ... geocoding-scenario
√ Select a framework: » React
√ Select a variant: » TypeScript
cd geocoding-scenario
npm install
npm run dev
```

Install the mapbox-gl and react-map-gl to display a map. Use the 1.13.0 version to avoid the api key usage.

```
npm install mapbox-gl@1.13.0
npm install react-map-gl
```

Use the [material-ui](https://mui.com/material-ui/)

```
npm install @mui/material @emotion/react @emotion/styled
```

Add a `.env` at root with your PTV API Key.

```
VITE_API_KEY=<your_api_key>
```

# Basic map

Create a `MyMap` component to display a basic map with PTV tiles

```tsx
import { Box } from "@mui/material";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback } from "react";
import Map from "react-map-gl";
import { useMapStyle } from "./hooks/useMapStyle";

const boxStyle = {
  gridArea: "map",
  height: "100%",
  width: "100%",
  zIndex: 0,
};

const mapBoxStyle = {
  height: "100%",
  width: "100%",
};

const initialViewState = {
  longitude: -122.4,
  latitude: 37.8,
  zoom: 14,
};

export function MyMap() {
  const mapStyle = useMapStyle();

  const getTransformRequest = useCallback((url: string) => {
    if (import.meta.env.VITE_API_KEY) {
      return { url: url + "?apiKey=" + import.meta.env.VITE_API_KEY };
    }
    return { url: url, headers: {} };
  }, []);

  return (
    <Box sx={boxStyle}>
      <Map
        initialViewState={initialViewState}
        style={mapBoxStyle}
        mapStyle={mapStyle}
        transformRequest={getTransformRequest}
      />
    </Box>
  );
}
```

Create a custom hook to handle the map style in `src/hooks/useMapStyle.ts`

```tsx
import { useEffect, useState } from "react";

export const initialMapStyle: mapboxgl.Style = {
  version: 8,
  name: "initial",
  pitch: 0,
  sources: {
    ptv: {
      type: "vector",
      tiles: ["https://api.myptv.com/maps-osm/v1/vector-tiles/{z}/{x}/{y}"],
      minzoom: 0,
      maxzoom: 17,
    },
  },
  layers: [],
  sprite: "https://vectormaps-resources.myptv.com/icons/latest/sprite",
  glyphs:
    "https://vectormaps-resources.myptv.com/fonts/latest/{fontstack}/{range}.pbf",
};

export const useMapStyle = () => {
  const [data, setData] = useState<mapboxgl.Style>(initialMapStyle);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://vectormaps-resources.myptv.com/styles/latest/standard.json"
        );
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  return data;
};
```

# Geocoding

To geocode addresses, use the [clients-geocoding-api](https://github.com/ptv-logistics/clients-geocoding-api)

```
 git clone https://github.com/ptv-logistics/clients-geocoding-api
```

And use it in a component like `MyGeocoder`

```tsx
import { Box, Button, Stack, TextField } from "@mui/material";
import { Dispatch, SetStateAction, useState } from "react";
import {
  Configuration,
  PlacesApi,
  PlacesSearchResult,
} from "./clients-geocoding-api/typescript";

const style = {
  bgcolor: "background.paper",
  boxShadow: 2,
  borderRadius: 2,
  p: 1,
  position: "absolute",
  top: "12px",
  left: "12px",
};

async function geocode(search: string) {
  const client = new PlacesApi(
    new Configuration({
      apiKey: import.meta.env.VITE_API_KEY,
    })
  );
  try {
    const response = await client.searchPlacesByText({
      searchText: search,
      language: "en",
    });
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export function MyGeocoder(props: {
  response: PlacesSearchResult | null;
  setResponse: Dispatch<SetStateAction<PlacesSearchResult | null>>;
}) {
  const [searchText, setSearchText] = useState("");

  return (
    <Box sx={style}>
      <Stack direction="row" gap={1} sx={{ m: 1 }}>
        <TextField
          label="Search places by text"
          variant="outlined"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const result = await geocode(searchText);
              props.setResponse(result);
            }
          }}
        />
        <Button
          type="submit"
          variant="contained"
          onClick={async () => {
            const result = await geocode(searchText);
            props.setResponse(result);
          }}
        >
          Search
        </Button>
      </Stack>
    </Box>
  );
}
```

Add `MyGeocoder` in parent component

```tsx
import { useState } from "react";
import { MyGeocoder } from "./MyGeocoder";
import { MyMap } from "./MyMap";
import { PlacesSearchResult } from "./clients-geocoding-api/typescript";

function App() {
  const [response, setResponse] = useState<PlacesSearchResult | null>(null);
  return (
    <>
      <MyMap />
      <MyGeocoder response={response} setResponse={setResponse} />
    </>
  );
}

export default App;
```

# Custom Road Attributes

Use The custom road attributes client to retrieve your scenario inside a custom hook.

```tsx
import { useEffect, useState } from "react";
import {
  Configuration,
  CustomRoadAttributeScenario,
  CustomRoadAttributesApi,
} from "../clients-data-api/typescript";

const client = new CustomRoadAttributesApi(
  new Configuration({
    apiKey: import.meta.env.VITE_API_KEY,
  })
);

const useScenario = (id: string) => {
  const [scenario, setScenario] = useState<CustomRoadAttributeScenario | null>(
    null
  );

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const response = await client.getCustomRoadAttributeScenario({
          scenarioId: id,
        });
        setScenario(response);
      } catch (error) {
        console.log(error);
      }
    };

    fetchScenario();
  }, [id]);

  return scenario;
};

export default useScenario;
```

Use this custom hook in `App`

```tsx
import { useState } from "react";
import { MyGeocoder } from "./MyGeocoder";
import { MyMap } from "./MyMap";
import { PlacesSearchResult } from "./clients-geocoding-api/typescript";
import useScenario from "./hooks/useScenario";

function App() {
  const scenario = useScenario("aecfe795-ba61-4c19-8c3d-e97972f11f13");
  const [response, setResponse] = useState<PlacesSearchResult | null>(null);
  return (
    <>
      {scenario && <MyMap scenario={scenario} />}
      <MyGeocoder response={response} setResponse={setResponse} />
    </>
  );
}

export default App;
```

Modify `MyMap` to display scenario polylines. Install `"@mapbox/polyline"` to convert google encoded polyline to geojson and `@turf/helpers` to build geojson from string.

```
npm install @mapbox/polyline
npm install @turf/helpers
```

```tsx
import polylineDecoder from "@mapbox/polyline";
import { Box } from "@mui/material";
import { featureCollection, geometry, geometryCollection } from "@turf/helpers";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useMemo } from "react";
import Map, { Layer, Source } from "react-map-gl";
import { CustomRoadAttributeScenario } from "./clients-data-api/typescript";
import { useMapStyle } from "./hooks/useMapStyle";

const boxStyle = {
  gridArea: "map",
  height: "100%",
  width: "100%",
  zIndex: 0,
};

const mapBoxStyle = {
  height: "100%",
  width: "100%",
};

const initialViewState = {
  longitude: 2.3333,
  latitude: 48.86666,
  zoom: 14,
};

function buildFeatureCollection(scenario: CustomRoadAttributeScenario) {
  return featureCollection(
    scenario.roadsToBeAttributed.map((roads) =>
      geometryCollection(
        roads.polylines!.map((p) =>
          geometry(
            "LineString",
            polylineDecoder.decode(p).map((coords) => [coords[1], coords[0]])
          )
        ),
        {
          ...roads.attributes,
        }
      )
    ),
    {
      id: scenario.id,
    }
  );
}

export function MyMap(props: { scenario: CustomRoadAttributeScenario | null }) {
  const mapStyle = useMapStyle();

  const collection = useMemo(
    () => (props.scenario ? buildFeatureCollection(props.scenario) : null),
    [props.scenario]
  );
  const getTransformRequest = useCallback((url: string) => {
    if (import.meta.env.VITE_API_KEY) {
      return { url: url + "?apiKey=" + import.meta.env.VITE_API_KEY };
    }
    return { url: url, headers: {} };
  }, []);

  return (
    <Box sx={boxStyle}>
      <Map
        initialViewState={initialViewState}
        style={mapBoxStyle}
        mapStyle={mapStyle}
        transformRequest={getTransformRequest}
      >
        {collection && (
          <Source type="geojson" data={collection}>
            <Layer
              type="line"
              paint={{ "line-color": "#3f50b5", "line-width": 3 }}
            />
          </Source>
        )}
      </Map>
    </Box>
  );
}
```

To dermine wether a geocoded address is included in one of the roads contained in the scenario, use `booleanPointInPolygon` and `booleanPointOnLine` from `@turf`

```
npm install @turf/boolean-point-in-polygon
npm install @turf/boolean-point-on-line
```

```ts
function placeInRoads(roads: RoadsToBeAttributed, place: Place) {
  const p = point([
    place.roadAccessPosition?.longitude || place.referencePosition.longitude,
    place.roadAccessPosition?.latitude || place.referencePosition.latitude,
  ]);

  const coordinatesString = roads.points.split(",");
  const coordinates = coordinatesString.map((v) => JSON.parse(v) as number);
  const formattedCoordinates = new Array<Position>();
  while (coordinates.length > 1) {
    const lat = coordinates.shift();
    const lon = coordinates.shift();
    if (lat && lon) {
      formattedCoordinates.push([lon, lat]);
    }
  }
  const firstCoordinate = formattedCoordinates[0];
  if (formattedCoordinates.length < 2)
    return (
      firstCoordinate[0].toFixed(3) === p.geometry.coordinates[0].toFixed(3) &&
      firstCoordinate[1].toFixed(3) === p.geometry.coordinates[1].toFixed(3)
    );
  else if (formattedCoordinates.length > 2) {
    const plg = polygon([[...formattedCoordinates, firstCoordinate]]);
    return booleanPointInPolygon(p, plg);
  } else {
    const lnstrg = lineString(formattedCoordinates);
    return booleanPointOnLine(p, lnstrg);
  }
}
```

Finally, Display geocoded places in green if there are included in one of scenario's geometries, red otherwise.

```tsx
import polylineDecoder from "@mapbox/polyline";
import { Box } from "@mui/material";
import bbox from "@turf/bbox";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanPointOnLine from "@turf/boolean-point-on-line";
import {
  featureCollection,
  geometry,
  geometryCollection,
  lineString,
  point,
  points,
  polygon,
} from "@turf/helpers";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useMemo, useRef } from "react";
import Map, { Layer, MapRef, Marker, Source } from "react-map-gl";
import {
  CustomRoadAttributeScenario,
  RoadsToBeAttributed,
} from "./clients-data-api/typescript";
import { Place } from "./clients-geocoding-api/typescript";
import { useMapStyle } from "./hooks/useMapStyle";

type Position = number[];

const boxStyle = {
  gridArea: "map",
  height: "100%",
  width: "100%",
  zIndex: 0,
};

const mapBoxStyle = {
  height: "100%",
  width: "100%",
};

const initialViewState = {
  longitude: 2.3333,
  latitude: 48.86666,
  zoom: 14,
};

function placeInRoads(roads: RoadsToBeAttributed, place: Place) {
  const p = point([
    place.roadAccessPosition?.longitude || place.referencePosition.longitude,
    place.roadAccessPosition?.latitude || place.referencePosition.latitude,
  ]);

  const coordinatesString = roads.points.split(",");
  const coordinates = coordinatesString.map((v) => JSON.parse(v) as number);
  const formattedCoordinates = new Array<Position>();
  while (coordinates.length > 1) {
    const lat = coordinates.shift();
    const lon = coordinates.shift();
    if (lat && lon) {
      formattedCoordinates.push([lon, lat]);
    }
  }
  const firstCoordinate = formattedCoordinates[0];
  if (formattedCoordinates.length < 2)
    return (
      firstCoordinate[0].toFixed(3) === p.geometry.coordinates[0].toFixed(3) &&
      firstCoordinate[1].toFixed(3) === p.geometry.coordinates[1].toFixed(3)
    );
  else if (formattedCoordinates.length > 2) {
    const plg = polygon([[...formattedCoordinates, firstCoordinate]]);
    return booleanPointInPolygon(p, plg);
  } else {
    const lnstrg = lineString(formattedCoordinates);
    return booleanPointOnLine(p, lnstrg);
  }
}

function buildFeatureCollection(scenario: CustomRoadAttributeScenario) {
  return featureCollection(
    scenario.roadsToBeAttributed.map((roads) =>
      geometryCollection(
        roads.polylines!.map((p) =>
          geometry(
            "LineString",
            polylineDecoder.decode(p).map((coords) => [coords[1], coords[0]])
          )
        ),
        {
          ...roads.attributes,
        }
      )
    ),
    {
      id: scenario.id,
    }
  );
}

export function MyMap(props: {
  scenario: CustomRoadAttributeScenario | null;
  places: Place[];
}) {
  const mapRef = useRef<MapRef>(null);
  const mapStyle = useMapStyle();

  const collection = useMemo(
    () => (props.scenario ? buildFeatureCollection(props.scenario) : null),
    [props.scenario]
  );

  const waypoints = useMemo(
    () =>
      props.places.map((p, i) => (
        <Marker
          key={i}
          latitude={
            p.roadAccessPosition?.latitude || p.referencePosition.latitude
          }
          longitude={
            p.roadAccessPosition?.longitude || p.referencePosition.longitude
          }
          color={
            props.scenario?.roadsToBeAttributed.reduce(
              (prev, curr) => (placeInRoads(curr, p) ? true : prev),
              false
            )
              ? "green"
              : "red"
          }
        />
      )),
    [props.places, props.scenario]
  );

  useEffect(() => {
    if (props.places.length > 0) {
      const [minLng, minLat, maxLng, maxLat] = bbox(
        points(
          props.places.map((p) => [
            p.referencePosition.longitude,
            p.referencePosition.latitude,
          ])
        )
      );

      mapRef.current?.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 40, duration: 1000 }
      );
    }
  });

  const getTransformRequest = useCallback((url: string) => {
    if (import.meta.env.VITE_API_KEY) {
      return { url: url + "?apiKey=" + import.meta.env.VITE_API_KEY };
    }
    return { url: url, headers: {} };
  }, []);

  return (
    <Box sx={boxStyle}>
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        style={mapBoxStyle}
        mapStyle={mapStyle}
        transformRequest={getTransformRequest}
      >
        {collection && (
          <Source type="geojson" data={collection}>
            <Layer
              type="line"
              paint={{ "line-color": "#3f50b5", "line-width": 3 }}
            />
          </Source>
        )}
        {waypoints}
      </Map>
    </Box>
  );
}
```
