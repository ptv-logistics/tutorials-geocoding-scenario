import { useState } from "react";
import { Helper } from "./Helper";
import { MyGeocoder } from "./MyGeocoder";
import { MyMap } from "./MyMap";
import type { Location } from "./clients-geocoding-api/typescript";
import useScenario from "./hooks/useScenario";
import { getScenarioIds } from "./utils";

const { prohibited, restricted } = getScenarioIds();

function App() {
	const scenarioProhibited = useScenario(prohibited);
	const scenarioRestricted = useScenario(restricted);
	const [location, setLocation] = useState<Location | null>(null);
	return (
		<>
			<MyMap
				prohibited={scenarioProhibited}
				restricted={scenarioRestricted}
				location={location || null}
				setLocation={setLocation}
			/>
			<MyGeocoder location={location} setLocation={setLocation} />
			<Helper />
		</>
	);
}

export default App;
