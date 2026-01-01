import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix for missing default icon in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function DraggableMarker({ position, setPosition }) {
  const [draggable, setDraggable] = useState(false);
  const markerRef = React.useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition]
  );

  const toggleDraggable = () => setDraggable((d) => !d);

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
    </Marker>
  );
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }) {
  // Default to Tamil Nadu coordinates if none provided
  const [position, setPosition] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : { lat: 11.1271, lng: 78.6569 }
  );

  useEffect(() => {
    onLocationSelect(position.lat, position.lng);
  }, [position, onLocationSelect]);

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 mt-2 relative z-0">
      <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} setPosition={setPosition} />
      </MapContainer>
      <div className="text-xs text-gray-500 mt-1 text-center">
        * Drag the blue marker to your exact factory location
      </div>
    </div>
  );
}