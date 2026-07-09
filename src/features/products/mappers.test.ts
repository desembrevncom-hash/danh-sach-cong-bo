import { describe, it, expect } from 'vitest';
import { mapProductRowToViewModel } from './mappers';
import type { ProductRowFromRpc } from './types';

describe('mapProductRowToViewModel', () => {
  it('maps correctly with strict id', () => {
    const row: ProductRowFromRpc = {
      id: "15",
      display_no: 10,
      brand: 'desembre',
      section: 'CLEANSER',
      name: 'Name',
      desc: 'Desc',
      image_url: 'img.png',
      link_url: 'link.com',
      link_url_2: 'link2.com',
      sort_order: 1,
    };
    const vm = mapProductRowToViewModel(row);
    expect(vm.id).toBe("15");
    expect(vm.displayNo).toBe(10);
    expect(vm.brand).toBe('desembre');
    expect(vm.section).toBe('CLEANSER');
    expect(vm.name).toBe('Name');
    expect(vm.desc).toBe('Desc');
    expect(vm.image).toBe('img.png');
    expect(vm.link).toBe('link.com');
    expect(vm.link2).toBe('link2.com');
    expect(vm.sortOrder).toBe(1);
  });

  it('does NOT fallback to legacy_no as id', () => {
    const row = {
      display_no: 10,
      legacy_no: 10, // backend might return legacy_no
      section: 'CLEANSER',
      name: 'Name',
      desc: 'Desc'
    } as unknown as ProductRowFromRpc;
    expect(() => mapProductRowToViewModel(row)).toThrowError('Missing product identity from RPC row');
  });

  it('throws an error if identity is completely missing', () => {
    const row = {
      display_no: 10,
      section: 'CLEANSER',
      name: 'Name',
      desc: 'Desc'
    } as ProductRowFromRpc;

    expect(() => mapProductRowToViewModel(row)).toThrowError('Missing product identity from RPC row');
  });

  it('maps null fields safely', () => {
    const row: ProductRowFromRpc = {
      id: "1",
      display_no: 1,
      section: 'S',
      name: 'N',
      desc: 'D',
      image_url: undefined,
      link_url: undefined,
    };
    const vm = mapProductRowToViewModel(row);
    expect(vm.image).toBeUndefined();
    expect(vm.link).toBeUndefined();
  });
});
