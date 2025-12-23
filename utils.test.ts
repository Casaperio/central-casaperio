import { describe, it, expect } from 'vitest';
import { generateId, formatCurrency, formatDatePtBR, toDateKey, getCurrentDateTimeLocal } from './utils';

describe('utils', () => {
  describe('generateId', () => {
    it('should generate a 9-character alphanumeric ID', () => {
      const id = generateId();
      expect(id).toHaveLength(9);
      expect(id).toMatch(/^[a-zA-Z0-9]{9}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers as BRL currency', () => {
      const formatted1 = formatCurrency(1000);
      const formatted2 = formatCurrency(1500.50);

      expect(formatted1).toContain('1.000,00');
      expect(formatted1).toContain('R$');
      expect(formatted2).toContain('1.500,50');
      expect(formatted2).toContain('R$');
    });

    it('should format zero correctly', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('0,00');
      expect(formatted).toContain('R$');
    });

    it('should format negative numbers correctly', () => {
      const formatted = formatCurrency(-500);
      expect(formatted).toContain('500,00');
      expect(formatted).toContain('-');
      expect(formatted).toContain('R$');
    });
  });

  describe('formatDatePtBR', () => {
    it('should format dates in pt-BR locale', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDatePtBR(date);
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toContain('2024');
    });

    it('should handle ISO string dates', () => {
      const formatted = formatDatePtBR('2024-12-25');
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('toDateKey', () => {
    it('should convert date to YYYY-MM-DD format', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(toDateKey(date)).toBe('2024-01-15');
    });

    it('should handle ISO string input', () => {
      expect(toDateKey('2024-12-25')).toBe('2024-12-25');
    });
  });

  describe('getCurrentDateTimeLocal', () => {
    it('should return datetime in YYYY-MM-DDTHH:MM format', () => {
      const datetime = getCurrentDateTimeLocal();
      expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });
});
