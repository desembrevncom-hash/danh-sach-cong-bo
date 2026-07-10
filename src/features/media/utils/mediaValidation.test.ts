import { describe, it, expect } from 'vitest';
import { validateMediaFile, generateSafeFileName } from './mediaValidation';

describe('mediaValidation', () => {
  describe('validateMediaFile', () => {
    it('should reject oversized files', () => {
      // Mock File object
      const oversizedFile = new File([''], 'big.png', { type: 'image/png' });
      Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      const error = validateMediaFile(oversizedFile, 'og_image');
      expect(error).toContain('Kích thước file vượt quá 5MB');
    });

    it('should reject unsupported mime types', () => {
      const badFile = new File([''], 'doc.pdf', { type: 'application/pdf' });
      const error = validateMediaFile(badFile, 'favicon');
      expect(error).toContain('Định dạng file không được hỗ trợ');
    });

    it('should reject svg files for security reasons', () => {
      const svgFile = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
      const error = validateMediaFile(svgFile, 'brand_logo');
      expect(error).toContain('Định dạng file không được hỗ trợ');
    });

    it('should accept valid images', () => {
      const validFile = new File([''], 'logo.png', { type: 'image/png' });
      const error = validateMediaFile(validFile, 'brand_logo');
      expect(error).toBeNull();
    });
  });

  describe('generateSafeFileName', () => {
    it('should remove special characters and vietnamese accents', () => {
      const result = generateSafeFileName('Ảnh Sản Phẩm Mới (1).png');
      expect(result).toMatch(/^\d+-anh-san-pham-moi-1-.png$/);
    });

    it('should convert to lowercase', () => {
      const result = generateSafeFileName('TEST.JPG');
      expect(result).toMatch(/^\d+-test.jpg$/);
    });
  });
});
