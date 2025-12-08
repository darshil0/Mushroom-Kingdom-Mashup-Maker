import { parseLevelLayout } from './levelParser';
import { TileType, EntityType } from '../types';
import { EDITOR_COLS, EDITOR_ROWS, TILE_SIZE } from '../constants';

declare const describe: any;
declare const it: any;
declare const expect: any;

describe('parseLevelLayout', () => {
  it('should parse a simple layout correctly', () => {
    // Create a mock layout string. 
    // We'll make it small, but the parser expects EDITOR_COLS/ROWS.
    // The parser handles lines shorter than EDITOR_COLS gracefully.
    const layout = 
      "S...........................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "............................................................\n" +
      "E..........................G................................\n" +
      "############################################################";

    const { grid, entities, startPos } = parseLevelLayout(layout);

    // Check Start Position
    expect(startPos.x).toBe(0);
    expect(startPos.y).toBe(0);

    // Check Ground (Last row, first column)
    const groundIdx = (EDITOR_ROWS - 1) * EDITOR_COLS + 0;
    expect(grid[groundIdx]).toBe(TileType.Ground);

    // Check Entities
    const goomba = entities.find(e => e.type === EntityType.Goomba);
    expect(goomba).toBeDefined();
    // E is at row 13, col 0
    expect(goomba?.y).toBe(13 * TILE_SIZE);

    const goal = entities.find(e => e.type === EntityType.Goal);
    expect(goal).toBeDefined();
  });

  it('should default start position if S is missing', () => {
    const layout = "............................................................";
    const { startPos } = parseLevelLayout(layout);
    expect(startPos.x).toBe(2);
    expect(startPos.y).toBe(10);
  });

  it('should handle special tiles', () => {
    const layout = 
      "............................................................\n" +
      "?BP^........................................................"; 
    
    const { grid } = parseLevelLayout(layout);
    const rowOffset = 1 * EDITOR_COLS;
    
    expect(grid[rowOffset + 0]).toBe(TileType.Question);
    expect(grid[rowOffset + 1]).toBe(TileType.Brick);
    expect(grid[rowOffset + 2]).toBe(TileType.PipeLeft);
    expect(grid[rowOffset + 3]).toBe(TileType.Spike);
  });
});
