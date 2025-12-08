import { checkRectCollision } from './physics';

declare const describe: any;
declare const it: any;
declare const expect: any;

describe('checkRectCollision', () => {
  it('should detect overlapping rectangles', () => {
    const r1 = { x: 0, y: 0, w: 10, h: 10 };
    const r2 = { x: 5, y: 5, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(true);
  });

  it('should return false for non-overlapping rectangles', () => {
    const r1 = { x: 0, y: 0, w: 10, h: 10 };
    const r2 = { x: 20, y: 20, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(false);
  });

  it('should return false for touching edges', () => {
    const r1 = { x: 0, y: 0, w: 10, h: 10 };
    const r2 = { x: 10, y: 0, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(false);
  });

  it('should handle completely contained rectangles', () => {
    const r1 = { x: 0, y: 0, w: 20, h: 20 };
    const r2 = { x: 5, y: 5, w: 10, h: 10 };
    expect(checkRectCollision(r1, r2)).toBe(true);
  });
});