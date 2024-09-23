import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Stack, Typography } from "@mui/material";
import bbox from "@turf/bbox";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import booleanPointOnLine from "@turf/boolean-point-on-line";
import {
	featureCollection,
	lineString,
	point,
	points,
	polygon,
} from "@turf/helpers";
import "mapbox-gl/dist/mapbox-gl.css";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type Dispatch,
	type SetStateAction,
} from "react";
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Map, { Layer, Marker, Popup, Source, type MapRef } from "react-map-gl";
import type {
	CustomRoadAttributeScenario,
	RoadsToBeAttributed,
} from "./clients-data-api/typescript";
import type { Location } from "./clients-geocoding-api/typescript";
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
	zoom: 12,
};

/**
 * Decode the PTV points string to an array of Position
 * @param points PTV string returned server side
 * @returns Position[]
 */
function decodePoints(points: string): Position[] {
	const coordinatesString = points.split(",");
	const coordinates = coordinatesString.map((v) => JSON.parse(v) as number);
	const formattedCoordinates = new Array<Position>();
	while (coordinates.length > 0) {
		const lat = coordinates.shift();
		const lon = coordinates.shift();
		if (lat && lon) {
			formattedCoordinates.push([lon, lat]);
		}
	}
	return formattedCoordinates;
}

/**
 * Check wether if the given location is contained in the given roads
 * @param roads
 * @param location
 * @returns boolean
 */
function locationInRoads(
	roads: RoadsToBeAttributed,
	location: Location | null,
): boolean {
	if (location) {
		const p = point([
			location.roadAccessPosition?.longitude ||
				location.referencePosition.longitude,
			location.roadAccessPosition?.latitude ||
				location.referencePosition.latitude,
		]);
		const formattedCoordinates = decodePoints(roads.points);
		const firstCoordinate = formattedCoordinates[0];
		let isInRoads = false;
		if (formattedCoordinates.length === 1) {
			isInRoads =
				firstCoordinate[0].toFixed(6) ===
					p.geometry.coordinates[0].toFixed(6) &&
				firstCoordinate[1].toFixed(6) === p.geometry.coordinates[1].toFixed(6);
		} else if (formattedCoordinates.length === 2) {
			const lnstrg = lineString(formattedCoordinates);
			isInRoads = booleanPointOnLine(p, lnstrg);
		} else {
			const plg = polygon([[...formattedCoordinates, firstCoordinate]]);
			isInRoads = booleanPointInPolygon(p, plg);
		}
		return isInRoads;
	}
	return false;
}

/**
 *
 * @param id The Scenario id from the Custom Road Attributes scenario
 * @param roadsToBeAttributed PTV roads from Custom Road Attributes scenario
 * @returns a geographical shape formatted in GeoJSON feature collection
 */
function buildFeatureCollection(
	id: string | undefined,
	roadsToBeAttributed: RoadsToBeAttributed[],
) {
	return featureCollection(
		roadsToBeAttributed
			.filter((roads) => roads.points.split(",").length > 6)
			.map((roads) => {
				const formattedCoordinates = decodePoints(roads.points);
				const firstCoordinate = formattedCoordinates[0];
				return polygon([[...formattedCoordinates, firstCoordinate]], {
					description: roads.description,
				});
			}),
		{
			id: id,
		},
	);
}

/**
 * Map component displaying prohibited and restricted motorized access area. A waypoint with a popup is displayed when a location is picked.
 * @param props
 * @returns
 */
export function MyMap(props: {
	prohibited: CustomRoadAttributeScenario | null;
	restricted: CustomRoadAttributeScenario | null;
	location: Location | null;
	setLocation: Dispatch<SetStateAction<Location | null>>;
}) {
	const mapRef = useRef<MapRef>(null);
	const mapStyle = useMapStyle();
	const popupRef = useRef<mapboxgl.Popup | null>(null);

	const collectionRestricted = useMemo(
		() =>
			props.restricted
				? props.location
					? buildFeatureCollection(
							props.restricted.id,
							props.restricted.roadsToBeAttributed,
						)
					: buildFeatureCollection(props.restricted.id, [])
				: null,
		[props.restricted, props.location],
	);

	/**
	 * GeoJSON feature collection of all the prohibited motorized access. Computed each time the location change.
	 */
	const collectionProhibited = useMemo(
		() =>
			props.prohibited
				? props.location
					? buildFeatureCollection(
							props.prohibited.id,
							props.prohibited.roadsToBeAttributed,
						)
					: buildFeatureCollection(props.prohibited.id, [])
				: null,
		[props.prohibited, props.location],
	);

	/**
	 * GeoJSON feature collection of all the restricted motorized access. Computed each time the location change.
	 */
	const description = useMemo(
		() =>
			props.prohibited?.roadsToBeAttributed
				.concat(props.restricted?.roadsToBeAttributed || [])
				.filter((f) => locationInRoads(f, props.location))
				.map((f) => f.description),
		[props.location, props.prohibited, props.restricted],
	);

	/**
	 * Center the map each time a new location is detected
	 */
	useEffect(() => {
		if (props.location) {
			const [minLng, minLat, maxLng, maxLat] = bbox(
				points([
					[
						props.location.referencePosition.longitude,
						props.location.referencePosition.latitude,
					],
				]),
			);

			mapRef.current?.fitBounds(
				[
					[minLng, minLat],
					[maxLng, maxLat],
				],
				{ maxZoom: 13, duration: 1000 },
			);
		}
	}, [props.location]);

	/**
	 * Adapt header request depending on the API used (tiling API is different)
	 */
	const getTransformRequest = useCallback((url: string) => {
		if (import.meta.env.VITE_API_KEY) {
			return { url: `${url}?apiKey=${import.meta.env.VITE_API_KEY}` };
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
				onClick={(e) => {
					props.setLocation({
						address: {},
						locationType: "EXACT_ADDRESS",
						quality: {},
						referencePosition: {
							latitude: e.lngLat.lat,
							longitude: e.lngLat.lng,
						},
					});
				}}
			>
				{collectionRestricted && (
					<Source type="geojson" data={collectionRestricted}>
						<Layer
							type="fill"
							paint={{
								"fill-color": "#1976d2",
								"fill-opacity": 0.3,
								"fill-outline-color": "#1976d2",
							}}
						/>
					</Source>
				)}
				{collectionProhibited && (
					<Source type="geojson" data={collectionProhibited}>
						<Layer
							type="fill"
							paint={{
								"fill-color": "#d32f2f",
								"fill-opacity": 0.3,
								"fill-outline-color": "#d32f2f",
							}}
						/>
					</Source>
				)}
				{props.location && (
					<>
						<Marker
							latitude={
								props.location.roadAccessPosition?.latitude ||
								props.location.referencePosition.latitude
							}
							longitude={
								props.location.roadAccessPosition?.longitude ||
								props.location.referencePosition.longitude
							}
						/>
						{description?.length && description.length > 0 && (
							<Popup
								ref={popupRef}
								longitude={
									props.location.roadAccessPosition?.longitude ||
									props.location.referencePosition.longitude
								}
								latitude={
									props.location.roadAccessPosition?.latitude ||
									props.location.referencePosition.latitude
								}
								anchor="top"
								closeButton={false}
								closeOnClick={false}
								closeOnMove={false}
							>
								<>
									{props.restricted === null && props.prohibited === null ? (
										<ProhibitedMotorizedAccessPopup />
									) : props.prohibited?.roadsToBeAttributed.reduce(
											(prev, curr) =>
												locationInRoads(curr, props.location) ? true : prev,
											false,
										) ? (
										<ProhibitedMotorizedAccessPopup />
									) : props.restricted?.roadsToBeAttributed.reduce(
											(prev, curr) =>
												locationInRoads(curr, props.location) ? true : prev,
											false,
										) ? (
										<RestrictedMotorizedAccessPopup />
									) : (
										<NoRestrictionsPopup />
									)}
									<code>{JSON.stringify(description, null, 2)}</code>
								</>
							</Popup>
						)}
					</>
				)}
			</Map>
		</Box>
	);
}

function ProhibitedMotorizedAccessPopup() {
	return (
		<Stack direction="row" spacing={1}>
			<CheckCircleIcon color="error" />
			<Typography>Prohibited motorized access</Typography>
		</Stack>
	);
}

function RestrictedMotorizedAccessPopup() {
	return (
		<Stack direction="row" spacing={1}>
			<CheckCircleIcon color="primary" />
			<Typography>Restricted motorized access</Typography>
		</Stack>
	);
}

function NoRestrictionsPopup() {
	return (
		<Stack direction="row" spacing={1}>
			<CheckCircleIcon color="success" />
			<Typography>No restrictions</Typography>
		</Stack>
	);
}
