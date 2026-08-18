"use client";

import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";

// Built as HTML so Leaflet's default marker image assets are never requested,
// which is what breaks marker icons under a bundler.
const incidentIcon = divIcon({
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `
    <span class="relative flex h-10 w-10 items-center justify-center">
      <span class="absolute h-10 w-10 rounded-full bg-blue-500/30 animate-ping"></span>
      <span class="relative h-6 w-6 rounded-full bg-blue-600 ring-4 ring-white shadow-md"></span>
    </span>
  `,
});

export default function ReportMapView({ latitude, longitude }) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={17}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topright" />
      <Marker position={[latitude, longitude]} icon={incidentIcon} />
    </MapContainer>
  );
}
