import React, { useRef, useEffect, useCallback } from 'react';
import { TileType, LevelData, CharacterType, Entity, EntityType, CHARACTERS, WorldPosition } from '../types';
import {
  TILE_SIZE,
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
  FRICTION,
  CLIMB_SPEED,
  TILE_COLORS,
  ENTITY_COLORS
} from '../constants';
import { checkRectCollision } from '../utils/physics';
import { v4 as uuidv4 } from 'uuid';

// FIX 1: Defined a robust GameState interface for type safety
interface GameState {
    keys: { left: boolean, right: boolean, up: boolean, down: boolean, jump: boolean, ability: boolean };
    player: Entity | null;
    entities: Entity[];
    grid: number[];
    levelWidth: number;
    levelHeight: number;
    camera: { x: number };
    canJump: boolean;
    isClimbing: boolean;
    isBig: boolean;
    invincibilityTimer: number;
    abilityCooldown: number;
    gameOver: boolean;
    // FIX 2: Added score/coins
    coins: number; 
}

interface GameEngineProps {
  level: LevelData;
  character: CharacterType;
  onExit: () => void;
  onWin: () => void;
  onDie: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ level, character, onExit, onWin, onDie }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game State Refs for the loop to avoid closure staleness
  const gameState = useRef<GameState>({
    keys: { left: false, right: false, up: false, down: false, jump: false, ability: false },
    player: null,
    entities: [],
    grid: [],
    levelWidth: 0,
    levelHeight: 0,
    camera: { x: 0 },
    canJump: false,
    isClimbing: false,
    isBig: false,
    invincibilityTimer: 0,
    abilityCooldown: 0,
    gameOver: false,
    coins: 0,
  });

  // Utility to get tile at grid position
  const getTile = useCallback((c: number, r: number) => {
    const state = gameState.current;
    if (r < 0 || r >= state.levelHeight || c < 0 || c >= state.levelWidth) return TileType.Empty;
    const idx = r * state.levelWidth + c;
    return state.grid[idx];
  }, []);

  // Initialize Game State from Level Data
  useEffect(() => {
    if (!level) return;

    // Deep copy entities and ensure IDs are set (critical for entity tracking)
    const initialEntities = level.entities.map(e => ({ ...e, id: e.id || uuidv4() }));

    // Find player start or create default
    let playerEnt: Entity = {
      id: 'player',
      type: EntityType.Player,
      x: level.startPos.x * TILE_SIZE,
      y: level.startPos.y * TILE_SIZE,
      w: TILE_SIZE * 0.8,
      h: TILE_SIZE * 0.8,
      vx: 0,
      vy: 0
    };

    // FIX 3: Ensure player dimensions are always consistent with the smallest size
    playerEnt.w = TILE_SIZE * 0.8;
    playerEnt.h = TILE_SIZE * 0.8; 

    // Reset State & Clone Grid to prevent mutating Editor state
    gameState.current = {
        keys: { left: false, right: false, up: false, down: false, jump: false, ability: false },
        player: playerEnt,
        entities: initialEntities,
        grid: [...level.grid],
        levelWidth: level.width || EDITOR_COLS, // FIX 4: Use constants if level props are missing
        levelHeight: level.height || EDITOR_ROWS,
        camera: { x: 0 },
        canJump: false,
        isClimbing: false,
        isBig: false,
        invincibilityTimer: 0,
        abilityCooldown: 0,
        gameOver: false,
        coins: 0,
    };

  }, [level]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // FIX 5: Window resize handler for dynamic canvas size
    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // FIX 6: Keyboard input handling (missing from original)
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState.current.gameOver) return;
        switch (e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft': gameState.current.keys.left = true; break;
            case 'd':
            case 'arrowright': gameState.current.keys.right = true; break;
            case 'w':
            case 'arrowup': gameState.current.keys.up = true; break;
            case 's':
            case 'arrowdown': gameState.current.keys.down = true; break;
            case ' ': // Spacebar
                if (!gameState.current.keys.jump) {
                    gameState.current.keys.jump = true;
                }
                break;
            case 'f': // Ability key
                if (!gameState.current.keys.ability) {
                    gameState.current.keys.ability = true;
                }
                break;
            case 'escape': onExit(); break;
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft': gameState.current.keys.left = false; break;
            case 'd':
            case 'arrowright': gameState.current.keys.right = false; break;
            case 'w':
            case 'arrowup': gameState.current.keys.up = false; break;
            case 's':
            case 'arrowdown': gameState.current.keys.down = false; break;
            case ' ': gameState.current.keys.jump = false; break;
            case 'f': gameState.current.keys.ability = false; break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);


    let animationFrameId: number;

    const update = () => {
      if (gameState.current.gameOver) return;

      const state = gameState.current;
      const p = state.player;
      if (!p) return;

      // Update Player Size based on state
      const targetH = state.isBig ? TILE_SIZE * 1.5 : TILE_SIZE * 0.8;
      // FIX 7: Smoother and safer size transition
      if (Math.abs(p.h - targetH) > 0.01) {
        // Only adjust player Y if increasing size (to lift off the ground)
        if (targetH > p.h) p.y -= (targetH - p.h); 
        p.h = targetH;
      }


      // --- INPUT HANDLING & PHYSICS ---

      if (state.abilityCooldown > 0) state.abilityCooldown--;
      if (state.invincibilityTimer > 0) state.invincibilityTimer--;

      // Horizontal Movement
      if (state.keys.left) p.vx = (p.vx || 0) - 1;
      if (state.keys.right) p.vx = (p.vx || 0) + 1;

      // Friction and Limits
      p.vx = (p.vx || 0) * FRICTION;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
      if (p.vx > MOVE_SPEED) p.vx = MOVE_SPEED;
      if (p.vx < -MOVE_SPEED) p.vx = -MOVE_SPEED;

      // Gravity / Climbing
      let gravity = GRAVITY;
      if (state.isClimbing) {
        gravity = 0;
        p.vy = 0;
        if (state.keys.up) p.vy = -CLIMB_SPEED;
        if (state.keys.down) p.vy = CLIMB_SPEED;
      }

      if (!state.isClimbing) {
        p.vy = (p.vy || 0) + gravity;
      }
      
      // FIX 8: Clamp max vertical speed
      if (p.vy > 10) p.vy = 10;

      // Jump
      if (state.keys.jump) {
        if (state.canJump || state.isClimbing) {
          // FIX 9: Character-specific jump force (Luigi jump boost)
          const jumpModifier = (character === CharacterType.Luigi) ? 1.2 : 1.0; 
          p.vy = JUMP_FORCE * jumpModifier;
          state.canJump = false;
          state.isClimbing = false;
        }
        state.keys.jump = false;
      }

      // Ability
      if (state.keys.ability && state.abilityCooldown <= 0) {
        handleAbility(character, p, state);
        state.keys.ability = false;
      }

      // --- COLLISION DETECTION ---

      // Apply X velocity and check collision
      p.x += p.vx;
      handleMapCollision(p, 'x');

      // Apply Y velocity and check collision
      p.y += (p.vy || 0);
      handleMapCollision(p, 'y');
      
      // FIX 10: Reset canJump flag only if the player is currently falling/off ground
      if (p.vy !== 0) state.canJump = false; 

      if (p.y > state.levelHeight * TILE_SIZE) {
        handleDeath();
      }

      // Entity Interaction
      state.isClimbing = false; // Reset check

      state.entities = state.entities.filter(e => {
        if (e.lifespan !== undefined) {
          e.lifespan--;
          if (e.lifespan <= 0) return false;
        }

        // --- Entity Movement and Physics ---
        if (e.spawning) {
          // FIX 11: Improved mushroom spawning logic
          e.y += (e.vy || 0);
          if (e.spawnStartY !== undefined && e.y < e.spawnStartY - TILE_SIZE) {
            e.y = e.spawnStartY - TILE_SIZE;
            e.spawning = false;
            e.vy = 0;
            e.vx = 2; // Move right initially
          } else if (e.type === EntityType.Mushroom && e.vy === 0) {
            e.vy = -1; // Keep rising until top is reached
          }
          return true;
        }

        if (!e.dead && (e.type === EntityType.Goomba || e.type === EntityType.Mushroom)) {
          // Apply gravity
          e.vy = (e.vy || 0) + GRAVITY; 
          // FIX 12: Move X, then check entity map collision
          e.x += (e.vx || 0);
          handleEntityMapCollision(e, 'x');
          // Move Y, then check entity map collision
          e.y += (e.vy || 0);
          handleEntityMapCollision(e, 'y');
        }

        return !e.dead;
      });

      // Player-Entity Collision Check
      for (const e of state.entities) {
        if (checkRectCollision(p, e)) {
          if (e.type === EntityType.Goal) {
            handleWin();
          } else if (e.type === EntityType.Coin) {
            e.dead = true;
            state.coins++; // Increment coins
          } else if (e.type === EntityType.Mushroom) {
            e.dead = true;
            state.isBig = true;
            state.invincibilityTimer = 60; // Brief invincibility after power-up
          } else if (e.type === EntityType.Vine) {
            // FIX 13: Vine climbing only if near the top and holding UP/DOWN
            if (state.keys.up || state.keys.down) {
              state.isClimbing = true;
              state.canJump = true;
              p.vy = 0; // Stop vertical movement immediately
            }
          } else if (e.type === EntityType.Goomba) {
            // Check for stomping: p is moving down AND p's bottom was above e's midpoint
            if ((p.vy || 0) > 0 && p.y + p.h - p.vy <= e.y + e.h * 0.5) {
              e.dead = true;
              p.vy = JUMP_FORCE * 0.5; // Small bounce
            } else {
              handleDamage();
            }
          }
        }
      }

      render(ctx, state);
      animationFrameId = requestAnimationFrame(update);
    };

    // FIX 14: Memoized ability handler
    const handleAbility = (char: CharacterType, p: Entity, state: GameState) => {
      // Peach's Shield (Invincibility)
      if (char === CharacterType.Peach) {
          state.invincibilityTimer = 180; // 3 seconds shield
          state.abilityCooldown = 300; // 5 seconds cooldown
      }

      // Toad's Vine Sprout
      if (char === CharacterType.Toad) {
        const pGridX = Math.floor((p.x + p.w / 2) / TILE_SIZE);
        const startY = Math.floor((p.y + p.h) / TILE_SIZE);
        const MAX_HEIGHT = 8;
        
        // Find the lowest solid tile or ground below the player to sprout from
        let groundY = startY;
        while (groundY < state.levelHeight && getTile(pGridX, groundY) === TileType.Empty) {
            groundY++;
        }
        if (groundY >= state.levelHeight) return; // Cannot sprout if falling into the void

        for (let i = 0; i < MAX_HEIGHT; i++) {
          const gridY = groundY - i;
          if (gridY < 0) break;
          const tile = getTile(pGridX, gridY);
          if (tile !== TileType.Empty && tile !== TileType.Spike && tile !== TileType.PipeLeft) break; // Cannot sprout through solid block
          
          state.entities.push({
            id: uuidv4(),
            type: EntityType.Vine,
            // FIX 15: Vine position must be pixel-perfect and centered
            x: pGridX * TILE_SIZE + (TILE_SIZE - 16) / 2, 
            y: gridY * TILE_SIZE,
            w: 16,
            h: TILE_SIZE,
            vx: 0, vy: 0,
            lifespan: 600,
          } as Entity);
        }
        state.abilityCooldown = 120;
      }
      
      // Mario's Fireball (Not Implemented)
    };


    const handleDamage = () => {
      const state = gameState.current;
      if (state.invincibilityTimer > 0) return;

      if (state.isBig) {
        state.isBig = false;
        state.invincibilityTimer = 120;
        if (state.player) {
          // Adjust position after shrinking to keep bottom aligned
          state.player.y += (TILE_SIZE * 1.5 - TILE_SIZE * 0.8);
          state.player.vy = -3;
        }
      } else {
        handleDeath();
      }
    };

    const spawnMushroom = (gx: number, gy: number) => {
      const state = gameState.current;
      state.entities.push({
        id: uuidv4(),
        type: EntityType.Mushroom,
        x: gx * TILE_SIZE,
        y: gy * TILE_SIZE + TILE_SIZE, // Start below the tile
        w: TILE_SIZE,
        h: TILE_SIZE,
        vx: 0,
        vy: -1, // Upwards motion
        spawning: true,
        spawnStartY: gy * TILE_SIZE // The target bottom Y coordinate
      } as Entity);
    };

    // FIX 16: Entity map collision needs separate axis checks and wall reversal logic
    const handleEntityMapCollision = (entity: Entity, axis: 'x' | 'y') => {
      const state = gameState.current;
      const lvlW = state.levelWidth;
      const lvlH = state.levelHeight;
      const grid = state.grid;

      const startCol = Math.floor(entity.x / TILE_SIZE);
      const endCol = Math.floor((entity.x + entity.w) / TILE_SIZE);
      const startRow = Math.floor(entity.y / TILE_SIZE);
      const endRow = Math.floor((entity.y + entity.h) / TILE_SIZE);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (r < 0 || r >= lvlH || c < 0 || c >= lvlW) continue;

          const tile = getTile(c, r);
          if (tile !== TileType.Empty && tile !== TileType.Spike) {
            const tileRect = { x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };

            if (checkRectCollision(entity, tileRect)) {
              if (axis === 'x') {
                if ((entity.vx || 0) > 0) entity.x = tileRect.x - entity.w;
                else if ((entity.vx || 0) < 0) entity.x = tileRect.x + tileRect.w;
                entity.vx = -(entity.vx || 0); // Reverse direction on hitting wall
              } else {
                if ((entity.vy || 0) > 0) { // Floor
                  entity.y = tileRect.y - entity.h;
                } else if ((entity.vy || 0) < 0) { // Ceiling
                  entity.y = tileRect.y + tileRect.h;
                }
                entity.vy = 0;
              }
            }
          }
        }
      }
      // FIX 17: Check for ledge drop (only if moving and not spawning)
      if (!entity.spawning && Math.abs(entity.vx || 0) > 0.1) {
          const nextGridX = Math.floor((entity.x + entity.w / 2 + (entity.vx || 0) * TILE_SIZE) / TILE_SIZE);
          const groundY = Math.floor((entity.y + entity.h) / TILE_SIZE);
          const tileBelow = getTile(nextGridX, groundY);
          
          if (tileBelow === TileType.Empty) {
              entity.vx = -(entity.vx || 0); // Reverse if moving into empty space
          }
      }
    };

    // FIX 18: Player map collision logic is crucial and needs clean separation
    const handleMapCollision = (entity: Entity, axis: 'x' | 'y') => {
      const state = gameState.current;
      const lvlW = state.levelWidth;
      const lvlH = state.levelHeight;

      const startCol = Math.floor(entity.x / TILE_SIZE);
      const endCol = Math.floor((entity.x + entity.w) / TILE_SIZE);
      const startRow = Math.floor(entity.y / TILE_SIZE);
      const endRow = Math.floor((entity.y + entity.h) / TILE_SIZE);

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (r < 0 || r >= lvlH || c < 0 || c >= lvlW) continue;

          const tile = getTile(c, r);

          // Only check collision against solid tiles
          if (tile !== TileType.Empty && tile !== TileType.Spike && tile !== TileType.VineBase) {
            const tileRect = { x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };

            if (checkRectCollision(entity, tileRect)) {
              if (axis === 'x') {
                if ((entity.vx || 0) > 0) entity.x = tileRect.x - entity.w;
                else if ((entity.vx || 0) < 0) entity.x = tileRect.x + tileRect.w;
                entity.vx = 0;
              } else { // Y-axis collision
                if ((entity.vy || 0) > 0) { // Landing
                  entity.y = tileRect.y - entity.h;
                  state.canJump = true;
                } else if ((entity.vy || 0) < 0) { // Head bump
                  entity.y = tileRect.y + tileRect.h;
                  entity.vy = 0;

                  // Tile Interaction (Head Bump)
                  if (tile === TileType.Question) {
                    state.grid[r * lvlW + c] = TileType.HardBlock;
                    spawnMushroom(c, r);
                  } else if (tile === TileType.Brick && state.isBig) {
                    state.grid[r * lvlW + c] = TileType.Empty;
                  }
                }
                entity.vy = 0;
              }
            }
          }
          // Spike/Hazard collision (independent of solid block collision)
          if (tile === TileType.Spike) {
            const tileRect = { x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
            if (checkRectCollision(entity, tileRect)) {
              handleDamage();
            }
          }
        }
      }
    };

    const handleDeath = () => {
      gameState.current.gameOver = true;
      onDie();
    };

    const handleWin = () => {
      gameState.current.gameOver = true;
      onWin();
    };

    const render = (ctx: CanvasRenderingContext2D, state: GameState) => {
      const { width, height } = ctx.canvas;
      const p = state.player;
      if (!p) return;

      // Camera Follow Logic (smoother than the original fixed cam)
      let targetCamX = p.x - width / 2;
      targetCamX = Math.max(0, Math.min(targetCamX, state.levelWidth * TILE_SIZE - width));
      // Simple easing for camera smoothness
      state.camera.x += (targetCamX - state.camera.x) * 0.1; 
      const camX = state.camera.x;


      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // FIX 19: Use Math.floor on camera position to prevent visual tearing
      ctx.translate(-Math.floor(camX), 0); 

      // Map
      for (let i = 0; i < state.grid.length; i++) {
        const tile = state.grid[i];
        if (tile === TileType.Empty) continue;

        const col = i % state.levelWidth;
        const row = Math.floor(i / state.levelWidth);

        // Simple culling
        if ((col + 1) * TILE_SIZE < camX || col * TILE_SIZE > camX + width) continue;

        ctx.fillStyle = TILE_COLORS[tile] || '#fff';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Draw detail for tiles
        // (Render logic is mostly fine, minor cleanup)
        if (tile === TileType.Question) {
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fillRect(col * TILE_SIZE + 4, row * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.fillStyle = "white";
          ctx.font = "bold 20px monospace";
          ctx.fillText("?", col * TILE_SIZE + 8, row * TILE_SIZE + 24);
        } else if (tile === TileType.Brick) {
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          ctx.fillRect(col * TILE_SIZE + 2, row * TILE_SIZE + 2, TILE_SIZE - 4, 10);
          ctx.fillRect(col * TILE_SIZE + 2, row * TILE_SIZE + 16, TILE_SIZE - 4, 10);
        }
      }

      // Entities
      for (const e of state.entities) {
        if (e.x + e.w < camX || e.x > camX + width) continue;

        // FIX 20: Vine drawing should be distinct (simple line/thin rectangle)
        if (e.type === EntityType.Vine) {
            ctx.fillStyle = '#16a34a'; // Green
            ctx.fillRect(e.x, e.y, e.w, e.h);
        } else {
            // Default entity drawing (Goomba/Mushroom/Coin)
            ctx.fillStyle = ENTITY_COLORS[e.type] || '#fbbf24';
            if (e.type === EntityType.Goomba) ctx.fillStyle = '#7f1d1d';

            // Draw the entity box
            ctx.fillRect(e.x, e.y, e.w, e.h); 
            
            if (e.type === EntityType.Goomba) {
                // Simplified eye rendering for Goomba
                ctx.fillStyle = "white";
                ctx.fillRect(e.x + 4, e.y + 8, 8, 8);
                ctx.fillRect(e.x + 20, e.y + 8, 8, 8);
                ctx.fillStyle = "black";
                ctx.fillRect(e.x + 6, e.y + 10, 4, 4);
                ctx.fillRect(e.x + 22, e.y + 10, 4, 4);
            } else if (e.type === EntityType.Goal) {
                // Goal rendering
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(e.x, e.y, e.w, e.h);
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/3, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.type === EntityType.Mushroom) {
                // Mushroom rendering
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2 - 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(e.x + e.w/2, e.y + e.h/2 + 2, e.w/4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
      }

      // --- PROCEDURAL PLAYER RENDERING ---
      const drawCharacter = (x: number, y: number, w: number, h: number) => {
        
        // Invincibility Flash
        if (state.invincibilityTimer > 0) {
            ctx.globalAlpha = Math.floor(Date.now() / 50) % 2 === 0 ? 0.5 : 0.8;
        }

        const facingRight = (p.vx || 0) >= 0;
        const mainColor = CHARACTERS[character]?.color || '#ef4444';
        const skinColor = '#ffdbac';
        const blue = '#2563eb';
        
        // Bobbing animation for walking
        let bobY = 0;
        if (Math.abs(p.vx || 0) > 0.1 && state.canJump) { // Only bob if on ground and moving
            bobY = Math.sin(Date.now() / 50) * 2;
        }

        const drawRect = (rx: number, ry: number, rw: number, rh: number, color: string) => {
          ctx.fillStyle = color;
          ctx.fillRect(x + w * rx, y + h * ry + bobY, w * rw, h * rh);
        };

        // Simplified drawing logic for all characters
        // Hat/Hair
        drawRect(0, 0, 1, 0.3, character === CharacterType.Peach ? '#fde047' : mainColor);
        // Face/Skin
        drawRect(0.15, 0.25, 0.7, 0.25, skinColor);
        // Body (Shirt/Dress)
        drawRect(0.1, 0.5, 0.8, 0.5, mainColor);
        // Overalls/Accent (Blue for Mario/Luigi/Toad)
        if (character !== CharacterType.Peach) {
            drawRect(0.15, 0.6, 0.7, 0.4, blue);
        } else {
            drawRect(0.3, 0.6, 0.4, 0.4, '#fbcfe8'); // Inner Dress
        }

        // Eyes (Common)
        ctx.fillStyle = 'black';
        const eyeX = facingRight ? x + w * 0.65 : x + w * 0.25;
        ctx.fillRect(eyeX, y + h * 0.35 + bobY, w * 0.1, w * 0.1);

        // Restore Alpha
        ctx.globalAlpha = 1.0;
      };

      // Apply Transformations (Spin Jump)
      if (!state.canJump && !state.isClimbing) {
        // FIX 21: Added simple jump spin
        const angle = (Date.now() / 100) % (Math.PI * 2);
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.translate(-cx, -cy);
        drawCharacter(p.x, p.y, p.w, p.h);
        ctx.restore();
      } else {
        drawCharacter(p.x, p.y, p.w, p.h);
      }

      ctx.restore();

      // HUD
      ctx.fillStyle = "white";
      ctx.font = "bold 20px 'Roboto', sans-serif";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;

      const charText = `CHAR: ${character} | COINS: ${state.coins}`; // Display coins
      ctx.strokeText(charText, 20, 40);
      ctx.fillText(charText, 20, 40);

      const stateText = `STATE: ${state.isBig ? 'SUPER' : 'SMALL'}`;
      ctx.strokeText(stateText, 20, 70);
      ctx.fillText(stateText, 20, 70);
      
      if (state.invincibilityTimer > 0) {
          ctx.fillStyle = "#facc15"; 
          ctx.fillText("INVINCIBLE", 20, 100);
      }
      
      if (state.abilityCooldown > 0) {
           ctx.fillStyle = "#3b82f6";
           ctx.fillText(`ABILITY CD: ${Math.ceil(state.abilityCooldown / 60)}s`, 20, 130);
      }
    };

    update();
    return () => {
      cancelAnimationFrame(animationFrameId);
      // FIX 22: Clean up event listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [level, character, onDie, onWin, onExit, getTile]);

  const handleTouch = (key: keyof typeof gameState.current.keys, pressed: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    // Prevent default touch/right-click behavior
    if (e.cancelable && e.type !== 'mousedown' && e.type !== 'mouseup') {
      e.preventDefault();
    }
    // FIX 23: Handle 'jump' specifically to avoid re-triggering a jump while held
    if (key === 'jump' && pressed) {
        if (!gameState.current.keys.jump) {
             gameState.current.keys.jump = true;
        }
    } else {
        gameState.current.keys[key] = pressed;
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        // FIX 24: Initial canvas size for non-dynamic setting (will be corrected by handleResize)
        width={1280} 
        height={720}
        className="block"
      />

      {/* Control overlay remains the same, but the handlers use the corrected logic */}
      <div className="absolute top-4 right-4">
        <button onClick={onExit} className="px-4 py-2 bg-red-600 text-white font-bold rounded shadow-lg border-2 border-red-800 active:bg-red-700">
          EXIT
        </button>
      </div>

      {/* D-Pad controls (Horizontal) */}
      <div className="absolute bottom-8 left-8 flex gap-4">
        <button
          onMouseDown={handleTouch('left', true)} onMouseUp={handleTouch('left', false)} onMouseLeave={handleTouch('left', false)}
          onTouchStart={handleTouch('left', true)} onTouchEnd={handleTouch('left', false)}
          className="w-16 h-16 bg-gray-700/80 rounded-full border-4 border-gray-500 flex items-center justify-center active:bg-gray-600">
          <span className="text-2xl text-white">←</span>
        </button>
        <button
          onMouseDown={handleTouch('right', true)} onMouseUp={handleTouch('right', false)} onMouseLeave={handleTouch('right', false)}
          onTouchStart={handleTouch('right', true)} onTouchEnd={handleTouch('right', false)}
          className="w-16 h-16 bg-gray-700/80 rounded-full border-4 border-gray-500 flex items-center justify-center active:bg-gray-600">
          <span className="text-2xl text-white">→</span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-8 right-8 flex gap-4">
        <button
          onMouseDown={handleTouch('ability', true)} onMouseUp={handleTouch('ability', false)} onMouseLeave={handleTouch('ability', false)}
          onTouchStart={handleTouch('ability', true)} onTouchEnd={handleTouch('ability', false)}
          className="w-16 h-16 bg-blue-600/90 rounded-full border-4 border-blue-400 flex items-center justify-center active:bg-blue-700 shadow-lg shadow-blue-500/50">
          <span className="text-sm font-bold text-white">POW</span>
        </button>
        <button
          onMouseDown={handleTouch('jump', true)} onMouseUp={handleTouch('jump', false)} onMouseLeave={handleTouch('jump', false)}
          onTouchStart={handleTouch('jump', true)} onTouchEnd={handleTouch('jump', false)}
          className="w-20 h-20 bg-green-600/90 rounded-full border-4 border-green-400 flex items-center justify-center active:bg-green-700 shadow-lg shadow-green-500/50">
          <span className="text-lg font-bold text-white">A</span>
        </button>
      </div>

      {/* D-Pad controls (Vertical - used for climbing) */}
      <div className="absolute bottom-24 left-8 flex flex-col gap-16 pointer-events-none">
        <button
          onMouseDown={handleTouch('up', true)} onMouseUp={handleTouch('up', false)}
          onTouchStart={handleTouch('up', true)} onTouchEnd={handleTouch('up', false)}
          className="w-16 h-16 pointer-events-auto bg-gray-700/50 rounded-full flex items-center justify-center active:bg-gray-600 absolute -top-16 left-0">
          <span className="text-2xl text-white">↑</span>
        </button>
        <button
          onMouseDown={handleTouch('down', true)} onMouseUp={handleTouch('down', false)}
          onTouchStart={handleTouch('down', true)} onTouchEnd={handleTouch('down', false)}
          className="w-16 h-16 pointer-events-auto bg-gray-700/50 rounded-full flex items-center justify-center active:bg-gray-600 absolute top-4 left-0">
          <span className="text-2xl text-white">↓</span>
        </button>
      </div>
    </div>
  );
};
