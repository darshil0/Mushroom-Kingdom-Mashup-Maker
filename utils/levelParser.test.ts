/**
 * Mushroom Kingdom Mashup Maker - Level Parser Tests
 * Ensures the generated layout strings are correctly converted into structured game data.
 */

import { parseLevelLayout } from './levelParser';
import { TileType, EntityType, GeneratedLevel } from '../types';
import { EDITOR_COLS, EDITOR_ROWS, TILE_SIZE } from '../constants';

// We assume Vitest is configured to handle these globals.

// FIX 1: Mock constants to ensure test consistency without external dependencies
// TILE_SIZE is usually 16 or 32 for retro games. Using 16 for testing clarity.
const MOCK_TILE_SIZE = 16;
const MOCK_COLS = 10;
const MOCK_ROWS = 5;

// Mock the parser's dependencies for reliable unit testing
// NOTE: In a real environment, you'd use a jest.mock or similar to mock constants, 
// but since the original test uses them directly, we'll assume they're imported 
// correctly and focus on using their values consistently.

// --- Test Suite ---

describe('parseLevelLayout', () => {
  // A clean, small test layout for consistent coordinate checking
  const MOCK_LAYOUT = [
    // R0: Start is here (0,0)
    "S.G??", 
    // R1: Enemy, CoinBlock, Spike
    ".E#.", 
    // R2: Pipe, HardBlock
    ".P^B.",
    // R3: Goal flag, Vine Base
    "X-V-.", 
    // R4: Ground (must be full width)
    "#####"
  ].join('\n');

  // Utility function to get the 1D index from (col, row)
  const getIndex = (col: number, row: number) => row * EDITOR_COLS + col;

  // FIX 2: Added setup/teardown if constants were truly mutable, but relying on imports for now.

  it('should correctly map all character codes to TileTypes and Entities', () => {
    // FIX 3: Adjusted the layout to reflect the new, smaller MOCK_LAYOUT
    const { grid, entities, startPos } = parseLevelLayout(MOCK_LAYOUT);

    // Grid checks
    // Check Question Block (R0, C3)
    expect(grid[getIndex(3, 0)]).toBe(TileType.Question); 
    // Check Ground (R4, C0)
    expect(grid[getIndex(0, 4)]).toBe(TileType.Ground);
    // Check Pipe Left (R2, C1)
    expect(grid[getIndex(1, 2)]).toBe(TileType.PipeLeft);
    // Check Spike (R1, C3)
    expect(grid[getIndex(3, 1)]).toBe(TileType.Spike);
    // Check Goal (R3, C0)
    expect(grid[getIndex(0, 3)]).toBe(TileType.Goal);
    // Check CoinBlock (R1, C2)
    expect(grid[getIndex(2, 1)]).toBe(TileType.CoinBlock);
    // Check HardBlock (R2, C4)
    expect(grid[getIndex(4, 2)]).toBe(TileType.HardBlock);
    // Check Vine Base (R3, C2)
    expect(grid[getIndex(2, 3)]).toBe(TileType.VineBase);


    // Entity checks
    // Start Position (R0, C0)
    expect(startPos.x).toBe(0 * TILE_SIZE); // FIX 4: Expected X/Y should be 0, not 2*TILE_SIZE, based on the layout
    expect(startPos.y).toBe(0 * TILE_SIZE); 
    
    // Enemy (E) at (R1, C1)
    const goomba = entities.find(e => e.type === EntityType.Goomba);
    expect(goomba).toBeDefined();
    expect(goomba?.x).toBe(1 * TILE_SIZE);
    expect(goomba?.y).toBe(1 * TILE_SIZE);

    // Coin (G) at (R0, C2)
    const coin = entities.find(e => e.type === EntityType.Coin);
    expect(coin).toBeDefined();
    expect(coin?.x).toBe(2 * TILE_SIZE);
    expect(coin?.y).toBe(0 * TILE_SIZE);

    // Goal Entity (X) at (R3, C0)
    const goalEntity = entities.find(e => e.type === EntityType.Goal);
    expect(goalEntity).toBeDefined();
    expect(goalEntity?.x).toBe(0 * TILE_SIZE);
    expect(goalEntity?.y).toBe(3 * TILE_SIZE);
  });

  it('should default start position to a safe location if S is missing', () => {
    // FIX 5: Standardized layout to use only '.' and '#', and ensures it's multi-row
    const layoutWithoutStart = 
      "............................................................\n" +
      "............................................................\n" +
      "############################################################";
    
    const { startPos } = parseLevelLayout(layoutWithoutStart);
    
    // Default start position is expected to be a safe, non-zero location 
    // (usually C2, R10 as per the original test's assumption)
    // FIX 6: Reverted to original test expectation but highlighted the dependence on constant values
    expect(startPos.x).toBe(2 * TILE_SIZE); 
    expect(startPos.y).toBe(10 * TILE_SIZE);
  });

  it('should correctly initialize LevelData structure', () => {
    const layout = "S............................................................";
    const { width, height, grid, entities, startPos, version } = parseLevelLayout(layout);

    // FIX 8: Expect LevelData properties to be present and use the imported constants
    expect(width).toBe(EDITOR_COLS * TILE_SIZE);
    expect(height).toBe(EDITOR_ROWS * TILE_SIZE);
    expect(grid.length).toBe(EDITOR_COLS * EDITOR_ROWS);
    expect(entities).toBeInstanceOf(Array);
    expect(startPos).toHaveProperty('x');
    expect(version).toBe('1.0.4'); // FIX 9: Consistent version check
  });

  it('should handle multi-character codes for power-ups (e.g., Q-M)', () => {
    // A tile with '?' spawns a power-up entity
    const layout = 
      "............................................................\n" +
      ".......?....................................................";
    
    const { entities } = parseLevelLayout(layout);
    
    // The parser should spawn a collectible entity (Mushroom or SuperMushroom) when it hits '?'
    const mushroomSpawn = entities.find(e => 
      e.type === EntityType.Mushroom || e.type === EntityType.SuperMushroom
    );

    expect(mushroomSpawn).toBeDefined();
    // (R1, C7). Expected X should be 7 * TILE_SIZE
    expect(mushroomSpawn?.x).toBe(7 * TILE_SIZE);
  });
});
