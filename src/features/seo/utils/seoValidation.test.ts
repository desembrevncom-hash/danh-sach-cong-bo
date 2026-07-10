import { describe, it, expect } from 'vitest';
import { validateSeoCanonicalUrl, validateSeoImageUrl, validateSeoSchemaJson, validateSeoRobots } from './seoValidation';

describe('seoValidation', () => {
  describe('validateSeoCanonicalUrl', () => {
    it('should return null for empty values', () => {
      expect(validateSeoCanonicalUrl(null)).toBeNull();
      expect(validateSeoCanonicalUrl('')).toBeNull();
      expect(validateSeoCanonicalUrl('   ')).toBeNull();
    });

    it('should return null for valid domain', () => {
      expect(validateSeoCanonicalUrl('https://cong-bo.hjcnt.com.vn/')).toBeNull();
      expect(validateSeoCanonicalUrl('https://cong-bo.hjcnt.com.vn/desembre')).toBeNull();
    });

    it('should return error for invalid domain', () => {
      expect(validateSeoCanonicalUrl('https://google.com')).toBe('Canonical URL phải thuộc domain cong-bo.hjcnt.com.vn');
    });

    it('should return error for invalid URL string', () => {
      expect(validateSeoCanonicalUrl('not a url')).toBe('URL không hợp lệ');
    });
  });

  describe('validateSeoImageUrl', () => {
    it('should return null for valid URL', () => {
      expect(validateSeoImageUrl('https://example.com/image.png')).toBeNull();
    });
    
    it('should return error for invalid URL', () => {
      expect(validateSeoImageUrl('invalid')).toBe('Image URL không hợp lệ');
    });
  });

  describe('validateSeoSchemaJson', () => {
    it('should return null for valid JSON object', () => {
      expect(validateSeoSchemaJson('{"@context": "https://schema.org"}')).toBeNull();
    });

    it('should return error for arrays or primitives', () => {
      expect(validateSeoSchemaJson('[]')).toBe('Schema phải là một JSON Object (không phải mảng hoặc chuỗi)');
      expect(validateSeoSchemaJson('"string"')).toBe('Schema phải là một JSON Object (không phải mảng hoặc chuỗi)');
    });

    it('should return error for invalid JSON format', () => {
      expect(validateSeoSchemaJson('{invalid json}')).toBe('JSON không hợp lệ');
    });
  });

  describe('validateSeoRobots', () => {
    it('should return null for valid combinations', () => {
      expect(validateSeoRobots('index,follow')).toBeNull();
      expect(validateSeoRobots('noindex,nofollow')).toBeNull();
      expect(validateSeoRobots('noindex, follow')).toBeNull();
    });

    it('should return error for invalid combinations', () => {
      expect(validateSeoRobots('index, noindex')).toBe('Robots không hợp lệ. Chỉ chấp nhận: index,follow | noindex,nofollow | noindex,follow');
      expect(validateSeoRobots('follow')).toBe('Robots không hợp lệ. Chỉ chấp nhận: index,follow | noindex,nofollow | noindex,follow');
    });
  });
});
