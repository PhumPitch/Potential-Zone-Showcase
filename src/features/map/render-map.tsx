"use client";
import * as maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";

import { useEffect, useRef, useState } from "react";
import { queryLayerByGroup } from "@/utils/utils";
import type { CSSProperties } from "react";

const groupName: Record<string, string> = {
	general: "Basemap",
	population: "population",
	facilities: "h3_facilities",
	energy_drink: "h3_ener_score",
	energy_drink_penalty: "h3_ener_penalty",
	average_score : "average_score",

}

const tabs = [
	{ name: "General", value: "general", content: "General map view." },
	{ name: "Population-Weighted", value: "population", content: "H3 Score Based On Population-Weighted" },
	{ name: "Facilities-Weighted", value: "facilities", content: "Score Based On Facilities" },
	{ name: "Average Score", value: "average_score", content: "Score Based On An Average of Population Score and Facilities Score" },
	{ name: "Energy Drink", value: "energy_drink", content: "Score Based on Energy Drink Factor" },
	{ name: "Energy Drink (Penalty)", value: "energy_drink_penalty", content: "Convenience Store, Mall and Market Penalty" },
];

type LegendItem = {
	label: string;
	colorClass?: string;
	color?: string;
	icon?: string;
	iconClass?: string;
};

type LegendConfig = {
	polygon: LegendItem[];
	point: LegendItem[];
};

const defaultLegend: LegendConfig = {
	polygon: [],
	point: [
		{ label: "Bus", color: "#2ba2ff" },
		{ label: "Train", color: "#07694a" },
		{ label: "Railway", color: "#000000" },
	],
};

const legendByTab: Record<string, LegendConfig> = {
	general: defaultLegend,
	population: {
		polygon: [
			{ label: "7.1 - 10.0", color: "#03071e" },
			{ label: "5.9 - 7.1", color: "#9d0208" },
			{ label: "4.7 - 5.9", color: "#d00000" },
			{ label: "3.5 - 4.7", color: "#dc2f02" },
			{ label: "2.4 - 3.5", color: "#e85d04" },
			{ label: "1.2 - 2.4", color: "#f48c06" },
			{ label: "0.0 - 1.2", color: "#ffba08" },
		],
		point: defaultLegend.point
	},
	facilities: {
		polygon: [
			{ label: "8.2 - 10.0", color: "#10451d" },
			{ label: "6.9 - 8.2", color: "#155d27" },
			{ label: "5.5 - 6.9", color: "#208b3a" },
			{ label: "4.1 - 5.5", color: "#25a244" },
			{ label: "2.7 - 4.1", color: "#2dc653" },
			{ label: "1.4 - 2.7", color: "#6ede8a" },
			{ label: "0.0 - 1.4", color: "#b7efc5" },
		],
		point: [
			{ label: "Bus", color: "#2ba2ff" },
			{ label: "Train", color: "#07694a" },
			{ label: "Railway", color: "#000000" },
			{ label: "Health", color: "#FF5555" },
			{ label: "Mall", color: "#FFEF62" },
			{ label: "Food", color: "#FB8500" },
		]
	},
	average_score: {
		polygon: [
			{ label: "8.60 - 10.0", color: "#005f73" },  
			{ label: "7.17 - 8.60", color: "#0a9396" }, 
			{ label: "5.73 - 7.17", color: "#94d2bd" }, 
			{ label: "4.30 - 5.73", color: "#e9d8a6" }, 
			{ label: "2.87 - 4.30", color: "#ee9b00" }, 
			{ label: "1.43 - 2.87", color: "#ca6702" }, 
			{ label: "0.00 - 1.43", color: "rgba(187, 62, 3, 1)" }, 
		],
		point: defaultLegend.point,
	},
	energy_drink: {
		polygon: [
			{ label: "8.00 - 10.00", color: "rgba(3, 4, 94, 1)" }, 
			{ label: "6.00 - 8.00", color: "rgba(0, 119, 182, 1)" }, 
			{ label: "4.00 - 6.00", color: "rgba(0, 180, 216, 1)" }, 
			{ label: "2.00 - 4.00", color: "rgba(144, 224, 239, 1)" }, 
			{ label: "0.00 - 2.00", color: "rgba(202, 240, 248, 1)" }, 
		],
		point: [
			{ label: "Bus", color: "#2ba2ff" },
			{ label: "Train", color: "#07694a" },
			{ label: "Railway", color: "#000000" },
			{ label: "Health", color: "#FF5555" },
			{ label: "Mall", color: "#FFEF62" },
			{ label: "Food", color: "#FB8500" },
			{ label: "Energy Drink POI", colorClass: "bg-cyan-500", icon: "🥤" },
		],
	},
	energy_drink_penalty: {
		polygon: [
			{ label: "8.00 - 10.00", color: "rgba(3, 4, 94, 1)" }, 
			{ label: "6.00 - 8.00", color: "rgba(0, 119, 182, 1)" }, 
			{ label: "4.00 - 6.00", color: "rgba(0, 180, 216, 1)" }, 
			{ label: "2.00 - 4.00", color: "rgba(144, 224, 239, 1)" }, 
			{ label: "0.00 - 2.00", color: "rgba(202, 240, 248, 1)" }, 
		],
		point: [
			{ label: "Bus", color: "#2ba2ff" },
			{ label: "Train", color: "#07694a" },
			{ label: "Railway", color: "#000000" },
			{ label: "Health", color: "#FF5555" },
			{ label: "Mall", color: "#FFEF62" },
			{ label: "Food", color: "#FB8500" },
			{ label: "Energy Drink POI", colorClass: "bg-cyan-500", icon: "🥤" },
		],
	},
};

const renderLegendMarker = (item: LegendItem, geometry: "polygon" | "point") => {
	if (item.icon) {
		return (
			<div className={item.iconClass ?? "text-base leading-none"}>
				{item.icon}
			</div>
		);
	}

	const style = item.color ? ({ backgroundColor: item.color } as CSSProperties) : undefined;
	const shapeClass = geometry === "polygon" ? "rounded-sm" : "rounded-full";

	return (
		<div
			className={`h-3 w-3 border border-black/10 ${shapeClass} ${item.colorClass ?? "bg-slate-400"}`}
			style={style}
		/>
	);
};

const RenderMap = () => {
	const [activeTab, setActiveTab] = useState("general");
	const activeTabRef = useRef(activeTab);
	const [map, setMap] = useState<maplibreGl.Map | null>(null);
	const activeLegend = legendByTab[activeTab] ?? defaultLegend;

	useEffect(() => {
		activeTabRef.current = activeTab;
	}, [activeTab]);

	const setVisibleGroup = (currentMap: maplibreGl.Map, tabValue: string) => {
		const uniqueGroups = Array.from(new Set(Object.values(groupName)));

		uniqueGroups.forEach((group) => {
			const layers = queryLayerByGroup(currentMap.getStyle(), group);
			layers.forEach((layer) => {
				currentMap.setLayoutProperty(layer.id, "visibility", "none");
			});
		});

		const selectedGroup = groupName[tabValue];
		if (!selectedGroup) return;

		const selectedLayers = queryLayerByGroup(currentMap.getStyle(), selectedGroup);
		selectedLayers.forEach((layer) => {
			currentMap.setLayoutProperty(layer.id, "visibility", "visible");
		});
	};

	const handleTabChange = (tabValue: string) => {
		if (map) {
			setVisibleGroup(map, tabValue);
		}

		// Update state
		setActiveTab(tabValue);
	};

	useEffect(() => {
		const map = new maplibreGl.Map({
			container: "map",
			style: `https://app.vallarismaps.com/core/api/styles/1.0-beta/styles/699d551d6cfd4083c2859059?api_key=${process.env.NEXT_PUBLIC_VALLARIS_KEY}`,
			// bounds: [
			// 	97.34360014387325, 5.612494232121946, 105.6370265099215,
			// 	20.465149308225705,
			// ],
			center: [100.4986531253638, 13.741646278147007],
			zoom: 11,// starting zoom
            attributionControl: false
		});

		setMap(map);

		map.once("idle", (e) => e.target.resize());
		// map.once("load", async (e) => {
		// 	setVisibleGroup(map, "general");

		// 	// Click show AQI properties
		// 	map.on('click', 'aqi_point', (e: any) => {
		// 		if (activeTabRef.current !== "population") {
		// 			return;
		// 		}

		// 		const props = e.features?.[0]?.properties || {};
		// 		const keys = ["date", "time", "aqiaqi"];
		// 		const rows = keys
		// 			.map(
		// 				(k) =>
		// 					`<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><strong style="margin-right:8px">${k}</strong><span>${props[k] ?? "—"}</span></div>`
		// 			)
		// 			.join("");
		// 		new maplibreGl.Popup()
		// 			.setLngLat(e.lngLat)
		// 			.setHTML(`<div style="min-width:160px;font-size:13px">${rows}</div>`)
		// 			.addTo(map);
		// 	});
		// });

		map?.on('load', () => {
			setVisibleGroup(map, activeTabRef.current);

            map.on('click', 'h3_pop_weight', (e: any) => {
                new maplibreGl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="min-width:16px;font-size:13px">
						<b> H3 Index: </b> ${e.features[0].properties.h3_index}<br>
						<b> H3 score: </b> ${e.features[0].properties.pop_weight}
						</div>`)
                    .addTo(map);			
            });

			map.on('click', 'h3_faci', (e: any) => {
                new maplibreGl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="min-width:16px;font-size:13px">
						<b> H3 Index: </b> ${e.features[0].properties.h3_index}<br>
						<b> H3 score: </b> ${e.features[0].properties.facilities_weight}
						</div>`)
                    .addTo(map);
            });

			map.on('click', 'average_score', (e: any) => {
                new maplibreGl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="min-width:16px;font-size:13px">
						<b> H3 Index: </b> ${e.features[0].properties.h3_index}<br>
						<b> H3 score: </b> ${e.features[0].properties.average_score}
						</div>`)
                    .addTo(map);
            });

			map.on('click', 'ener_score_simple-duplicate', (e: any) => {
                new maplibreGl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="min-width:16px;font-size:13px">
						<b> H3 Index: </b> ${e.features[0].properties.h3_index}<br>
						<b> H3 score: </b> ${e.features[0].properties.energy_drink_potential}
						</div>`)
                    .addTo(map);
            });

			map.on('click', 'ener_score_pen', (e: any) => {
                new maplibreGl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`<div style="min-width:16px;font-size:13px">
						<b> H3 Index: </b> ${e.features[0].properties.h3_index}<br>
						<b> H3 score: </b> ${e.features[0].properties.direct_penalty}
						</div>`)
                    .addTo(map);
            });
		
		});

		return () => {
			map.remove();
		};
	}, []);

	return (
		<div className="relative h-screen w-screen">
			{/* Floating tabs */}
			<div className="absolute top-4 left-4 z-10">
				<Tabs value={activeTab} onValueChange={handleTabChange} className="w-[400px]">
					<TabsList>
						{tabs.map(tab => (
							<TabsTrigger key={tab.value} value={tab.value}>
								{tab.name}
							</TabsTrigger>
						))}
					</TabsList>
					{tabs.map(tab => (
						<TabsContent key={tab.value} value={tab.value}>
							<p className='text-muted-foreground text-m'>{tab.content}</p>
						</TabsContent>
					))}
				</Tabs>
			</div>

			{/* Legend */}
			<div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-lg">
				<h3 className="font-semibold mb-3">Legend</h3>
				<div className="max-h-96 overflow-y-auto space-y-4">
					<div>
						<p className="text-xs font-medium text-muted-foreground mb-2">range score</p>
						<div className="space-y-2">
							{activeLegend.polygon.map((item) => (
								<div key={item.label} className="flex items-center gap-2">
									{renderLegendMarker(item, "polygon")}
									<span className="text-sm">{item.label}</span>
								</div>
							))}
						</div>
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground mb-2">tags</p>
						<div className="space-y-2">
							{activeLegend.point.map((item) => (
								<div key={item.label} className="flex items-center gap-2">
									{renderLegendMarker(item, "point")}
									<span className="text-sm">{item.label}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Map underneath */}
			<div className="h-screen w-screen" id="map" />
		</div>
	);
};

export default RenderMap;
