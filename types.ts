/**
 * Mushroom Kingdom Mashup Maker - Type Definitions
 * Comprehensive TypeScript types for game entities, levels, characters, and game state
 */

export enum TileType {
  Empty = 0,
  Ground = 1,
  Brick = 2,
  Question = 3,
  HardBlock = 4,
  PipeLeft = 5,
  PipeRight = 6,
  Spike = 7,
  Goal = 8,        // Victory flagpole
  CoinBlock = 9,   // Coin spawn point
  VineBase = 10,   // Vine starting point
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
}

export enum AbilityState {
  Ready = 'ready',
  Active = 'active',
  Cooldown = 'cooldown',
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
  facing: 'left' | 'right';
  onGround: boolean;
  invulnerableUntil?: number; // Timestamp
  spawnStartY?: number;
}

export interface EnemyEntity extends BaseEntity {
  type: EntityType.Goomba | EntityType.GoombaDead;
  patrolRange?: number;
  patrolDirection: 1 | -1;
}

export interface CollectibleEntity extends BaseEntity {
  type: EntityType.Coin | EntityType.Mushroom | EntityType.SuperMushroom;
  collected?: boolean;
  bobOffset?: number; // For floating animation
}

export interface EffectEntity extends BaseEntity {
  type: EntityType.Fireball | EntityType.Shield;
  ownerId: string;
  duration: number;
}

// ## Polymorphic Entity Union
export type Entity = 
  | PlayerEntity 
  | EnemyEntity 
  | CollectibleEntity 
  | EffectEntity;

// ## Level Structure
export interface LevelData {
  width: number;
  height: number;
  grid: TileType[]; // Typed array
  entities: Entity[];
  startPos: { x: number; y: number };
  name?: string;
  description?: string;
  version: string;
}

// ## Game State
export interface GameState {
  phase: GamePhase;
  score: number;
  coins: number;
  lives: number;
  character: CharacterType;
  level: number;
  time: number; // Frames elapsed
  highScore: number;
  maxLives: number;
}

// ## Character Configuration
export interface CharacterConfig {
  name: string;
  ability: string;
  description: string;
  color: string;
  jumpForce: number;
  moveSpeed: number;
  abilityCooldown: number;
  abilityDuration: number;
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
  entities: Partial<Entity>[];
}
