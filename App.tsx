import React, { useState, useCallback, useEffect } from 'react';
import { GameEngine } from './components/GameEngine';
import { LevelEditor } from './components/LevelEditor';
import { LevelData, CharacterType } from './types';
import { INITIAL_LEVEL_GRID, EDITOR_COLS, EDITOR_ROWS } from './constants';
import { generateLevel } from './services/geminiService';
import { parseLevelLayout } from './utils/levelParser';

const App = () => {
  const [mode, setMode] = useState<'editor' | 'play'>('editor');
  const [level, setLevel] = useState<LevelData>({
    width: EDITOR_COLS,
    height: EDITOR_ROWS,
    grid: [...INITIAL_LEVEL_GRID],
    entities: [],
    startPos: { x: 2, y: EDITOR_ROWS - 3 }
  });
  const [selectedChar, setSelectedChar] = useState<CharacterType>(CharacterType.Mario);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      const generated = await generateLevel(prompt.trim());
      if (!generated?.layout) {
        throw new Error('Invalid level data received');
      }
      
      const parsed = parseLevelLayout(generated.layout);
      
      // Ensure parsed data matches editor dimensions
      setLevel({
        width: EDITOR_COLS,
        height: EDITOR_ROWS,
        grid: parsed.grid.slice(0, EDITOR_ROWS * EDITOR_COLS).padEnd(EDITOR_ROWS * EDITOR_COLS, '.'),
        entities: parsed.entities,
        startPos: {
          x: Math.max(0, Math.min(parsed.startPos.x, EDITOR_COLS - 1)),
          y: Math.max(0, Math.min(parsed.startPos.y, EDITOR_ROWS - 1))
        }
      });
    } catch (error) {
      console.error('Level generation failed:', error);
      alert(`Failed to generate level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  }, [prompt]);

  const handlePlay = useCallback(() => {
    setMode('play');
  }, []);

  const handleGameExit = useCallback(() => {
    setMode('editor');
  }, []);

  const handleGameWin = useCallback(() => {
    alert("Course Clear!");
    setMode('editor');
  }, []);

  const handleGameDie = useCallback(() => {
    alert("Game Over");
    setMode('editor');
  }, []);

  // Handle Enter key for generate button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !generating && prompt.trim()) {
        handleGenerate();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate, generating, prompt]);

  if (mode === 'play') {
    return (
      <GameEngine
        level={level}
        character={selectedChar}
        onExit={handleGameExit}
        onWin={handleGameWin}
        onDie={handleGameDie}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 flex flex-col items-center">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
        <h1 className="text-4xl md:text-5xl text-white font-retro text-shadow bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
          Mushroom Maker
        </h1>
        <div className="flex items-center gap-4">
          <select
            className="bg-gray-800/50 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-gray-600/50 hover:border-blue-500/50 focus:outline-none focus:border-blue-500/75 transition-all duration-200 font-mono text-sm"
            value={selectedChar}
            onChange={(e) => setSelectedChar(e.target.value as CharacterType)}
            aria-label="Select character"
          >
            {Object.values(CharacterType).map((charValue) => (
              <option key={charValue} value={charValue}>
                {charValue}
              </option>
            ))}
          </select>
          <button
            data-testid="play-button"
            onClick={handlePlay}
            disabled={generating}
            className="group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-xl border-b-4 border-emerald-700 hover:border-emerald-800 disabled:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed active:border-b-2 active:translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            aria-label="Start playing the current level"
          >
            <span className="flex items-center gap-2">
              ▶ PLAY
            </span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl flex flex-col items-center gap-8 flex-1">
        {/* Editor Component */}
        <div className="w-full flex justify-center">
          <LevelEditor level={level} setLevel={setLevel} />
        </div>

        {/* AI Controls */}
        <section className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-700/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
            🎲 AI Level Generator
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="E.g., 'A sky level with many coins, pipes, and flying enemies'"
              className="flex-1 p-4 rounded-xl bg-gray-900/80 text-white border-2 border-gray-700/50 hover:border-gray-600/75 focus:outline-none focus:border-blue-500/75 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 text-lg placeholder-gray-400"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
              aria-label="Level generation prompt"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl border-b-4 border-blue-800 hover:border-blue-900 disabled:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed active:border-b-2 active:translate-y-0.5 transition-all duration-200 shadow-xl hover:shadow-2xl min-w-[140px] flex items-center justify-center gap-2"
              aria-label="Generate new level"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
          <p className="text-blue-400 font-mono text-sm mt-4 opacity-80">
            Powered by Gemini 2.5 Flash • Press Enter to generate
          </p>
        </section>

        {/* Instructions */}
        <aside className="max-w-2xl w-full text-gray-300 bg-gray-900/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700/30 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🎮 Controls
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                {selectedChar} selected • {level.entities.length} entities
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Editor:</strong> Left-Click to Paint, Right-Click to Pan, Scroll to Zoom</li>
                <li><strong>Palette:</strong> Click tiles above editor to select</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Game:</strong> Arrow Keys to Move</li>
                <li><strong>Jump:</strong> 'A' or Spacebar</li>
                <li><strong>Ability:</strong> 'POW' key</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 italic bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
            💡 Tip: Generate a level, then customize it with the editor palette!
          </p>
        </aside>
      </main>
    </div>
  );
};

export default App;
