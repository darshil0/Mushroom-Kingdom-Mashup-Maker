import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LevelData, TileType, EntityType, Entity, WorldPosition } from '../types';
import { TILE_SIZE, TILE_COLORS, ENTITY_COLORS, EDITOR_COLS, EDITOR_ROWS } from '../constants';
// FIX 1: Import uuid for robust ID generation
import { v4 as uuidv4 } from 'uuid'; 

interface LevelEditorProps {
  level: LevelData;
  // FIX 2: Use React's functional update pattern for setLevel
  setLevel: (updateFn: (prev: LevelData) => LevelData) => void;
}

// FIX 3: Centralized the list of tools to use a single source of truth
const ALL_TILE_TYPES = [
  TileType.Ground, TileType.Brick, TileType.Question, TileType.HardBlock, 
  TileType.PipeLeft, TileType.Spike, TileType.CoinBlock, TileType.VineBase // FIX 4: Added missing tile types
];
const ALL_ENTITY_TYPES = [
  EntityType.Goomba, EntityType.Coin, EntityType.SuperMushroom, EntityType.Mushroom // FIX 4: Added SuperMushroom/Mushroom
];
type Tool = TileType | EntityType | 'erase' | 'start' | 'goal'; // FIX 5: Added 'goal' as tool, removing it from entities list

// FIX 6: Defined CameraState interface for clarity
interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

// FIX 7: Defined ToolButtonProps
interface ToolButtonProps {
    label: string;
    active: boolean;
    onClick: () => void;
    color: string;
}

export const LevelEditor: React.FC<LevelEditorProps> = ({ level, setLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<CameraState>({ x: 20, y: 20, zoom: 1.0 });
  const [selectedTool, setSelectedTool] = useState<Tool>(TileType.Ground);
  const [isPanning, setIsPanning] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [hoverPos, setHoverPos] = useState({ c: -1, r: -1 });
  const lastMouse = useRef<WorldPosition>({ x: 0, y: 0 });

  // FIX 8: Memoized getGridPos since it is used in multiple handlers
  const getGridPos = useCallback((e: React.MouseEvent | React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { c: -1, r: -1, mx: 0, my: 0, worldX: 0, worldY: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const worldX = (mx - camera.x) / camera.zoom;
    const worldY = (my - camera.y) / camera.zoom;

    const c = Math.floor(worldX / TILE_SIZE);
    const r = Math.floor(worldY / TILE_SIZE);
    return { c, r, mx, my, worldX, worldY };
  }, [camera]);

  // Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // FIX 9: Encapsulated drawing logic in a function to clean up useEffect
    const draw = () => {
        // Clear background
        ctx.fillStyle = '#1a202c'; // Gray-900
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        
        // Apply Camera Transform
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        // Draw Grid Background
        ctx.fillStyle = '#2d3748'; // Gray-800
        ctx.fillRect(0, 0, EDITOR_COLS * TILE_SIZE, EDITOR_ROWS * TILE_SIZE);

        // Draw Grid Lines
        ctx.beginPath();
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1 / camera.zoom;
        for (let c = 0; c <= EDITOR_COLS; c++) {
          ctx.moveTo(c * TILE_SIZE, 0);
          ctx.lineTo(c * TILE_SIZE, EDITOR_ROWS * TILE_SIZE);
        }
        for (let r = 0; r <= EDITOR_ROWS; r++) {
          ctx.moveTo(0, r * TILE_SIZE);
          ctx.lineTo(EDITOR_COLS * TILE_SIZE, r * TILE_SIZE);
        }
        ctx.stroke();

        // Draw Tiles
        level.grid.forEach((tile, i) => {
          if (tile === TileType.Empty) return;
          const col = i % EDITOR_COLS;
          const row = Math.floor(i / EDITOR_COLS);
          
          // FIX 10: Use lookup for colors, default to error color if not found
          ctx.fillStyle = TILE_COLORS[tile] || '#ff00ff'; 
          ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });

        // Draw Entities
        level.entities.forEach(e => {
            // FIX 11: Used a switch for clear, explicit coloring
            let entityColor = ENTITY_COLORS[e.type] || '#fff';
            
            if (e.type === EntityType.Goal) entityColor = 'yellow';
            if (e.type === EntityType.Goomba) entityColor = '#7f1d1d';
            
            ctx.fillStyle = entityColor;
            
            // FIX 12: Ensure entities have w/h properties
            const w = e.w || TILE_SIZE;
            const h = e.h || TILE_SIZE;
            
            ctx.fillRect(e.x, e.y, w, h);
            
            // Border for visibility
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.strokeRect(e.x, e.y, w, h);
        });

        // Draw Start Position
        const startX = level.startPos.x * TILE_SIZE;
        const startY = level.startPos.y * TILE_SIZE;

        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillRect(startX, startY, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeRect(startX, startY, TILE_SIZE, TILE_SIZE);
        
        ctx.fillStyle = 'white';
        ctx.font = `${10 / camera.zoom}px Arial`;
        ctx.fillText('START', startX, startY - 2);

        // Draw World Border
        ctx.strokeStyle = '#f87171'; // Red-400
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeRect(0, 0, EDITOR_COLS * TILE_SIZE, EDITOR_ROWS * TILE_SIZE);

        // Draw Hover Cursor
        if (hoverPos.c >= 0 && hoverPos.r >= 0 && hoverPos.c < EDITOR_COLS && hoverPos.r < EDITOR_ROWS) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(hoverPos.c * TILE_SIZE, hoverPos.r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2 / camera.zoom;
          ctx.strokeRect(hoverPos.c * TILE_SIZE, hoverPos.r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }

        ctx.restore();
    };

    draw();
    // FIX 13: Added level.grid/level.entities to dependency array (essential for redrawing on level change)
  }, [level, camera, hoverPos]); 

  // FIX 14: Memoized handlePaint function
  const handlePaint = useCallback((c: number, r: number) => {
    if (c < 0 || c >= EDITOR_COLS || r < 0 || r >= EDITOR_ROWS) return;

    const idx = r * EDITOR_COLS + c;

    // Helper to filter entities at the given grid position
    const filterEntities = (entities: Entity[]) => entities.filter(e => {
        const ec = Math.floor(e.x / TILE_SIZE);
        const er = Math.floor(e.y / TILE_SIZE);
        return ec !== c || er !== r;
    });

    setLevel(prevLevel => {
      let newLevel: LevelData = { ...prevLevel, grid: [...prevLevel.grid], entities: [...prevLevel.entities] };

      // Handle Start Position Tool
      if (selectedTool === 'start') {
        newLevel.startPos = { x: c, y: r };
        return newLevel;
      }
      
      // Handle Goal Entity Tool (Goal is treated as a placed entity, not a start position)
      if (selectedTool === 'goal') {
         // Erase any existing entity/tile at this spot first
         newLevel.entities = filterEntities(newLevel.entities);
         newLevel.grid[idx] = TileType.Empty; 

         const goalEntity: Entity = {
            id: uuidv4(), // Use uuid for better ID generation
            type: EntityType.Goal,
            x: c * TILE_SIZE,
            y: r * TILE_SIZE,
            w: TILE_SIZE,
            h: TILE_SIZE,
            vx: 0, vy: 0 // Physics properties must be present
         };
         newLevel.entities = [...newLevel.entities, goalEntity];
         return newLevel;
      }

      // Handle Eraser
      if (selectedTool === 'erase') {
        newLevel.grid[idx] = TileType.Empty;
        newLevel.entities = filterEntities(newLevel.entities);
        return newLevel;
      }

      // Handle Tiles
      if (ALL_TILE_TYPES.includes(selectedTool as TileType)) { 
        newLevel.grid[idx] = selectedTool as TileType;
        // Erase entity at this spot if placing a tile
        newLevel.entities = filterEntities(newLevel.entities); 
        return newLevel;
      }

      // Handle Entities (excluding Goal, which is now 'goal' tool)
      if (ALL_ENTITY_TYPES.includes(selectedTool as EntityType)) {
        // Check if entity already exists here to prevent stacking
        const existing = newLevel.entities.find(e => {
          const ec = Math.floor(e.x / TILE_SIZE);
          const er = Math.floor(e.y / TILE_SIZE);
          return ec === c && er === r;
        });

        if (!existing) {
          const newEntity: Entity = {
            id: uuidv4(), // Use uuid for better ID generation
            type: selectedTool as EntityType,
            x: c * TILE_SIZE,
            y: r * TILE_SIZE,
            w: TILE_SIZE,
            h: TILE_SIZE,
            vx: 0,
            vy: 0,
          } as Entity;
          newLevel.entities = [...newLevel.entities, newEntity];
        }
        return newLevel;
      }

      return prevLevel; // Fallback: return original state if tool is unknown
    });
  }, [selectedTool, setLevel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) { // Right Click - Pan
      setIsPanning(true);
      lastMouse.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0) { // Left Click - Paint
      setIsPainting(true);
      const { c, r } = getGridPos(e);
      handlePaint(c, r);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    // Hover effect
    const { c, r } = getGridPos(e);
    if (c !== hoverPos.c || r !== hoverPos.r) {
      setHoverPos({ c, r });
    }

    if (isPanning) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
    // FIX 15: Added check to prevent painting while panning
    if (isPainting && !isPanning) { 
      // Only paint if the cell has changed since the last paint event
      if (c !== (lastMouse.current.x / TILE_SIZE) || r !== (lastMouse.current.y / TILE_SIZE)) {
        handlePaint(c, r);
        // FIX 16: Update lastMouse for paint throttling (less important for tile editors, but good practice)
        lastMouse.current = { x: c * TILE_SIZE, y: r * TILE_SIZE }; 
      }
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
    setIsPainting(false);
  };

  const onWheel = (e: React.WheelEvent) => {
    // Zoom towards mouse cursor
    const { mx, my, worldX, worldY } = getGridPos(e);
    const zoomSpeed = 0.001;
    const delta = -e.deltaY * zoomSpeed;
    // FIX 17: Clamp zoom level
    const newZoom = Math.max(0.2, Math.min(4.0, camera.zoom + delta)); 

    // Calculate new camera offset to keep worldX, worldY under mx, my
    // mx = worldX * newZoom + newCameraX
    const newCameraX = mx - worldX * newZoom;
    const newCameraY = my - worldY * newZoom;

    setCamera({ x: newCameraX, y: newCameraY, zoom: newZoom });
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-5xl h-[600px] border-4 border-gray-600 rounded bg-gray-900 shadow-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 p-2 flex flex-wrap gap-2 border-b border-gray-600 items-center justify-center">
        <span className="text-gray-400 text-xs font-bold uppercase mr-2">Tiles:</span>
        {ALL_TILE_TYPES.map(tile => (
            <ToolButton 
                key={tile}
                label={TileType[tile].replace('Left', '')} // Display name
                active={selectedTool === tile} 
                onClick={() => setSelectedTool(tile)} 
                color={TILE_COLORS[tile]} 
            />
        ))}
        
        <div className="w-px h-6 bg-gray-600 mx-2"></div>
        <span className="text-gray-400 text-xs font-bold uppercase mr-2">Entities:</span>
        
        {/* FIX 18: Render Goal and Start separately as they are special tools */}
        <ToolButton label="Start" active={selectedTool === 'start'} onClick={() => setSelectedTool('start')} color="lime" />
        <ToolButton label="Goal" active={selectedTool === 'goal'} onClick={() => setSelectedTool('goal')} color="yellow" />
