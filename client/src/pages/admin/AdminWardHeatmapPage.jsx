import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import * as adminApi from '../../api/admin';
import * as refApi from '../../api/reference';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { MapPin, Users, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

const pinIcon = new L.DivIcon({
  className: 'leaflet-pin',
  html: `<div style="background-color: #2563eb; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function AdminWardHeatmapPage() {
  const [wards, setWards] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      refApi.getWards().catch(() => []),
      adminApi.getAdminGrievances({ limit: 100 }).catch(() => ({ items: [] })),
    ])
      .then(([wRes, gRes]) => {
        setWards(wRes);
        setGrievances(gRes.items || []);
        if (wRes.length > 0) setSelectedWard(wRes[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading spatial ward heatmap..." />;
  }

  const centerCoordinates = wards[0]?.center?.coordinates
    ? [wards[0].center.coordinates[1], wards[0].center.coordinates[0]]
    : [20.2961, 85.8245];

  const wardGrievances = selectedWard
    ? grievances.filter((g) => g.wardId?._id === selectedWard._id || g.wardId === selectedWard._id)
    : grievances;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          Geospatial Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          Ward Heatmap & Issue Concentration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Interactive city map plotting grievance coordinates and high-priority hotspots
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="p-2 bg-white border-slate-200 shadow-sm overflow-hidden h-[600px] relative">
            <MapContainer
              center={centerCoordinates}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full rounded-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Grievance pins */}
              {grievances.map((g) => {
                const lat = g.latitude || (g.location?.coordinates?.[1]);
                const lng = g.longitude || (g.location?.coordinates?.[0]);
                if (!lat || !lng) return null;

                const isCritical = ['high', 'critical'].includes(g.priority);

                return (
                  <CircleMarker
                    key={g._id}
                    center={[lat, lng]}
                    radius={isCritical ? 10 : 6}
                    pathOptions={{
                      color: isCritical ? '#e11d48' : '#2563eb',
                      fillColor: isCritical ? '#f43f5e' : '#3b82f6',
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <span className="font-mono font-bold text-[10px] bg-slate-100 px-1 rounded">{g.ticketId}</span>
                        <p className="font-bold text-slate-900">{g.title}</p>
                        <p className="text-slate-500">{g.category}</p>
                        <div className="pt-1 flex gap-1">
                          <StatusBadge status={g.status} />
                          <PriorityBadge priority={g.priority} />
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Map Legend overlay */}
            <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200/80 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 font-display">Heatmap Legend</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                <span className="text-slate-600">High / Critical Issue Hotspot</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                <span className="text-slate-600">Standard Priority Complaint</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Ward Information Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Select Ward Zone
            </h3>

            <div className="space-y-2">
              {wards.map((w) => (
                <button
                  key={w._id}
                  type="button"
                  onClick={() => setSelectedWard(w)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                    selectedWard?._id === w._id
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-sm'
                      : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{w.name}</p>
                    <span className="text-[10px] text-slate-400">{w.city} ({w.code})</span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 bg-white rounded border border-slate-200">
                    {grievances.filter((g) => g.wardId?._id === w._id || g.wardId === w._id).length} issues
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Ward Deep Metrics */}
          {selectedWard && (
            <Card className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-800 shadow-md space-y-3">
              <p className="text-[10px] uppercase font-bold text-blue-400">Ward Deep Dive</p>
              <h4 className="text-lg font-bold font-display text-white">{selectedWard.name}</h4>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="p-2 bg-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Est. Population</span>
                  <span className="font-bold text-white">{(selectedWard.population || 25000).toLocaleString()}</span>
                </div>

                <div className="p-2 bg-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Active Complaints</span>
                  <span className="font-bold text-amber-400">{wardGrievances.length}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
