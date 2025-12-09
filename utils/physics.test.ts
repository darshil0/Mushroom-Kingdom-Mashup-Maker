/**
 * Mushroom Kingdom Mashup Maker - Physics Engine Tests
 * Ensures core physics utilities like collision detection work robustly.
 */

import { checkRectCollision } from './physics';

// FIX 1: Defined a type for the rectangle objects for type safety and clarity
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// We assume Vitest is configured to handle these globals (describe, it, expect).

describe('checkRectCollision', () => {

  // --- Basic Overlap Tests ---

  it('should detect overlapping rectangles', () => {
    const r1: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const r2: Rect = { x: 5, y: 5, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(true);
  });

  it('should return false for non-overlapping rectangles', () => {
    const r1: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const r2: Rect = { x: 20, y: 20, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(false);
  });

  it('should handle completely contained rectangles', () => {
    const r1: Rect = { x: 0, y: 0, w: 20, h: 20 };
    const r2: Rect = { x: 5, y: 5, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(true);
  });

  // --- Edge Case Tests (Boundary Conditions) ---

  it('should return false for touching edges (X-axis)', () => {
    const r1: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const r2: Rect = { x: 10, y: 0, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(false);
  });

  it('should return false for touching edges (Y-axis)', () => {
    const r1: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const r2: Rect = { x: 0, y: 10, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(false);
  });

  it('should return false for touching corners', () => {
    const r1: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const r2: Rect = { x: 10, y: 10, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(false);
  });
  
  // FIX 2: Added a test for the smallest possible overlap (1 unit)
  it('should detect minimal overlap', () => {
    const r1: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const r2: Rect = { x: 9, y: 9, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(true);
  });

  // --- Zero/Negative Dimension Tests ---

  // FIX 3: Added a test for zero width/height, ensuring it doesn't cause errors
  it('should return false if one rectangle has zero width/height', () => {
    const r1: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const r2_zero_w: Rect = { x: 5, y: 5, w: 0, h: 10 };
    const r2_zero_h: Rect = { x: 5, y: 5, w: 10, h: 0 };
    
    expect(checkRectCollision(r1, r2_zero_w)).toBe(false);
    expect(checkRectCollision(r1, r2_zero_h)).toBe(false);
  });
  
  // FIX 4: Added a test for rectangles with negative coordinates (common in world-space)
  it('should handle negative coordinates correctly', () => {
    const r1: Rect = { x: -5, y: -5, w: 10, h: 10 }; // Covers (-5, -5) to (5, 5)
    const r2: Rect = { x: 0, y: 0, w: 10, h: 10 };  // Covers (0, 0) to (10, 10)
    
    expect(checkRectCollision(r1, r2)).toBe(true);
  });
});
