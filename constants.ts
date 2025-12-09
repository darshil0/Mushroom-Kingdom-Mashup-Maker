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

// FIX 1: Defined standard empty tile value for clarity in color mapping and parser.
export const EMPTY_TILE_ID = 0; 

// ## Tile Colors (TailwindCSS compatible + custom)
export const TILE_COLORS: Record<TileType, string> = {
    [TileType.Empty]: 'transparent',
    [TileType.Ground]: '#8b4513',       // Saddle Brown (authentic dirt)
    [TileType.Brick]: '#d2691e',       // Chocolate (classic brick)
    [TileType.Question]: '#ffd700',      // Gold (question block glow)
    [TileType.HardBlock]: '#696969',    // Dim Gray (indestructible)
    [TileType.PipeLeft]: '#228b22',      // Forest Green (pipe left)
    [TileType.PipeRight]: '#228b22',     // Forest Green (pipe right)
    [TileType.Spike]: '#c0c0c0',         // Silver (sharp spikes)
    [TileType.Goal]: '#00ff00',          // Lime Green (victory flag)
} as const;

// ## Entity Colors
// FIX 2: Standardized keys to use TileType enum or clean strings for better utility
export const ENTITY_COLORS: Record<string, string> = {
    // Power-ups
    [TileType.Mushroom]: '#dc2626',   // Red-600 (Super Mushroom cap) - Using TileType for consistency
    'super-mushroom': '#dc2626',       
    
    // Enemies
    [TileType.Goomba]: '#8b4513',      // Saddle Brown (authentic) - Using TileType for consistency
    'goomba-dead': '#654321',          // Darker brown (squished)
    
    // Environment
    vine: '#32cd32',                   // Lime Green (climbable)
    coin: '#ffd700',                   // Gold (collectible)
    
    // Goal
    goal: '#00ff88',                   // Spring Green (flagpole)
} as const;

// ## Initial Level State
export const INITIAL_LEVEL_GRID: TileType[] = (() => {
    const grid = new Array<TileType>(TOTAL_TILES).fill(TileType.Empty);
    
    // Create solid ground floor (2 tiles high)
    const GROUND_HEIGHT = 2; // FIX 3: Defined height as a constant
    for (let x = 0; x < EDITOR_COLS; x++) {
        // First ground layer (bottom row)
        const groundIndex1 = (EDITOR_ROWS - 1) * EDITOR_COLS + x;
        // Second ground layer (row above bottom)
        const groundIndex2 = (EDITOR_ROWS - GROUND_HEIGHT) * EDITOR_COLS + x; 
        
        grid[groundIndex1] = TileType.Ground;
        grid[groundIndex2] = TileType.Ground;
    }
    
    // Add starting platform with goal
    // The Goal position should be clearly defined, likely at the end of the first 'screen' or section.
    // FIX 4: Moved the goal to the end of the initial ground for a standard level feel
    const GOAL_POSITION_X = EDITOR_COLS - 3; 
    const GOAL_POSITION_Y = EDITOR_ROWS - GROUND_HEIGHT - 1; // 3 rows from bottom
    grid[GOAL_POSITION_Y * EDITOR_COLS + GOAL_POSITION_X] = TileType.Goal;
    
    return grid;
})();

// ## Physics Tweaks (Character-specific)
// FIX 5: Use JUMP_FORCE and MOVE_SPEED from the top constants as defaults for the other characters
export const CHARACTER_PHYSICS: Record<string, Partial<{ JUMP_FORCE: number; MOVE_SPEED: number }>> = {
    Mario: { JUMP_FORCE: JUMP_FORCE, MOVE_SPEED: MOVE_SPEED },
    Luigi: { JUMP_FORCE: JUMP_FORCE * 0.94, MOVE_SPEED: MOVE_SPEED * 0.93 }, // Taller, slower accel (relative values)
    Toad:  { JUMP_FORCE: JUMP_FORCE * 1.06, MOVE_SPEED: MOVE_SPEED * 1.07 }, // Short, fast (relative values)
    Peach: { JUMP_FORCE: JUMP_FORCE * 0.96, MOVE_SPEED: MOVE_SPEED * 0.95 }, // Elegant movement (relative values)
};

// ## Audio Constants
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
