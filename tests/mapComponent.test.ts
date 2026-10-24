import { describe, it, expect } from 'vitest';
import { getPinColor, filterHouseholdsWithCoordinates, MapHouseholdData } from '../src/components/map/MapPinMarker';

describe('GIS Map Helper', () => {
  it('assigns RED to houses without healthy sanitation', () => {
    const color1 = getPinColor({ kriteriaRumah: 'KURANG_SEHAT', jambanKeluarga: false });
    expect(color1).toBe('red');

    const color2 = getPinColor({ kriteriaRumah: 'SEHAT', jambanKeluarga: false });
    expect(color2).toBe('red');

    const color3 = getPinColor({ kriteriaRumah: 'KURANG_SEHAT', jambanKeluarga: true });
    expect(color3).toBe('red');
  });

  it('assigns YELLOW to houses with infant or pregnant woman', () => {
    const colorBalita = getPinColor({ kriteriaRumah: 'SEHAT', jambanKeluarga: true, hasBalita: true });
    expect(colorBalita).toBe('yellow');

    const colorBumil = getPinColor({ kriteriaRumah: 'SEHAT', jambanKeluarga: true, hasIbuHamil: true });
    expect(colorBumil).toBe('yellow');
  });

  it('assigns GREEN to healthy standard households', () => {
    const color = getPinColor({ kriteriaRumah: 'SEHAT', jambanKeluarga: true, hasBalita: false, hasIbuHamil: false });
    expect(color).toBe('green');
  });

  it('filters only households with valid numeric latitude and longitude', () => {
    const households: Partial<MapHouseholdData>[] = [
      { id: '1', namaKepalaRumahTangga: 'Ahmad', latitude: -6.8041, longitude: 110.8405 },
      { id: '2', namaKepalaRumahTangga: 'Budi', latitude: null, longitude: 110.8405 },
      { id: '3', namaKepalaRumahTangga: 'Cahyo', latitude: -6.8055, longitude: null },
      { id: '4', namaKepalaRumahTangga: 'Dedi', latitude: undefined, longitude: undefined },
    ];

    const valid = filterHouseholdsWithCoordinates(households as MapHouseholdData[]);
    expect(valid.length).toBe(1);
    expect(valid[0].id).toBe('1');
  });
});
