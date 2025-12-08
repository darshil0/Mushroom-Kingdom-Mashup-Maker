export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Checks for Axis-Aligned Bounding Box (AABB) collision between two rectangles.
 * @param r1 First rectangle
 * @param r2 Second rectangle
 * @returns true if they overlap, false otherwise
 */
export const checkRectCollision = (r1: Rect, r2: Rect): boolean => {
  return (
    r1.x < r2.x + r2.w &&
    r1.x + r1.w > r2.x &&
    r1.y < r2.y + r2.h &&
    r1.y + r1.h > r2.y
  );
};
