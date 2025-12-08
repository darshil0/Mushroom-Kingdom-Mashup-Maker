import { TileType, EntityType, Entity } from '../types';
import { EDITOR_COLS, EDITOR_ROWS, TILE_SIZE } from '../constants';

export interface ParsedLevel {
  grid: number[];
  entities: Entity[];
  startPos: { x: number; y: number };
}

export const parseLevelLayout = (layoutString: string): ParsedLevel => {
  const grid = new Array(EDITOR_COLS * EDITOR_ROWS).fill(TileType.Empty);
  const entities: Entity[] = [];
  let startPos = { x: 2, y: 10 }; // Default safe start

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
        case '?':
          grid[idx] = TileType.Question;
          break;
        case 'P':
          grid[idx] = TileType.PipeLeft; // Simplified: Left side of pipe usually implies the whole pipe in 1-char representation
          // In a more complex parser, we might look ahead for the right side
          break;
        case '^':
          grid[idx] = TileType.Spike;
          break;
        case 'S':
          startPos = { x: c, y: r };
          break;
        case 'G':
          entities.push({
            id: `goal`,
            type: EntityType.Goal,
            x: c * TILE_SIZE,
            y: r * TILE_SIZE,
            w: TILE_SIZE,
            h: TILE_SIZE
          });
          break;
        case 'E':
          entities.push({
            id: `e-${r}-${c}`,
            type: EntityType.Goomba,
            x: c * TILE_SIZE,
            y: r * TILE_SIZE,
            w: TILE_SIZE,
            h: TILE_SIZE,
            vx: -1
          });
          break;
        default:
          // '.' or unknown characters remain Empty
          break;
      }
    }
  });

  return { grid, entities, startPos };
};
