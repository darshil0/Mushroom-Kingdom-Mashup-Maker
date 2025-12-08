import { TileType } from "./types";

export const TILE_SIZE = 32;
export const GRAVITY = 0.5;
export const JUMP_FORCE = -11;
export const MOVE_SPEED = 4;
export const FRICTION = 0.85;
export const CLIMB_SPEED = 3;

export const EDITOR_COLS = 60;
export const EDITOR_ROWS = 15;

export const TILE_COLORS: Record<number, string> = {
  [TileType.Empty]: 'transparent',
  [TileType.Ground]: '#7c2d12', // Brown
  [TileType.Brick]: '#ea580c', // Orange
  [TileType.Question]: '#fbbf24', // Gold
  [TileType.HardBlock]: '#475569', // Slate
  [TileType.PipeLeft]: '#16a34a', // Green
  [TileType.PipeRight]: '#16a34a', // Green
  [TileType.Spike]: '#f3f4f6', // White/Silver
};

export const ENTITY_COLORS: Record<string, string> = {
  vine: '#84cc16', // Lime-500
  mushroom: '#ef4444', // Red-500 (Classic mushroom cap)
};

export const INITIAL_LEVEL_GRID = new Array(EDITOR_COLS * EDITOR_ROWS).fill(TileType.Empty);
// Create floor
for (let x = 0; x < EDITOR_COLS; x++) {
  INITIAL_LEVEL_GRID[(EDITOR_ROWS - 1) * EDITOR_COLS + x] = TileType.Ground;
  INITIAL_LEVEL_GRID[(EDITOR_ROWS - 2) * EDITOR_COLS + x] = TileType.Ground;
}