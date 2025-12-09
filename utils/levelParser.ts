import { TileType, EntityType, Entity } from '../types';
import { EDITOR_COLS, EDITOR_ROWS, TILE_SIZE } from '../constants';
import { v4 as uuidv4 } from 'uuid'; // FIX 1: Import a UUID generator

// FIX 2: Ensure all required Entity properties (width, height, health) are included
export interface ParsedLevel {
  grid: TileType[]; // FIX 3: Use TileType enum for type safety
  entities: Entity[];
  startPos: { x: number; y: number };
  levelVersion: string; // FIX 4: Added version for consistency
}

// FIX 5: Utility function to generate a player entity skeleton
const createPlayerEntity = (c: number, r: number) => ({
  id: uuidv4(), // Placeholder, ID will be finalized on game start
  type: EntityType.Player,
  // FIX 6: Start position must be converted to world coordinates here
  x: c * TILE_SIZE,
  y: r * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 2, // Player is usually 2 tiles high
  vx: 0,
  vy: 0,
});

export const parseLevelLayout = (layoutString: string): ParsedLevel => {
  // FIX 7: Use TileType.Empty explicitly for type safety
  const grid: TileType[] = new Array(EDITOR_COLS * EDITOR_ROWS).fill(TileType.Empty);
  const entities: Entity[] = [];
  // FIX 8: Default start position should be converted to world coordinates immediately
  let startPos = { x: 2 * TILE_SIZE, y: 10 * TILE_SIZE }; 
  
  // FIX 9: A placeholder Player entity is needed to track the starting position.
  let playerEntityPlaceholder = createPlayerEntity(2, 10);
  
  // Normalize line endings and split
  const lines = layoutString.trim().replace(/\r\n/g, '\n').split('\n');

  lines.forEach((line: string, r: number) => {
    if (r >= EDITOR_ROWS) return;

    for (let c = 0; c < Math.min(line.length, EDITOR_COLS); c++) {
      const char = line[c];
      const idx = r * EDITOR_COLS + c;

      switch (char) {
        case '#':
          grid[idx] = TileType.Ground;
          break;
        case 'B':
          grid[idx] = TileType.Brick;
          break;
        case 'H': // FIX 10: Added HardBlock mapping
          grid[idx] = TileType.HardBlock;
          break;
        case '?':
          grid[idx] = TileType.Question;
          break;
        case 'P':
          grid[idx] = TileType.PipeLeft;
          break;
        case '^':
          grid[idx] = TileType.Spike;
          break;
        case 'V': // FIX 10: Added VineBase mapping
          grid[idx] = TileType.VineBase;
          break;
        case 'C': // FIX 10: Added CoinBlock mapping
          grid[idx] = TileType.CoinBlock;
          break;
        case 'S':
          // FIX 11: Set the world start position and update the player placeholder
          startPos = { x: c * TILE_SIZE, y: r * TILE_SIZE };
          playerEntityPlaceholder = createPlayerEntity(c, r);
          // Don't place a tile here; the player replaces the 'S'
          break;
        case 'G':
          // FIX 12: Goal is a static tile in many games, better to use TileType.Goal
          grid[idx] = TileType.Goal;
          break;
        case 'E':
          // FIX 13: Added missing mandatory properties and a unique ID
          entities.push({
            id: uuidv4(),
            type: EntityType.Goomba,
            x: c * TILE_SIZE,
            y: r * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            vx: -1,
            patrolDirection: -1,
            health: 1,
          } as Entity); // Cast as Entity for type safety check
          break;
        default:
          // '.' or unknown characters remain Empty
          break;
      }
    }
  });

  // FIX 14: Add the player entity placeholder to the entity list
  entities.push(playerEntityPlaceholder as Entity);

  // FIX 15: Added version number
  return { grid, entities, startPos, levelVersion: '1.0.4' };
};
