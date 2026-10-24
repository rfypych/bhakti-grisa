'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { MapHouseholdData } from './MapPinMarker';

const DynamicLeafletMap = dynamic(() => import('./LeafletInnerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-2xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center gap-3 text-stone-500 animate-pulse">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium">Memuat Peta Spasial Rumah Warga...</p>
    </div>
  ),
});

interface GisMapProps {
  households: MapHouseholdData[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export function GisMap(props: GisMapProps) {
  return <DynamicLeafletMap {...props} />;
}
