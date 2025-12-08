import React, { useRef, useEffect, useState } from 'react';
import { LevelData, TileType, EntityType, Entity } from '../types';
import { TILE_SIZE, TILE_COLORS, ENTITY_COLORS, EDITOR_COLS, EDITOR_ROWS } from '../constants';

interface LevelEditorProps {
  level: LevelData;
  setLevel: (level: LevelData) => void;
}

type Tool = TileType | EntityType | 'erase' | 'start';

export const LevelEditor: React.FC<LevelEditorProps> = ({ level, setLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 20, y: 20, zoom: 1.0 });
  const [selectedTool, setSelectedTool] = useState<Tool>(TileType.Ground);
  const [isPanning, setIsPanning] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Draw Grid Lines (Optional, faint)
    ctx.beginPath();
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
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
      
      ctx.fillStyle = TILE_COLORS[tile] || '#ff00ff';
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    // Draw Entities
    level.entities.forEach(e => {
      ctx.fillStyle = ENTITY_COLORS[e.type] || '#fff';
      if (e.type === EntityType.Goal) ctx.fillStyle = 'yellow';
      if (e.type === EntityType.Goomba) ctx.fillStyle = '#7f1d1d'; // darker red
      
      ctx.fillRect(e.x, e.y, e.w, e.h);
      
      // Border for visibility
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x, e.y, e.w, e.h);
    });

    // Draw Start Position
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fillRect(level.startPos.x * TILE_SIZE, level.startPos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(level.startPos.x * TILE_SIZE, level.startPos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText('START', level.startPos.x * TILE_SIZE + 2, level.startPos.y * TILE_SIZE + 20);

    // Draw World Border
    ctx.strokeStyle = '#red';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, EDITOR_COLS * TILE_SIZE, EDITOR_ROWS * TILE_SIZE);

    ctx.restore();

  }, [level, camera]);

  const getGridPos = (e: React.MouseEvent | React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { c: -1, r: -1 };
    const rect = canvas.getBoundingClientRect();
    
    // Mouse relative to canvas
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Apply inverse camera transform
    const worldX = (mx - camera.x) / camera.zoom;
    const worldY = (my - camera.y) / camera.zoom;

    const c = Math.floor(worldX / TILE_SIZE);
    const r = Math.floor(worldY / TILE_SIZE);
    return { c, r };
  };

  const handlePaint = (c: number, r: number) => {
    if (c < 0 || c >= EDITOR_COLS || r < 0 || r >= EDITOR_ROWS) return;

    const newLevel = { ...level };
    const idx = r * EDITOR_COLS + c;

    // Handle Start Position Tool
    if (selectedTool === 'start') {
      newLevel.startPos = { x: c, y: r };
      setLevel(newLevel);
      return;
    }

    // Handle Eraser
    if (selectedTool === 'erase') {
      // Erase Tile
      newLevel.grid = [...level.grid];
      newLevel.grid[idx] = TileType.Empty;

      // Erase Entities at this location
      newLevel.entities = level.entities.filter(e => {
        const ec = Math.floor(e.x / TILE_SIZE);
        const er = Math.floor(e.y / TILE_SIZE);
        return ec !== c || er !== r;
      });
      setLevel(newLevel);
      return;
    }

    // Handle Tiles
    if (typeof selectedTool === 'number') { // TileType is enum number
       newLevel.grid = [...level.grid];
       newLevel.grid[idx] = selectedTool;
       // Optional: Clear entities on solid blocks? 
       // Keeping them allows putting coins inside blocks conceptually, though physics might be weird.
       setLevel(newLevel);
       return;
    }

    // Handle Entities
    if (typeof selectedTool === 'string') { // EntityType
      // Check if entity already exists here to prevent stacking
      const existing = level.entities.find(e => {
        const ec = Math.floor(e.x / TILE_SIZE);
        const er = Math.floor(e.y / TILE_SIZE);
        return ec === c && er === r;
      });

      if (!existing) {
        const newEntity: Entity = {
          id: `ent-${performance.now()}`,
          type: selectedTool as EntityType,
          x: c * TILE_SIZE,
          y: r * TILE_SIZE,
          w: TILE_SIZE,
          h: TILE_SIZE,
          vx: 0, 
          vy: 0
        };
        // Special logic for Goal (ensure only one?) - keeping multiple goals is fun though.
        newLevel.entities = [...level.entities, newEntity];
        setLevel(newLevel);
      }
    }
  };

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
    if (isPanning) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
    if (isPainting) {
      const { c, r } = getGridPos(e);
      handlePaint(c, r);
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
    setIsPainting(false);
  };

  const onWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 0.001;
    const newZoom = Math.max(0.5, Math.min(3, camera.zoom - e.deltaY * zoomSpeed));
    setCamera(prev => ({ ...prev, zoom: newZoom }));
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-5xl h-[600px] border-4 border-gray-600 rounded bg-gray-900 shadow-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 p-2 flex flex-wrap gap-2 border-b border-gray-600 items-center justify-center">
        <span className="text-gray-400 text-xs font-bold uppercase mr-2">Tiles:</span>
        <ToolButton label="Gnd" active={selectedTool === TileType.Ground} onClick={() => setSelectedTool(TileType.Ground)} color={TILE_COLORS[TileType.Ground]} />
        <ToolButton label="Brk" active={selectedTool === TileType.Brick} onClick={() => setSelectedTool(TileType.Brick)} color={TILE_COLORS[TileType.Brick]} />
        <ToolButton label="?" active={selectedTool === TileType.Question} onClick={() => setSelectedTool(TileType.Question)} color={TILE_COLORS[TileType.Question]} />
        <ToolButton label="Hard" active={selectedTool === TileType.HardBlock} onClick={() => setSelectedTool(TileType.HardBlock)} color={TILE_COLORS[TileType.HardBlock]} />
        <ToolButton label="Pipe" active={selectedTool === TileType.PipeLeft} onClick={() => setSelectedTool(TileType.PipeLeft)} color={TILE_COLORS[TileType.PipeLeft]} />
        <ToolButton label="Spike" active={selectedTool === TileType.Spike} onClick={() => setSelectedTool(TileType.Spike)} color={TILE_COLORS[TileType.Spike]} />
        
        <div className="w-px h-6 bg-gray-600 mx-2"></div>
        <span className="text-gray-400 text-xs font-bold uppercase mr-2">Entities:</span>
        
        <ToolButton label="Goomba" active={selectedTool === EntityType.Goomba} onClick={() => setSelectedTool(EntityType.Goomba)} color="#7f1d1d" />
        <ToolButton label="Coin" active={selectedTool === EntityType.Coin} onClick={() => setSelectedTool(EntityType.Coin)} color={ENTITY_COLORS.coin || 'gold'} />
        <ToolButton label="Goal" active={selectedTool === EntityType.Goal} onClick={() => setSelectedTool(EntityType.Goal)} color="yellow" />
        <ToolButton label="Start" active={selectedTool === 'start'} onClick={() => setSelectedTool('start')} color="lime" />
        
        <div className="w-px h-6 bg-gray-600 mx-2"></div>
        <ToolButton label="Erase" active={selectedTool === 'erase'} onClick={() => setSelectedTool('erase')} color="gray" />
        
        <div className="flex-1"></div>
        <span className="text-gray-500 text-xs mr-2 hidden sm:inline">Right-Click to Pan • Wheel to Zoom</span>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden cursor-crosshair"
           onContextMenu={(e) => e.preventDefault()}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="absolute top-0 left-0 w-full h-full"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        />
      </div>
    </div>
  );
};

const ToolButton = ({ label, active, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs font-bold rounded border-2 transition-all ${
      active 
        ? 'border-white scale-110 shadow-lg' 
        : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-500'
    }`}
    style={{ backgroundColor: color, color: isLight(color) ? 'black' : 'white' }}
  >
    {label}
  </button>
);

// Simple brightness checker for text color
const isLight = (color: string) => {
  if (color === 'yellow' || color === 'gold' || color === 'lime' || color === '#fbbf24') return true;
  return false;
};
