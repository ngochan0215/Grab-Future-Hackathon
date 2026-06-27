import { useRef, useMemo, useCallback, useEffect } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import { DHQG_CENTER } from '../../utils/geo';

// Free vector tiles — crisp, retina, no API key.
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Our coords are [lat, lng]; GeoJSON/MapLibre want [lng, lat].
const toLngLat = (c) => [c[1], c[0]];

/**
 * Generic vector map.
 *  - polylines: [{ coords:[[lat,lng]], color, dashArray, weight }]
 *  - markers:   [{ position:[lat,lng], emoji, label }]
 *  - hazards:   [{ position:[lat,lng], label, color }]
 *  - focusPosition: [lat, lng] — fly to this when it changes
 *  - onMapClick(lat, lng) — called when user taps/clicks on the map
 */
export default function MapView({
  polylines = [],
  markers = [],
  hazards = [],
  height = 260,
  center = DHQG_CENTER,
  zoom = 14,
  interactive = false,
  focusPosition = null,
  onMapClick = null,
}) {
  const mapRef = useRef(null);

  const allCoords = useMemo(
    () => [
      ...polylines.flatMap((p) => p.coords || []),
      ...markers.map((m) => m.position),
      ...hazards.map((h) => h.position),
    ],
    [polylines, markers, hazards]
  );

  const fitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || allCoords.length === 0) return;
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const [lat, lng] of allCoords) {
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
    }
    if (minLat === maxLat && minLng === maxLng) {
      map.easeTo({ center: [minLng, minLat], zoom: 16, duration: 500 });
      return;
    }
    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 44, maxZoom: 17, duration: 600 }
    );
  }, [allCoords]);

  // Fly to focusPosition when it changes
  useEffect(() => {
    if (!focusPosition || !mapRef.current) return;
    const [lat, lng] = focusPosition;
    mapRef.current.easeTo({ center: [lng, lat], zoom: 16, duration: 600 });
  }, [focusPosition]);

  const handleMapClick = useCallback((e) => {
    if (!onMapClick) return;
    const { lng, lat } = e.lngLat;
    onMapClick(lat, lng);
  }, [onMapClick]);

  return (
    <div className="mapWrap" style={{ height }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center[1], latitude: center[0], zoom }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        scrollZoom={interactive}
        dragPan={interactive}
        dragRotate={false}
        onLoad={fitBounds}
        onClick={onMapClick ? handleMapClick : undefined}
        cursor={onMapClick ? 'crosshair' : 'grab'}
      >
        {polylines.map((p, i) =>
          p.coords?.length ? (
            <Source
              key={`src-${i}`}
              id={`pl-${i}`}
              type="geojson"
              data={{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: p.coords.map(toLngLat) },
              }}
            >
              <Layer
                id={`ln-${i}`}
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': p.color || '#0d9b87',
                  'line-width': p.weight || 5,
                  'line-opacity': 0.9,
                  ...(p.dashArray ? { 'line-dasharray': [2, 2] } : {}),
                }}
              />
            </Source>
          ) : null
        )}

        {hazards.map((h, i) => (
          <Marker key={`hz-${i}`} longitude={h.position[1]} latitude={h.position[0]}>
            <div className="hazardDot" title={h.label} style={h.color ? { background: h.color } : undefined} />
          </Marker>
        ))}

        {markers.map((m, i) => (
          <Marker key={`mk-${i}`} longitude={m.position[1]} latitude={m.position[0]}>
            <div className="emojiPin" title={m.label}>{m.emoji || '📍'}</div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
