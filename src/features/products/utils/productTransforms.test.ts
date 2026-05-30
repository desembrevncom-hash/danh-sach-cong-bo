import { describe, it, expect } from 'vitest';
import { mergeProducts, filterProducts, groupProductsBySection, createDefaultOverride } from './productTransforms';
import type { FlatProduct } from '@/data/desembreProducts';
import type { ProductOverrideRow } from '../types';

describe('productTransforms', () => {
  const baseProducts: FlatProduct[] = [
    { no: 1, name: 'Product A', desc: 'Desc A', section: 'Section 1', link: 'linkA' },
    { no: 2, name: 'Product B', desc: 'Desc B', section: 'Section 1', link: 'linkB' },
    { no: 3, name: 'Product C', desc: 'Desc C', section: 'Section 2', link: 'linkC' },
  ];

  describe('mergeProducts', () => {
    it('1. Product có override deleted = true thì không xuất hiện', () => {
      const overrides: Record<number, ProductOverrideRow> = {
        2: { ...createDefaultOverride(2), deleted: true }
      };
      const result = mergeProducts(baseProducts, overrides);
      expect(result).toHaveLength(2);
      expect(result.find(p => p.no === 2)).toBeUndefined();
      expect(result.find(p => p.no === 1)).toBeDefined();
    });

    it('2. Override name, desc, section, link_url ghi đè đúng product gốc', () => {
      const overrides: Record<number, ProductOverrideRow> = {
        1: {
          ...createDefaultOverride(1),
          name: 'New Name',
          desc: 'New Desc',
          section: 'New Section',
          link_url: 'new-link'
        }
      };
      
      const result = mergeProducts(baseProducts, overrides);
      const updatedProduct = result.find(p => p.no === 1);
      
      expect(updatedProduct?.name).toBe('New Name');
      expect(updatedProduct?.desc).toBe('New Desc');
      expect(updatedProduct?.section).toBe('New Section');
      expect(updatedProduct?.link).toBe('new-link');
    });

    it('3. Product custom có is_custom = true được thêm vào danh sách', () => {
      const overrides: Record<number, ProductOverrideRow> = {
        1001: {
          ...createDefaultOverride(1001),
          is_custom: true,
          name: 'Custom Product',
          section: 'Section Custom'
        }
      };
      const result = mergeProducts(baseProducts, overrides);
      expect(result).toHaveLength(4);
      const custom = result.find(p => p.no === 1001);
      expect(custom).toBeDefined();
      expect(custom?.name).toBe('Custom Product');
      expect(custom?.section).toBe('Section Custom');
    });

    it('7. Không mutate input ban đầu', () => {
      const originalCopy = JSON.parse(JSON.stringify(baseProducts));
      const overrides: Record<number, ProductOverrideRow> = {
        1: { ...createDefaultOverride(1), name: 'Mutated?' }
      };
      
      mergeProducts(baseProducts, overrides);
      expect(baseProducts).toEqual(originalCopy);
    });
  });

  describe('filterProducts', () => {
    it('4. filterProducts lọc đúng theo keyword', () => {
      const result1 = filterProducts(baseProducts, 'product a', 'ALL');
      expect(result1).toHaveLength(1);
      expect(result1[0].no).toBe(1);

      const result2 = filterProducts(baseProducts, 'desc c', 'ALL');
      expect(result2).toHaveLength(1);
      expect(result2[0].no).toBe(3);
    });

    it('5. filterProducts lọc đúng theo section', () => {
      const result1 = filterProducts(baseProducts, '', 'Section 1');
      expect(result1).toHaveLength(2);
      expect(result1.every(p => p.section === 'Section 1')).toBe(true);

      const result2 = filterProducts(baseProducts, '', 'Section 2');
      expect(result2).toHaveLength(1);
      expect(result2[0].no).toBe(3);
    });

    it('Lọc kết hợp keyword và section', () => {
      const result = filterProducts(baseProducts, 'product', 'Section 2');
      expect(result).toHaveLength(1);
      expect(result[0].no).toBe(3);
    });

    it('7. Không mutate input ban đầu', () => {
      const originalCopy = JSON.parse(JSON.stringify(baseProducts));
      filterProducts(baseProducts, 'product', 'Section 1');
      expect(baseProducts).toEqual(originalCopy);
    });
  });

  describe('groupProductsBySection', () => {
    it('6. groupProductsBySection trả về đúng cấu trúc và giữ đúng thứ tự section', () => {
      const result = groupProductsBySection(baseProducts);
      
      // Expected array of tuples [sectionName, products[]]
      expect(result).toHaveLength(2);
      
      // Section 1 was first in the input
      expect(result[0][0]).toBe('Section 1');
      expect(result[0][1]).toHaveLength(2);
      expect(result[0][1][0].no).toBe(1);
      expect(result[0][1][1].no).toBe(2);

      // Section 2 was second
      expect(result[1][0]).toBe('Section 2');
      expect(result[1][1]).toHaveLength(1);
      expect(result[1][1][0].no).toBe(3);
    });

    it('7. Không mutate input ban đầu', () => {
      const originalCopy = JSON.parse(JSON.stringify(baseProducts));
      groupProductsBySection(baseProducts);
      expect(baseProducts).toEqual(originalCopy);
    });
  });
});
