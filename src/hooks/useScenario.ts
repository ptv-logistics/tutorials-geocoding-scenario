
import { useEffect, useState } from "react";
import {
  Configuration,
  type CustomRoadAttributeScenario,
  CustomRoadAttributesApi
} from "../clients-data-api/typescript";

const client = new CustomRoadAttributesApi(
  new Configuration({
    apiKey: import.meta.env.VITE_API_KEY
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
          polylineFormat: "GOOGLE_ENCODED_POLYLINE",
          results: ["POLYLINES"],
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
