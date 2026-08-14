import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { Button } from '../ui/Button';

// Fix Leaflet marker icon in Vite/Webpack
const customMarkerIcon = new L.DivIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div style="
      background-color: #2563eb;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  addressText,
  onLocationChange,
  className = '',
}) {
  const defaultCenter = [20.2961, 85.8245]; // Bhubaneswar center
  const currentLat = Number(latitude) || defaultCenter[0];
  const currentLng = Number(longitude) || defaultCenter[1];

  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const handleMapClick = (lat, lng) => {
    onLocationChange({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      addressText: addressText || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onLocationChange({
          latitude: lat,
          longitude: lng,
          addressText: addressText || 'My Current GPS Location',
        });
      },
      (err) => {
        setLocating(false);
        setGeoError(err.message || 'Unable to fetch current location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 overflow-hidden shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 font-display">
            Pin Location on Map
          </label>
          <p className="text-xs text-slate-500">
            Click anywhere on the map to pinpoint the exact issue location
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocateMe}
          loading={locating}
          icon={Navigation}
          className="shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Use My GPS
        </Button>
      </div>

      <div className="h-64 w-full rounded-xl overflow-hidden relative border border-slate-200">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[currentLat, currentLng]} icon={customMarkerIcon} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          <MapRecenter center={[currentLat, currentLng]} />
        </MapContainer>

        <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-700 shadow-sm border border-slate-200/80 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          Click map to repin
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            Lat: <strong className="text-slate-800">{currentLat}</strong>, Lng:{' '}
            <strong className="text-slate-800">{currentLng}</strong>
          </span>
        </div>
        {geoError && <span className="text-rose-600 font-medium">{geoError}</span>}
      </div>
    </div>
  );
}
