/**
 * Mushroom Kingdom Mashup Maker - Type Definitions
 * Comprehensive TypeScript types for game entities, levels, characters, and game state
 */

// FIX 1: Added missing TileType entry for Mushroom and Goomba for consistent level parsing
export enum TileType {
  Empty = 0,
  Ground = 1,
  Brick = 2,
  Question = 3,
  HardBlock = 4,
  PipeLeft = 5,
  PipeRight = 6,
  Spike = 7,
  Goal = 8,          // Victory flagpole
  CoinBlock = 9,     // Coin spawn point
  VineBase = 10,     // Vine starting point
  Mushroom = 11,     // Mushroom spawn point (used by AI)
  Goomba = 12,       // Goomba spawn point (used by AI)
}

export enum EntityType {
  // Player
  Player = 'player',
  
  // Enemies
  Goomba = 'goomba',
  GoombaDead = 'goomba-dead',
  
  // Collectibles
  Coin = 'coin',
  Mushroom = 'mushroom',
  SuperMushroom = 'super-mushroom',
  
  // Interactive
  Goal = 'goal',
  Vine = 'vine',
  VineSegment = 'vine-segment',
  
  // Effects
  Fireball = 'fireball',
  Shield = 'shield',
  // FIX 2: Added VineGrowth for Toad's ability effect
  VineGrowth = 'vine-growth', 
}

export enum CharacterType {
  Mario = 'Mario',
  Luigi = 'Luigi',
  Toad = 'Toad',
  Peach = 'Peach',
}

export enum PowerUpState {
  Small = 'small',
  Big = 'big',
  Invincible = 'invincible',
}

export enum GamePhase {
  Editor = 'editor',
  Playing = 'playing',
  Paused = 'paused',
  Won = 'won',
  GameOver = 'gameover',
  // FIX 3: Added Loading for AI generation phase
  Loading = 'loading', 
}

export enum AbilityState {
  Ready = 'ready',
  Active = 'active',
  Cooldown = 'cooldown',
  // FIX 4: Added Charging/Casting state for abilities with wind-up time
  Casting = 'casting', 
}

// ## Core Game Entities

export interface BaseEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx?: number;
  vy?: number;
  dead?: boolean;
  lifespan?: number;
}

export interface PlayerEntity extends BaseEntity {
  type: EntityType.Player;
  character: CharacterType;
  powerUp: PowerUpState;
  abilityState: AbilityState;
  // FIX 5: Standardized facing property to a more robust enum
  facing: 'left' | 'right'; 
  onGround: boolean;
  invulnerableUntil?: number; // Timestamp
  spawnStartY?: number;
  // FIX 6: Added maxAbilityDuration and abilityTimer for tracking active ability time
  abilityTimer?: number; 
  abilityCooldownUntil?: number; // Timestamp for when cooldown ends
}

export interface EnemyEntity extends BaseEntity {
  type: EntityType.Goomba | EntityType.GoombaDead;
  patrolRange?: number;
  patrolDirection: 1 | -1;
  // FIX 7: Explicitly defined Goomba's health to 1 for clarity
  health: 1; 
}

export interface CollectibleEntity extends BaseEntity {
  type: EntityType.Coin | EntityType.Mushroom | EntityType.SuperMushroom;
  collected?: boolean;
  bobOffset?: number; // For floating animation
}

export interface EffectEntity extends BaseEntity {
  type: EntityType.Fireball | EntityType.Shield | EntityType.VineGrowth; // FIX 2: Added VineGrowth
  ownerId: string;
  duration: number; // Duration remaining in milliseconds or frames
}

// ## Polymorphic Entity Union
export type Entity = 
  | PlayerEntity 
  | EnemyEntity 
  | CollectibleEntity 
  | EffectEntity;

// ## Level Structure
export interface LevelData {
  // FIX 8: Use tile-based dimensions for level integrity
  widthInTiles: number; 
  heightInTiles: number; 
  grid: TileType[]; // Typed array
  entities: Entity[];
  startPos: { x: number; y: number };
  name?: string;
  description?: string;
  version: string;
  // FIX 9: Added difficulty field for AI context
  difficulty?: 'easy' | 'medium' | 'hard';
}

// ## Game State
export interface GameState {
  phase: GamePhase;
  score: number;
  coins: number;
  lives: number;
  character: CharacterType;
  level: number;
  // FIX 10: Changed 'time' to 'gameTime' for clarity and ensured type is number (frames/ms)
  gameTime: number; 
  highScore: number;
  maxLives: number;
  // FIX 11: Added current character health for non-instant death scenarios
  currentHealth: number; 
}

// ## Character Configuration
export interface CharacterConfig {
  name: string;
  ability: string;
  description: string;
  color: string;
  jumpForce: number;
  moveSpeed: number;
  // FIX 12: Cooldown and duration should be defined in frames or seconds for consistency
  abilityCooldown: number; // in milliseconds (ms)
  abilityDuration: number; // in milliseconds (ms)
  maxHealth: number;
}

export const CHARACTERS: Record<CharacterType, CharacterConfig> = {
  [CharacterType.Mario]: {
    name: 'Mario',
    ability: 'Fire Cyclone',
    description: 'Unleashes spiraling fireballs forward',
    color: '#ef4444',
    jumpForce: -11.5,
    moveSpeed: 4.2,
    abilityCooldown: 3000,
    abilityDuration: 2000,
    maxHealth: 3,
  },
  [CharacterType.Luigi]: {
    name: 'Luigi',
    ability: 'Ghost Dash',
    description: 'Phase through obstacles temporarily',
    color: '#22c55e',
    jumpForce: -10.8,
    moveSpeed: 3.9,
    abilityCooldown: 4000,
    abilityDuration: 1500,
    maxHealth: 3,
  },
  [CharacterType.Toad]: {
    name: 'Toad',
    ability: 'Super Sprout',
    description: 'Grow climbable vines from ground',
    color: '#3b82f6',
    jumpForce: -12.2,
    moveSpeed: 4.5,
    abilityCooldown: 5000,
    abilityDuration: 0, // Instant
    maxHealth: 2,
  },
  [CharacterType.Peach]: {
    name: 'Peach',
    ability: 'Crystal Barrier',
    description: 'Shield against next damage',
    color: '#ec4899',
    jumpForce: -11.0,
    moveSpeed: 4.0,
    abilityCooldown: 6000,
    abilityDuration: 3000,
    maxHealth: 4,
  },
} as const;

// ## Utility Types
export type GridPosition = { col: number; row: number };
export type WorldPosition = { x: number; y: number };

export type CollisionSide = 'top' | 'bottom' | 'left' | 'right' | 'none';

// ## AI Generation Response
export interface GeneratedLevel {
  name: string;
  layout: string;
  description: string;
  // FIX 13: Entities should be a list of *spawn points* with minimal required data
  entities: {
    type: EntityType;
    x: number;
    y: number;
  }[];
  // FIX 14: Added prompt used for better debugging
  prompt: string; 
}
