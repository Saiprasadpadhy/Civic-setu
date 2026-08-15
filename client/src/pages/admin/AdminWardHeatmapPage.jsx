import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import * as adminApi from '../../api/admin';
import * as refApi from '../../api/reference';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import {
  MapPin,
  Filter,
  Flame,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';

export default function AdminWardHeatmapPage() {
  const [heatmapData, setHeatmapData] = useState({ wards: [], densityPoints: [], totalHotspots: 0, totalGrievancesInView: 0 });
  const [categories, setCategories] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [wardFilter, setWardFilter] = useState('');

  const fetchHeatmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hmRes, catRes] = await Promise.all([
        adminApi.getWardHeatmapData({
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          status: statusFilter || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          wardId: wardFilter || undefined,
        }),
        refApi.getCategories().catch(() => ['pothole', 'garbage', 'street_light', 'water_leakage', 'drainage', 'sanitation']),
      ]);

      setHeatmapData(hmRes || { wards: [], densityPoints: [] });
      setCategories(catRes || []);

      if (hmRes?.wards?.length > 0 && !selectedWard) {
        setSelectedWard(hmRes.wards[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load spatial heatmap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap();
  }, [categoryFilter, priorityFilter, statusFilter, fromDate, toDate, wardFilter]);

  const handleResetFilters = () => {
    setCategoryFilter('');
    setPriorityFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setWardFilter('');
  };

  const centerCoordinates = heatmapData.wards[0]?.center || [20.2961, 85.8245];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-blue-400">
            Geospatial Urban Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
            Ward Grievance Density Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time backend aggregated complaint density, hotspot clustering, and SLA breach risks across municipal wards.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0">
          <p className="text-xs uppercase text-slate-300 font-semibold">Active Density Points</p>
          <p className="text-2xl font-black text-amber-400 font-display mt-0.5">
            {heatmapData.totalGrievancesInView || 0}
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchHeatmap} />}

      {/* Filter Control Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Heatmap Spatial Filters
          </div>
          {(categoryFilter || priorityFilter || statusFilter || fromDate || toDate || wardFilter) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} icon={RotateCcw} className="text-xs text-slate-500">
              Reset Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Ward Select */}
          <Select
            label="Ward"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
          >
            <option value="">All Municipal Wards</option>
            {heatmapData.wards.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          {/* Category Select */}
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </Select>

          {/* Priority Select */}
          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical Urgency</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>

          {/* Status Select */}
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Lifecycle Stages</option>
            <option value="submitted">Submitted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>

          {/* From Date */}
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          {/* To Date */}
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Main Grid: Leaflet Map (8 cols) + Ward Deep Dive Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="p-2 bg-white border-slate-200 shadow-sm overflow-hidden h-[620px] relative">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" text="Aggregating geospatial complaint points..." />
              </div>
            ) : (
              <MapContainer
                center={centerCoordinates}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full rounded-2xl"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Ward Center Aggregation Circles */}
                {heatmapData.wards.map((w) => {
                  if (!w.center || w.center.length !== 2) return null;
                  const radius = Math.max(400, Math.min(1200, (w.totalCount || 1) * 150));
                  const isHighDensity = w.densityScore > 50;

                  return (
                    <Circle
                      key={`ward-circle-${w._id}`}
                      center={w.center}
                      radius={radius}
                      pathOptions={{
                        color: isHighDensity ? '#f43f5e' : '#3b82f6',
                        fillColor: isHighDensity ? '#f43f5e' : '#3b82f6',
                        fillOpacity: 0.12,
                        weight: 1.5,
                        dashArray: '4, 4',
                      }}
                    />
                  );
                })}

                {/* Backend Aggregated Clustered Points (Zero Private Info) */}
                {heatmapData.densityPoints.map((pt, idx) => {
                  if (!pt.latitude || !pt.longitude) return null;
                  const isCritical = ['high', 'critical'].includes(pt.priority);
                  const isResolved = ['resolved', 'closed'].includes(pt.status);

                  return (
                    <CircleMarker
                      key={`pt-${idx}`}
                      center={[pt.latitude, pt.longitude]}
                      radius={isCritical ? Math.min(18, 8 + pt.count * 2) : Math.min(14, 6 + pt.count * 1.5)}
                      pathOptions={{
                        color: isResolved ? '#10b981' : isCritical ? '#e11d48' : '#2563eb',
                        fillColor: isResolved ? '#34d399' : isCritical ? '#f43f5e' : '#60a5fa',
                        fillOpacity: 0.85,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                            <span className="font-bold text-slate-900 capitalize">
                              {pt.category?.replace('_', ' ')}
                            </span>
                            <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              {pt.count} Issue{pt.count === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-0.5">
                            <PriorityBadge priority={pt.priority} />
                            <StatusBadge status={pt.status} />
                          </div>

                          <p className="text-[10px] text-slate-400 pt-0.5">
                            Coordinates: {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}

            {/* Map Legend Overlay */}
            <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/80 text-xs space-y-2 max-w-xs">
              <p className="font-bold text-slate-900 font-display flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Spatial Density Legend
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                  <span className="text-slate-700">High / Critical Urgency Hotspot</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                  <span className="text-slate-700">Standard Priority Issue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  <span className="text-slate-700">Verified Resolved Issue</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Ward Zone Selector & Deep Metrics (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Municipal Ward Zonal Breakdown
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {heatmapData.wards.map((w) => (
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
                  <div className="text-right">
                    <span className="font-mono text-[11px] px-2 py-0.5 bg-white rounded border border-slate-200 font-bold">
                      {w.totalCount} issues
                    </span>
                    {w.criticalCount > 0 && (
                      <span className="block text-[10px] text-rose-600 font-bold mt-0.5">
                        {w.criticalCount} critical
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Ward Deep Metrics Card */}
          {selectedWard && (
            <Card className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-800 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Ward Zone Deep Dive</span>
                <h4 className="text-lg font-extrabold font-display text-white mt-0.5">{selectedWard.name}</h4>
                <p className="text-xs text-slate-300">{selectedWard.city} &bull; Zone Code: {selectedWard.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Population Covered</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">
                    {(selectedWard.population || 25000).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Active Complaints</span>
                  <span className="font-bold text-amber-400 text-sm mt-0.5 block">
                    {selectedWard.totalCount}
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Critical Urgency</span>
                  <span className="font-bold text-rose-400 text-sm mt-0.5 block">
                    {selectedWard.criticalCount}
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Resolved/Closed</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                    {selectedWard.resolvedCount}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
