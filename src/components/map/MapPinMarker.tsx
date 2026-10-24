import React from 'react';

export type PinColor = 'red' | 'yellow' | 'green';

export interface HouseholdSanitationCriteria {
  kriteriaRumah?: string;
  jambanKeluarga?: boolean;
  hasBalita?: boolean;
  hasIbuHamil?: boolean;
}

export interface MapHouseholdData {
  id: string;
  noKk: string;
  namaKepalaRumahTangga: string;
  alamat: string;
  latitude?: number | null;
  longitude?: number | null;
  kriteriaRumah: string;
  jambanKeluarga: boolean;
  jumlahAnggota: number;
  hasBalita: boolean;
  hasIbuHamil: boolean;
  wilayah?: {
    rt: string;
    rw: string;
    namaDasawisma: string;
  } | null;
}

/**
 * Determines map pin color based on household sanitation and vulnerability:
 * - RED: Less healthy house (KURANG_SEHAT) OR lacks family latrine (jambanKeluarga = false)
 * - YELLOW: Standard healthy house, but has vulnerable residents (Balita / Pregnant woman)
 * - GREEN: Healthy standard house without high-vulnerability flags
 */
export function getPinColor(criteria: HouseholdSanitationCriteria): PinColor {
  if (criteria.kriteriaRumah === 'KURANG_SEHAT' || criteria.jambanKeluarga === false) {
    return 'red';
  }

  if (criteria.hasBalita || criteria.hasIbuHamil) {
    return 'yellow';
  }

  return 'green';
}

/**
 * Filters out households without valid numeric GPS coordinates.
 */
export function filterHouseholdsWithCoordinates(households: MapHouseholdData[]): MapHouseholdData[] {
  return households.filter(
    (h) =>
      typeof h.latitude === 'number' &&
      typeof h.longitude === 'number' &&
      !isNaN(h.latitude) &&
      !isNaN(h.longitude)
  );
}

/**
 * Generates an SVG string for Leaflet DivIcon with the specified color.
 */
export function createPinSvg(color: PinColor): string {
  const fill = color === 'red' ? '#dc2626' : color === 'yellow' ? '#d97706' : '#16a34a';
  const stroke = color === 'red' ? '#991b1b' : color === 'yellow' ? '#b45309' : '#15803d';

  return `
    <div style="position: relative; width: 30px; height: 38px; transform: translate(-50%, -100%);">
      <svg viewBox="0 0 24 30" width="30" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <circle cx="12" cy="11" r="4.5" fill="#ffffff" />
      </svg>
    </div>
  `;
}
