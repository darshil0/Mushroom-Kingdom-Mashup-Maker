import React, { useRef, useEffect } from 'react';
import { TileType, LevelData, CharacterType, Entity, EntityType, CHARACTERS } from '../types';
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
  const gameState = useRef({
    keys: { left: false, right: false, up: false, down: false, jump: false, ability: false },
    player: null as Entity | null,
    entities: [] as Entity[],
    grid: [] as number[],
    levelWidth: 0,
    levelHeight: 0,
    camera: { x: 0 },
    canJump: false,
    isClimbing: false,
    isBig: false,
    invincibilityTimer: 0,
    abilityCooldown: 0,
    gameOver: false,
  });

  // Initialize Game State from Level Data
  useEffect(() => {
    if (!level) return;

    // Deep copy entities to avoid mutating prop
    const initialEntities = level.entities.map(e => ({ ...e }));

    // Find player start or create default
    let playerEnt = initialEntities.find(e => e.type === EntityType.Player);
    if (!playerEnt) {
      playerEnt = {
        id: 'player',
        type: EntityType.Player,
        x: level.startPos.x * TILE_SIZE,
        y: level.startPos.y * TILE_SIZE,
        w: TILE_SIZE * 0.8,
        h: TILE_SIZE * 0.8,
        vx: 0,
        vy: 0
      };
    } else {
      playerEnt.w = TILE_SIZE * 0.8;
      playerEnt.h = TILE_SIZE * 0.8;
      // Remove from entity list so we handle separately
      const idx = initialEntities.indexOf(playerEnt);
      if (idx > -1) initialEntities.splice(idx, 1);
    }

    // Reset State & Clone Grid to prevent mutating Editor state
    gameState.current.player = playerEnt;
    gameState.current.entities = initialEntities;
    gameState.current.grid = [...level.grid];
    gameState.current.levelWidth = level.width;
    gameState.current.levelHeight = level.height;
    gameState.current.gameOver = false;
    gameState.current.camera.x = 0;
    gameState.current.abilityCooldown = 0;
    gameState.current.isBig = false;
    gameState.current.invincibilityTimer = 0;
    gameState.current.keys = { left: false, right: false, up: false, down: false, jump: false, ability: false };

  }, [level]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (gameState.current.gameOver) return;

      const state = gameState.current;
      const p = state.player;
      if (!p) return;

      // Update Player Size based on state
      const targetH = state.isBig ? TILE_SIZE * 1.5 : TILE_SIZE * 0.8;
      // Smooth growth/shrink
      if (Math.abs(p.h - targetH) > 1) {
        p.y -= (targetH - p.h); // Keep bottom aligned roughly
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

      // Jump
      if (state.keys.jump) {
        if (state.canJump || state.isClimbing) {
          p.vy = JUMP_FORCE;
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

      p.x += p.vx;
      handleMapCollision(p, 'x');

      p.y += (p.vy || 0);
      handleMapCollision(p, 'y');

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

        if (e.spawning) {
          e.y += (e.vy || 0);
          if (e.spawnStartY !== undefined && e.y <= e.spawnStartY - TILE_SIZE) {
            e.y = e.spawnStartY - TILE_SIZE;
            e.spawning = false;
            e.vy = 0;
            e.vx = 2; // Move right initially
          }
          return true;
        }

        if (!e.dead && (e.type === EntityType.Goomba || e.type === EntityType.Mushroom)) {
          e.vy = (e.vy || 0) + GRAVITY;
          e.x += (e.vx || 0);
          e.y += (e.vy || 0);
          handleEntityMapCollision(e);
        }

        return !e.dead;
      });

      for (const e of state.entities) {
        if (checkRectCollision(p, e)) {
          if (e.type === EntityType.Goal) {
            handleWin();
          } else if (e.type === EntityType.Coin) {
            e.dead = true;
          } else if (e.type === EntityType.Mushroom) {
            e.dead = true;
            state.isBig = true;
          } else if (e.type === EntityType.Vine) {
            state.isClimbing = true;
            state.canJump = true;
          } else if (e.type === EntityType.Goomba) {
            if ((p.vy || 0) > 0 && p.y + p.h - (p.vy || 0) <= e.y + e.h * 0.5) {
              e.dead = true;
              p.vy = JUMP_FORCE * 0.5;
            } else {
              handleDamage();
            }
          }
        }
      }

      render(ctx, state);
      animationFrameId = requestAnimationFrame(update);
    };

    const handleDamage = () => {
      const state = gameState.current;
      if (state.invincibilityTimer > 0) return;

      if (state.isBig) {
        state.isBig = false;
        state.invincibilityTimer = 120;
        if (state.player) {
          state.player.vy = -3;
          state.player.y += TILE_SIZE * 0.5; // Shift down slightly when shrinking
        }
      } else {
        handleDeath();
      }
    };

    const spawnMushroom = (gx: number, gy: number) => {
      const state = gameState.current;
      state.entities.push({
        id: `mush-${performance.now()}`,
        type: EntityType.Mushroom,
        x: gx * TILE_SIZE,
        y: gy * TILE_SIZE,
        w: TILE_SIZE,
        h: TILE_SIZE,
        vx: 0,
        vy: -1,
        spawning: true,
        spawnStartY: gy * TILE_SIZE
      });
    };

    const handleEntityMapCollision = (entity: Entity) => {
      const state = gameState.current;
      const lvlW = state.levelWidth;
      const lvlH = state.levelHeight;
      const grid = state.grid;

      const bottomY = Math.floor((entity.y + entity.h) / TILE_SIZE);
      const centerX = Math.floor((entity.x + entity.w / 2) / TILE_SIZE);
      const rightX = Math.floor((entity.x + entity.w) / TILE_SIZE);
      const leftX = Math.floor((entity.x) / TILE_SIZE);
      const centerY = Math.floor((entity.y + entity.h / 2) / TILE_SIZE);

      // Floor
      if (bottomY < lvlH && bottomY >= 0) {
        const tile = grid[bottomY * lvlW + centerX];
        if (tile !== TileType.Empty && tile !== TileType.Spike) {
          entity.y = bottomY * TILE_SIZE - entity.h;
          entity.vy = 0;
        }
      }

      // Walls
      const wallTileRight = grid[centerY * lvlW + rightX];
      if (wallTileRight !== TileType.Empty && wallTileRight !== TileType.Spike) {
        if ((entity.vx || 0) > 0) entity.vx = -(entity.vx || 0);
      }
      const wallTileLeft = grid[centerY * lvlW + leftX];
      if (wallTileLeft !== TileType.Empty && wallTileLeft !== TileType.Spike) {
        if ((entity.vx || 0) < 0) entity.vx = -(entity.vx || 0);
      }
    };

    const handleMapCollision = (entity: Entity, axis: 'x' | 'y') => {
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

          const idx = r * lvlW + c;
          const tile = grid[idx];

          if (tile !== TileType.Empty && tile !== TileType.Spike) {
            const tileRect = { x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };

            if (checkRectCollision(entity, tileRect)) {
              if (axis === 'x') {
                if ((entity.vx || 0) > 0) entity.x = tileRect.x - entity.w;
                else if ((entity.vx || 0) < 0) entity.x = tileRect.x + tileRect.w;
                entity.vx = 0;
              } else {
                if ((entity.vy || 0) > 0) { // Landing
                  entity.y = tileRect.y - entity.h;
                  state.canJump = true;
                } else if ((entity.vy || 0) < 0) { // Head bump
                  entity.y = tileRect.y + tileRect.h;
                  entity.vy = 0;

                  if (tile === TileType.Question) {
                    grid[idx] = TileType.HardBlock;
                    spawnMushroom(c, r);
                  } else if (tile === TileType.Brick && state.isBig) {
                    grid[idx] = TileType.Empty;
                  }
                }
                entity.vy = 0;
              }
            }
          }
          // Spike collision
          if (tile === TileType.Spike) {
            const tileRect = { x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
            if (checkRectCollision(entity, tileRect)) {
              handleDamage();
            }
          }
        }
      }
    };

    const handleAbility = (char: CharacterType, p: Entity, state: any) => {
      if (char === CharacterType.Toad) {
        const sproutX = Math.floor((p.x + p.w / 2) / TILE_SIZE) * TILE_SIZE;
        const startY = Math.floor((p.y + p.h) / TILE_SIZE);
        const MAX_HEIGHT = 8;

        for (let i = 0; i < MAX_HEIGHT; i++) {
          const gridY = startY - i;
          if (gridY < 0) break;
          const gridX = Math.floor(sproutX / TILE_SIZE);
          const tileIndex = gridY * state.levelWidth + gridX;
          if (tileIndex >= 0 && tileIndex < state.grid.length) {
            const tile = state.grid[tileIndex];
            if (tile !== TileType.Empty && tile !== TileType.Spike && tile !== undefined) break;
          }
          state.entities.push({
            id: `vine-${performance.now()}-${i}`,
            type: EntityType.Vine,
            x: sproutX + (TILE_SIZE - 16) / 2,
            y: gridY * TILE_SIZE,
            w: 16,
            h: TILE_SIZE,
            lifespan: 600
          });
        }
        state.abilityCooldown = 120;
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

    const render = (ctx: CanvasRenderingContext2D, state: any) => {
      const { width, height } = ctx.canvas;
      const p = state.player;

      let camX = p.x - width / 2;
      camX = Math.max(0, Math.min(camX, state.levelWidth * TILE_SIZE - width));
      state.camera.x = camX;

      ctx.fillStyle = '#1a202c';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(-Math.floor(camX), 0);

      // Map
      for (let i = 0; i < state.grid.length; i++) {
        const tile = state.grid[i];
        if (tile === TileType.Empty) continue;

        const col = i % state.levelWidth;
        const row = Math.floor(i / state.levelWidth);

        if ((col + 1) * TILE_SIZE < camX || col * TILE_SIZE > camX + width) continue;

        ctx.fillStyle = TILE_COLORS[tile] || '#fff';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        if (tile === TileType.Question) {
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fillRect(col * TILE_SIZE + 4, row * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.fillStyle = "white";
          ctx.font = "bold 20px monospace";
          ctx.fillText("?", col * TILE_SIZE + 8, row * TILE_SIZE + 24);
        }
        if (tile === TileType.Brick) {
           ctx.fillStyle = "rgba(0,0,0,0.1)";
           ctx.fillRect(col * TILE_SIZE + 2, row * TILE_SIZE + 2, TILE_SIZE - 4, 10);
           ctx.fillRect(col * TILE_SIZE + 2, row * TILE_SIZE + 16, TILE_SIZE - 4, 10);
        }
      }

      // Entities
      for (const e of state.entities) {
        if (e.x + e.w < camX || e.x > camX + width) continue;

        ctx.fillStyle = ENTITY_COLORS[e.type] || '#fbbf24';
        if (e.type === EntityType.Goomba) {
          ctx.fillStyle = '#7f1d1d';
          // Draw angry eyes
          ctx.fillRect(e.x, e.y, e.w, e.h);
          ctx.fillStyle = "white";
          ctx.fillRect(e.x + 4, e.y + 8, 8, 8);
          ctx.fillRect(e.x + 20, e.y + 8, 8, 8);
          ctx.fillStyle = "black";
          ctx.fillRect(e.x + 6, e.y + 10, 4, 4);
          ctx.fillRect(e.x + 22, e.y + 10, 4, 4);
        } else if (e.type === EntityType.Goal) {
           ctx.fillStyle = '#fbbf24';
           ctx.fillRect(e.x, e.y, e.w, e.h);
           ctx.fillStyle = "red";
           ctx.beginPath();
           ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/3, 0, Math.PI * 2);
           ctx.fill();
        } else if (e.type === EntityType.Mushroom) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2 - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2 + 2, e.w/4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(e.x, e.y, e.w, e.h);
        }
      }

      // --- PROCEDURAL PLAYER RENDERING ---
      const drawCharacter = (x: number, y: number, w: number, h: number) => {
        // Invincibility Flash
        if (state.invincibilityTimer > 0) {
           if (Math.floor(Date.now() / 50) % 2 === 0) {
             ctx.globalAlpha = 0.5;
           } else {
             ctx.globalAlpha = 0.8;
           }
        }

        const facingRight = (p.vx || 0) >= 0;
        const mainColor = CHARACTERS[character]?.color || '#ef4444';
        const skinColor = '#ffdbac';
        const blue = '#2563eb';
        
        // Bobbing animation for walking
        let bobY = 0;
        if (Math.abs(p.vx || 0) > 0.1 && !state.canJump === false) {
           bobY = Math.sin(Date.now() / 50) * 2;
        }

        const drawRect = (rx: number, ry: number, rw: number, rh: number, color: string) => {
          ctx.fillStyle = color;
          ctx.fillRect(x + w * rx, y + h * ry + bobY, w * rw, h * rh);
        };

        if (character === CharacterType.Toad) {
           // Cap
           drawRect(0, 0, 1, 0.45, 'white');
           drawRect(0.2, 0.1, 0.6, 0.2, mainColor); // Spots
           // Face
           drawRect(0.15, 0.45, 0.7, 0.25, skinColor);
           // Vest
           drawRect(0.2, 0.7, 0.6, 0.3, blue);
        } else if (character === CharacterType.Peach) {
           // Crown
           drawRect(0.35, -0.1, 0.3, 0.2, 'gold');
           // Hair
           drawRect(0.1, 0.1, 0.8, 0.3, '#fde047');
           // Face
           drawRect(0.25, 0.25, 0.5, 0.2, skinColor);
           // Dress
           drawRect(0.1, 0.45, 0.8, 0.55, mainColor);
           drawRect(0.3, 0.45, 0.4, 0.55, '#fbcfe8'); // Inner Dress
        } else {
           // Mario & Luigi
           // Hat
           drawRect(0, 0, 1, 0.2, mainColor);
           drawRect(facingRight ? 0.2 : 0, 0.2, 0.8, 0.1, mainColor); // Brim
           
           // Face & Ears
           drawRect(0.1, 0.2, 0.8, 0.3, skinColor);
           
           // Mustache
           ctx.fillStyle = 'black';
           const mX = facingRight ? x + w * 0.5 : x + w * 0.2;
           ctx.fillRect(mX, y + h * 0.35 + bobY, w * 0.3, h * 0.08);

           // Overalls
           drawRect(0.15, 0.5, 0.7, 0.5, blue);
           // Shirt/Arms
           drawRect(facingRight ? 0.4 : 0.1, 0.5, 0.3, 0.25, mainColor);
           
           // Buttons
           ctx.fillStyle = 'gold';
           if (facingRight) {
             ctx.fillRect(x + w * 0.6, y + h * 0.6 + bobY, w*0.1, w*0.1);
           } else {
             ctx.fillRect(x + w * 0.3, y + h * 0.6 + bobY, w*0.1, w*0.1);
           }
        }

        // Eyes (Common)
        ctx.fillStyle = 'black';
        const eyeX = facingRight ? x + w * 0.7 : x + w * 0.2;
        ctx.fillRect(eyeX, y + h * 0.25 + bobY, w * 0.1, w * 0.15);

        // Restore Alpha
        ctx.globalAlpha = 1.0;
      };

      // Apply Transformations (Spin Jump)
      if (!state.canJump && !state.isClimbing) {
        const spinSpeed = 0.4;
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

      const charText = `CHAR: ${character}`;
      ctx.strokeText(charText, 20, 40);
      ctx.fillText(charText, 20, 40);

      const stateText = `STATE: ${state.isBig ? 'SUPER' : 'SMALL'}`;
      ctx.strokeText(stateText, 20, 70);
      ctx.fillText(stateText, 20, 70);
      
      if (state.invincibilityTimer > 0) {
         ctx.fillStyle = "#facc15"; // Yellow warning
         ctx.fillText("INVINCIBLE", 20, 100);
      }
    };

    update();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [level, character, onDie, onWin]);

  const handleTouch = (key: keyof typeof gameState.current.keys, pressed: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    if (e.cancelable && e.type !== 'mousedown' && e.type !== 'mouseup') {
      e.preventDefault();
    }
    gameState.current.keys[key] = pressed;
  };

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block"
      />

      <div className="absolute top-4 right-4">
        <button onClick={onExit} className="px-4 py-2 bg-red-600 text-white font-bold rounded shadow-lg border-2 border-red-800 active:bg-red-700">
          EXIT
        </button>
      </div>

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
