
import { useEffect, useState } from "react";

const MAP_TILE_URL = "https://api.myptv.com/maps/v1/vector-tiles/{z}/{x}/{y}"
export const initialMapStyle: mapboxgl.Style = {
  version: 8,
  name: "initial",
  pitch: 0,
  sources: {
    ptv: {
      type: "vector",
      tiles: [MAP_TILE_URL],
      minzoom: 0,
      maxzoom: 17,
    },
  },
  layers: [],
  sprite: "https://vectormaps-resources.myptv.com/icons/latest/sprite",
  glyphs:
    "https://vectormaps-resources.myptv.com/fonts/latest/{fontstack}/{range}.pbf",
};

/**
 * Retrieve PTV Vectormap style dynamically
 * @returns 
 */
export const useMapStyle = () => {
  const [data, setData] = useState<mapboxgl.Style>(initialMapStyle);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://vectormaps-resources.myptv.com/styles/latest/standard.json"
        );
        const mapStyle = await response.json();
        mapStyle.sources.ptv.tiles = [MAP_TILE_URL];
        setData(mapStyle);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  return data;
};
