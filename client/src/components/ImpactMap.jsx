import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Required Leaflet CSS
import L from 'leaflet'; // Import Leaflet library itself

/**
 * --- Leaflet Icon Fix ---
 * React-Leaflet and Webpack can break Leaflet's default icon paths.
 * This code manually resets the paths to use a reliable CDN.
 * This ensures the blue marker pins (and shadows) load correctly.
 */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


/**
 * ImpactMap Component (Leaflet Version)
 *
 * Renders an interactive map using React-Leaflet (no API key required).
 * It takes the 'events' array as a prop and plots a custom Marker for each.
 * Clicking a Marker opens a Popup with event details.
 */
function ImpactMap({ events }) {
  
  // Define the map's initial center and zoom (Leaflet uses a [lat, lng] array)
  const mapCenter = [20.2961, 85.8245]; // [lat, lng] for Bhubaneswar
  const mapZoom = 13;

  /**
   * Helper function to create a custom 'divIcon' for our emoji markers.
   * This lets us use text (like '🌟') as a map marker.
   */
  const createCustomIcon = (event) => {
    return L.divIcon({
      html: `<div class="text-3xl">${event.type === 'btc_nomination' ? '🌟' : '📍'}</div>`,
      className: 'bg-transparent border-0', // remove default divIcon styles
      iconSize: [30, 30], // size of the icon
      iconAnchor: [15, 30] // point of the icon (bottom-center)
    });
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Add a TileLayer. This is the base map (like Google Maps).
          OpenStreetMap is free and doesn't require an API key.
          The 'dark' map from Mapbox is not easily available; we use a standard one.
        */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map over the events array and create a Marker for each.
          React-Leaflet automatically handles the click-to-open logic
          when a <Popup> is nested inside a <Marker>.
        */}
        {events.map(event => (
          <Marker
            key={event.id}
            position={[event.location.lat, event.location.lng]} // Leaflet position
            icon={createCustomIcon(event)} // Use our custom emoji icon
          >
            <Popup>
              {/* This content appears when the marker is clicked */}
              <div className="p-1 font-sans">
                <h4 className="font-bold text-sm text-gray-900">{event.officer}</h4>
                <p className="text-xs text-gray-800">{event.summary}</p>
                <span className="text-xs text-gray-600">{event.date}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default ImpactMap;