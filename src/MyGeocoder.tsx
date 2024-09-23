import { Box, Button, Stack, TextField } from "@mui/material";

import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useState,
} from "react";
import {
	Configuration,
	type Location,
	LocationsApi
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

/**
 * Call the PTV Geocoding & Places API to geocode a string. For this tutorial, only the first result is kept
 * @param search
 * @returns
 */
async function geocode(search: string) {
	const client = new LocationsApi(
		new Configuration({
			apiKey: import.meta.env.VITE_API_KEY,
		}),
	);
	try {
		const response = await client.searchLocationsByText({
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
	location: Location | null;
	setLocation: Dispatch<SetStateAction<Location | null>>;
}) {
	const [searchText, setSearchText] = useState("");

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const initialize = useCallback(async () => {
		{
			const initAddress = "Tour Eiffel";
			const result = await geocode(initAddress);
			props.setLocation(result.locations[0]);
			setSearchText(initAddress);
		}
	}, []);

	useEffect(() => {
		initialize();
	}, [initialize]);

	return (
		<Box sx={style}>
			<Stack direction="row" gap={1} sx={{ m: 1 }}>
				<TextField
					label="Search addresses by text"
					variant="outlined"
					fullWidth
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					onKeyDown={async (e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							const result = await geocode(searchText);
							props.setLocation(result.locations[0]);
						}
					}}
				/>
				<Button
					type="submit"
					variant="contained"
					onClick={async () => {
						const result = await geocode(searchText);
						props.setLocation(result.locations[0]);
					}}
				>
					Search
				</Button>
			</Stack>
		</Box>
	);
}
