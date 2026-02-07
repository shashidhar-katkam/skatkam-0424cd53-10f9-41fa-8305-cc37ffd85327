import {
  getPaginationParams,
  toSlug,
  toDateString,
  normalizeSortOrder,
} from './index';

describe('utils', () => {
  describe('getPaginationParams', () => {
    it('should return default skip and take', () => {
      const result = getPaginationParams();
      expect(result).toEqual({ skip: 0, take: 10 });
    });

    it('should compute skip for page 2', () => {
      const result = getPaginationParams(2, 10);
      expect(result).toEqual({ skip: 10, take: 10 });
    });

    it('should cap limit at 100', () => {
      const result = getPaginationParams(1, 200);
      expect(result).toEqual({ skip: 0, take: 100 });
    });

    it('should enforce minimum page 1', () => {
      const result = getPaginationParams(0, 10);
      expect(result).toEqual({ skip: 0, take: 10 });
    });
  });

  describe('toSlug', () => {
    it('should lowercase and replace spaces with underscores', () => {
      expect(toSlug('Test Role')).toBe('test_role');
    });

    it('should handle multiple spaces', () => {
      expect(toSlug('hello   world')).toBe('hello_world');
    });
  });

  describe('toDateString', () => {
    it('should return null for null/undefined', () => {
      expect(toDateString(null)).toBeNull();
      expect(toDateString(undefined)).toBeNull();
    });

    it('should format date as YYYY-MM-DD', () => {
      const d = new Date('2024-06-15T12:00:00Z');
      expect(toDateString(d)).toBe('2024-06-15');
    });
  });

  describe('normalizeSortOrder', () => {
    it('should return ASC for undefined', () => {
      expect(normalizeSortOrder(undefined)).toBe('ASC');
    });

    it('should return DESC when value is desc', () => {
      expect(normalizeSortOrder('desc')).toBe('DESC');
      expect(normalizeSortOrder('DESC')).toBe('DESC');
    });

    it('should return ASC for other values', () => {
      expect(normalizeSortOrder('asc')).toBe('ASC');
      expect(normalizeSortOrder('invalid')).toBe('ASC');
    });
  });
});
