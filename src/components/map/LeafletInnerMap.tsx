'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapHouseholdData, getPinColor, createPinSvg, filterHouseholdsWithCoordinates } from './MapPinMarker';
import Link from 'next/link';

interface LeafletInnerMapProps {
  households: MapHouseholdData[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export default function LeafletInnerMap({
  households,
  defaultCenter = [-6.8041, 110.8405], // Kudus coordinates default
  defaultZoom = 15,
}: LeafletInnerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedHousehold, setSelectedHousehold] = useState<MapHouseholdData | null>(null);

  const validHouseholds = filterHouseholdsWithCoordinates(households);

  useEffect(() => {
    let isMounted = true;

    // Dynamically import Leaflet on client side
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Determine center: if validHouseholds exist, center on the first one
      const center: [number, number] = validHouseholds.length > 0 && validHouseholds[0].latitude && validHouseholds[0].longitude
        ? [validHouseholds[0].latitude, validHouseholds[0].longitude]
        : defaultCenter;

      const map = L.map(mapContainerRef.current).setView(center, defaultZoom);
      mapInstanceRef.current = map;

      // OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add pins for each household
      const bounds = L.latLngBounds([]);

      validHouseholds.forEach((hh) => {
        if (!hh.latitude || !hh.longitude) return;

        const color = getPinColor({
          kriteriaRumah: hh.kriteriaRumah,
          jambanKeluarga: hh.jambanKeluarga,
          hasBalita: hh.hasBalita,
          hasIbuHamil: hh.hasIbuHamil,
        });

        const icon = L.divIcon({
          className: 'custom-gis-pin',
          html: createPinSvg(color),
          iconSize: [30, 38],
          iconAnchor: [15, 38],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([hh.latitude, hh.longitude], { icon }).addTo(map);

        const statusLabel =
          color === 'red'
            ? '<span style="color:#b91c1c; font-weight:bold;">Perlu Perhatian Sanitasi</span>'
            : color === 'yellow'
            ? '<span style="color:#b45309; font-weight:bold;">Terdapat Balita / Ibu Hamil</span>'
            : '<span style="color:#15803d; font-weight:bold;">Rumah Sehat Standar</span>';

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 180px;">
            <div style="font-weight: bold; font-size: 13px; color: #1c1917; margin-bottom: 2px;">
              ${hh.namaKepalaRumahTangga}
            </div>
            <div style="color: #78716c; font-size: 11px; margin-bottom: 6px;">
              No KK: ${hh.noKk} &bull; ${hh.wilayah ? `RT ${hh.wilayah.rt}/RW ${hh.wilayah.rw}` : ''}
            </div>
            <div style="margin-bottom: 4px;">
              ${statusLabel}
            </div>
            <div style="color: #44403c; font-size: 11px;">
              Sanitasi: <b>${hh.kriteriaRumah === 'SEHAT' ? 'Sehat' : 'Kurang Sehat'}</b> &bull; Jamban: <b>${hh.jambanKeluarga ? 'Ada' : 'Tidak Ada'}</b>
            </div>
            <div style="color: #44403c; font-size: 11px; margin-top: 2px;">
              Anggota: <b>${hh.jumlahAnggota} Jiwa</b>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedHousehold(hh);
        });

        bounds.extend([hh.latitude, hh.longitude]);
      });

      if (validHouseholds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [validHouseholds]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-stone-200 shadow-md">
      {/* Leaflet CSS CDN link */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Selected Household Detail Overlay (if any) */}
      {selectedHousehold && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-stone-200 shadow-xl z-[1000] text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                Detail Rumah Tangga
              </span>
              <h3 className="text-sm font-bold text-stone-900 mt-1">
                {selectedHousehold.namaKepalaRumahTangga}
              </h3>
              <p className="text-stone-500 text-[11px]">
                {selectedHousehold.alamat} {selectedHousehold.wilayah ? `(RT ${selectedHousehold.wilayah.rt}/RW ${selectedHousehold.wilayah.rw})` : ''}
              </p>
            </div>
            <button
              onClick={() => setSelectedHousehold(null)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 text-stone-700">
            <div>
              <span className="text-stone-400 block text-[10px]">Kondisi Sanitasi</span>
              <span className="font-semibold">{selectedHousehold.kriteriaRumah === 'SEHAT' ? 'Rumah Sehat' : 'Kurang Sehat'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px]">Jamban Keluarga</span>
              <span className="font-semibold">{selectedHousehold.jambanKeluarga ? 'Tersedia' : 'Belum Ada'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px]">Total Anggota</span>
              <span className="font-semibold">{selectedHousehold.jumlahAnggota} Jiwa</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px]">Koordinat</span>
              <span className="font-mono text-[10px]">{selectedHousehold.latitude?.toFixed(4)}, {selectedHousehold.longitude?.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
