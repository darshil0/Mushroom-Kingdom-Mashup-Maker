export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// FIX 1: Defined CollisionSide type for robust physics response
export type CollisionSide = 'top' | 'bottom' | 'left' | 'right' | 'none';

/**
 * Checks for Axis-Aligned Bounding Box (AABB) collision between two rectangles.
 * @param r1 First rectangle
 * @param r2 Second rectangle
 * @returns true if they overlap, false otherwise
 */
export const checkRectCollision = (r1: Rect, r2: Rect): boolean => {
  return (
    // Check if r1's left edge is less than r2's right edge
    r1.x < r2.x + r2.w &&
    // Check if r1's right edge is greater than r2's left edge
    r1.x + r1.w > r2.x &&
    // Check if r1's top edge is less than r2's bottom edge
    r1.y < r2.y + r2.h &&
    // Check if r1's bottom edge is greater than r2's top edge
    r1.y + r1.h > r2.y
  );
};

// --- Added Function for Collision Resolution ---

/**
 * Determines the primary side of collision for r1 against r2.
 * This is crucial for physics resolution (e.g., preventing overlap).
 * NOTE: This is an approximation and works best when one object moves into a static one.
 * It determines which axis has the least penetration (Minimum Translation Vector).
 * * @param r1 The moving rectangle (e.g., Player)
 * @param r2 The static rectangle (e.g., Tile)
 * @returns The side of r1 that collided with r2 ('top', 'bottom', 'left', 'right', or 'none').
 */
export const getCollisionSide = (r1: Rect, r2: Rect): CollisionSide => {
  if (!checkRectCollision(r1, r2)) {
    return 'none';
  }

  // Calculate the distance needed to resolve the collision on each axis
  const overlapX = Math.min(r1.x + r1.w - r2.x, r2.x + r2.w - r1.x);
  const overlapY = Math.min(r1.y + r1.h - r2.y, r2.y + r2.h - r1.y);

  // The collision occurred on the axis with the MINIMUM overlap (Minimum Translation Vector)
  if (overlapX < overlapY) {
    // X-axis collision (left or right side of r1)
    if (r1.x + r1.w > r2.x && r1.x < r2.x) {
      // r1's right side hit r2's left side
      return 'right';
    } else {
      // r1's left side hit r2's right side
      return 'left';
    }
  } else {
    // Y-axis collision (top or bottom side of r1)
    if (r1.y + r1.h > r2.y && r1.y < r2.y) {
      // r1's bottom side hit r2's top side (landing on ground)
      return 'bottom';
    } else {
      // r1's top side hit r2's bottom side (hitting block from underneath)
      return 'top';
    }
  }
};
