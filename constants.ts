/**
 * Core game constants and configuration for Mushroom Kingdom Mashup Maker
 * Defines physics, dimensions, colors, and initial level state
 */

import { TileType } from "./types";

// ## Physics Constants (tuned for 60fps)
// Pixels per frame calculations for smooth gameplay
export const TILE_SIZE = 32;
export const GRAVITY = 0.5;
export const JUMP_FORCE = -11.5;
export const MOVE_SPEED = 4.2;
export const FRICTION = 0.84;
export const CLIMB_SPEED = 3.2;

// ## Editor Dimensions
export const EDITOR_COLS = 60;
export const EDITOR_ROWS = 15;
export const TOTAL_TILES = EDITOR_COLS * EDITOR_ROWS;

// ## Tile Colors (TailwindCSS compatible + custom)
export const TILE_COLORS: Record<TileType, string> = {
  [TileType.Empty]: 'transparent',
  [TileType.Ground]: '#8b4513',        // Saddle Brown (authentic dirt)
  [TileType.Brick]: '#d2691e',         // Chocolate (classic brick)
  [TileType.Question]: '#ffd700',      // Gold (question block glow)
  [TileType.HardBlock]: '#696969',     // Dim Gray (indestructible)
  [TileType.PipeLeft]: '#228b22',      // Forest Green (pipe left)
  [TileType.PipeRight]: '#228b22',     // Forest Green (pipe right)
  [TileType.Spike]: '#c0c0c0',         // Silver (sharp spikes)
  [TileType.Goal]: '#00ff00',          // Lime Green (victory flag)
} as const;

// ## Entity Colors
export const ENTITY_COLORS: Record<string, string> = {
  // Power-ups
  mushroom: '#dc2626',     // Red-600 (Super Mushroom cap)
  'super-mushroom': '#dc2626', // Red-600
  
  // Enemies
  goomba: '#8b4513',       // Saddle Brown (authentic)
  'goomba-dead': '#654321', // Darker brown (squished)
  
  // Environment
  vine: '#32cd32',         // Lime Green (climbable)
  coin: '#ffd700',         // Gold (collectible)
  
  // Goal
  goal: '#00ff88',         // Spring Green (flagpole)
} as const;

// ## Level Generation
export const INITIAL_LEVEL_GRID: TileType[] = (() => {
  const grid = new Array<TileType>(TOTAL_TILES).fill(TileType.Empty);
  
  // Create solid ground floor (2 tiles high)
  for (let x = 0; x < EDITOR_COLS; x++) {
    const groundIndex1 = (EDITOR_ROWS - 1) * EDITOR_COLS + x;
    const groundIndex2 = (EDITOR_ROWS - 2) * EDITOR_COLS + x;
    
    grid[groundIndex1] = TileType.Ground;
    grid[groundIndex2] = TileType.Ground;
  }
  
  // Add starting platform with goal
  grid[(EDITOR_ROWS - 3) * EDITOR_COLS + EDITOR_COLS - 3] = TileType.Goal;
  
  return grid;
})();

// ## Physics Tweaks (Character-specific)
export const CHARACTER_PHYSICS: Record<string, Partial<typeof GRAVITY>> = {
  Mario: { JUMP_FORCE: -11.5, MOVE_SPEED: 4.2 },
  Luigi: { JUMP_FORCE: -10.8, MOVE_SPEED: 3.9 }, // Taller, slower accel
  Toad:  { JUMP_FORCE: -12.2, MOVE_SPEED: 4.5 }, // Short, fast
  Peach: { JUMP_FORCE: -11.0, MOVE_SPEED: 4.0 }, // Elegant movement
};

// ## Audio Constants (for future implementation)
export const AUDIO_CONFIG = {
  VOLUME_SFX: 0.7,
  VOLUME_MUSIC: 0.4,
  SFX_DELAY: 50, // ms
} as const;

// ## Canvas Performance
export const CANVAS_CONFIG = {
  TARGET_FPS: 60,
  MAX_SKIP_FRAMES: 3,
  SMOOTHING: false,
} as const;
