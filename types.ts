export enum TileType {
  Empty = 0,
  Ground = 1,
  Brick = 2,
  Question = 3,
  HardBlock = 4,
  PipeLeft = 5,
  PipeRight = 6,
  Spike = 7,
}

export enum EntityType {
  Player = 'player',
  Goomba = 'goomba',
  Coin = 'coin',
  Goal = 'goal',
  Vine = 'vine',
  Mushroom = 'mushroom',
}

export enum CharacterType {
  Mario = 'Mario',
  Luigi = 'Luigi',
  Toad = 'Toad',
  Peach = 'Peach',
}

export interface Entity {
  id: string;
  type: EntityType;
  x: number; // World coordinates
  y: number;
  w: number;
  h: number;
  vx?: number;
  vy?: number;
  dead?: boolean;
  lifespan?: number; // Frames remaining for temporary entities
  phasable?: boolean; // For ghost dash interaction
  spawning?: boolean; // For spawn animation (rising out of block)
  spawnStartY?: number; // Origin Y for spawn animation
}

export interface LevelData {
  width: number;
  height: number;
  grid: number[]; // 1D array representing 2D grid
  entities: Entity[];
  startPos: { x: number; y: number };
}

export interface GameState {
  isPlaying: boolean;
  score: number;
  lives: number;
  character: CharacterType;
}

export const CHARACTERS = {
  [CharacterType.Mario]: {
    name: 'Mario',
    ability: 'Fire Cyclone',
    desc: 'Unleashes a spiraling fire storm forward.',
    color: '#ef4444', // Red-500
  },
  [CharacterType.Luigi]: {
    name: 'Luigi',
    ability: 'Ghost Dash',
    desc: 'Become intangible and float through obstacles.',
    color: '#22c55e', // Green-500
  },
  [CharacterType.Toad]: {
    name: 'Toad',
    ability: 'Super Sprout',
    desc: 'Instantly grows a platform vine beneath feet.',
    color: '#3b82f6', // Blue-500
  },
  [CharacterType.Peach]: {
    name: 'Peach',
    ability: 'Crystal Barrier',
    desc: 'Shields against next damage instance.',
    color: '#ec4899', // Pink-500
  },
};