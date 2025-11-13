import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import axios from 'axios';
import L from 'leaflet';

// Geo-Analytics Page - Smart Police Recognition Dashboard
export default function GeoAnalyticsPage() {
  const [geoData, setGeoData] = useState(null);
  const [regionMetrics, setRegionMetrics] = useState({});
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Prefer the geojson link you gave; topojson link included as fallback
  const GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@8d907bc/geojson/states/odisha.geojson';
  const TOPOJSON_URL = 'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@8d907bc/topojson/states/odisha.json';

  useEffect(() => {
    async function loadGeo() {
      // try geojson first (should be CORS-friendly via jsdelivr)
      for (const url of [GEOJSON_URL, TOPOJSON_URL]) {
        try {
          const res = await axios.get(url, { responseType: 'json', timeout: 10000 });
          let data = res.data;

          // If TopoJSON detected, try to convert to GeoJSON using topojson-client
          if (data && data.type && data.type.toLowerCase() === 'topology') {
            try {
              // dynamic import so project doesn't fail if package is not installed.
              const topojson = await import('topojson-client');
              const objKeys = Object.keys(data.objects || {});
              if (objKeys.length === 0) throw new Error('TopoJSON has no objects');
              // pick the first object (usually the states/districts collection)
              const geo = topojson.feature(data, data.objects[objKeys[0]]);
              data = geo;
            } catch (errTopo) {
              console.warn('TopoJSON present but failed to convert (topojson-client not found?):', errTopo);
              throw new Error('TopoJSON conversion failed — install topojson-client or fetch GeoJSON instead.');
            }
          }

          // Basic shape check
          if (!data || (!data.features && data.type !== 'FeatureCollection')) {
            throw new Error('Invalid geo data format');
          }

          setGeoData(data);

          // fit bounds
          setTimeout(() => {
            try {
              if (mapRef.current && data) {
                const bounds = L.geoJSON(data).getBounds();
                if (bounds.isValid && !bounds.isEmpty()) {
                  mapRef.current.fitBounds(bounds, { padding: [20, 20] });
                }
              }
            } catch (e) {
              console.warn('fitBounds error:', e);
            }
          }, 50);

          // success — break out of the for loop
          return;
        } catch (err) {
          console.warn(`Failed to load from ${url}:`, err.message || err);
          // try next URL in loop; if last one fails we'll show error below
        }
      }

      // If we reach here both attempts failed
      setError('Failed to load map data from provided URLs (check network/CORS).');
      console.error('Failed to fetch GeoJSON/TopoJSON from both URLs.');
    }

    async function loadMetrics() {
      try {
        // Keep your local API call, but it's optional
        const res = await axios.get('http://localhost:8000/kpis', { timeout: 3000 });
        // if your API returns structured data you should set it here; fallback to defaults below
        setRegionMetrics(res.data || {
          Bhubaneswar: { recognitions: 12, sentiment: 0.82, casesClosed: 0.75 },
          Cuttack: { recognitions: 9, sentiment: 0.78, casesClosed: 0.7 },
          Puri: { recognitions: 8, sentiment: 0.8, casesClosed: 0.72 },
          Rourkela: { recognitions: 10, sentiment: 0.86, casesClosed: 0.8 },
          Koraput: { recognitions: 6, sentiment: 0.68, casesClosed: 0.65 },
          Balasore: { recognitions: 7, sentiment: 0.74, casesClosed: 0.69 }
        });
      } catch (e) {
        setRegionMetrics({
          Bhubaneswar: { recognitions: 12, sentiment: 0.82, casesClosed: 0.75 },
          Cuttack: { recognitions: 9, sentiment: 0.78, casesClosed: 0.7 },
          Puri: { recognitions: 8, sentiment: 0.8, casesClosed: 0.72 },
          Rourkela: { recognitions: 10, sentiment: 0.86, casesClosed: 0.8 },
          Koraput: { recognitions: 6, sentiment: 0.68, casesClosed: 0.65 },
          Balasore: { recognitions: 7, sentiment: 0.74, casesClosed: 0.69 }
        });
      }
    }

    loadGeo();
    loadMetrics();
  }, []);

  const getColorBySentiment = (sentiment) => {
    if (sentiment > 0.8) return '#22c55e';
    if (sentiment > 0.7) return '#84cc16';
    if (sentiment > 0.6) return '#eab308';
    return '#ef4444';
  };

  const extractDistrictName = (props = {}) => {
    return (
      props.dtname ||
      props.DTNAME ||
      props.DISTRICT ||
      props.district ||
      props.NAME_2 ||
      props.NAME ||
      props.name ||
      'Unknown'
    );
  };

  const geoStyle = (feature) => {
    const name = extractDistrictName(feature.properties);
    const region = regionMetrics[name] || {};
    const fillColor = getColorBySentiment(region.sentiment || 0.6);
    return {
      fillColor,
      fillOpacity: 0.6,
      color: '#334155',
      weight: 1,
    };
  };

  const onEachDistrict = (feature, layer) => {
    const name = extractDistrictName(feature.properties);
    const region = regionMetrics[name] || {};
    const sentimentPct = region.sentiment ? Math.round(region.sentiment * 100) : 'N/A';

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2, color: '#1e293b', fillOpacity: 0.85 });
        if (e.target.bringToFront) e.target.bringToFront();
      },
      mouseout: (e) => {
        e.target.setStyle(geoStyle(feature));
      },
    });

    const popupHtml = `<div style="font-family: Inter, sans-serif; min-width:140px;">
      <strong>${name}</strong><br />
      Recognitions: ${region.recognitions || 0}<br />
      Sentiment: ${sentimentPct}%<br />
      Cases Closed: ${Math.round((region.casesClosed || 0) * 100)}%
      </div>`;

    layer.bindPopup(popupHtml);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Geo-Analytics Dashboard</h1>
            <p className="text-slate-500 text-sm">District-wise performance insights based on recognition and sentiment data</p>
          </div>
        </header>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
          className="overflow-hidden rounded-2xl shadow-lg border border-slate-200">
          {error ? (
            <div className="p-10 text-center text-red-500">{error}</div>
          ) : geoData ? (
            <MapContainer
              center={[20.95, 84.5]}
              zoom={6.8}
              style={{ height: '600px', width: '100%' }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON data={geoData} style={geoStyle} onEachFeature={onEachDistrict} />
            </MapContainer>
          ) : (
            <div className="p-10 text-center text-slate-500">Loading Odisha map...</div>
          )}
        </motion.div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(regionMetrics).map(([district, data]) => (
            <motion.div whileHover={{ scale: 1.02 }} key={district} className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold text-slate-800">{district}</h3>
              <div className="text-xs text-slate-500">Recognitions: {data.recognitions}</div>
              <div className="text-xs text-slate-500">Community Sentiment: {Math.round(data.sentiment * 100)}%</div>
              <div className="text-xs text-slate-500">Cases Closed: {Math.round(data.casesClosed * 100)}%</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
