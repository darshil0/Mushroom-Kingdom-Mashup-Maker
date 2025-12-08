import React, { useState } from 'react';
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

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
      const generated = await generateLevel(prompt);
      const parsed = parseLevelLayout(generated.layout);

      setLevel({
        width: EDITOR_COLS,
        height: EDITOR_ROWS,
        grid: parsed.grid,
        entities: parsed.entities,
        startPos: parsed.startPos
      });
    } catch (e) {
      console.error(e);
      alert("Failed to generate level. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (mode === 'play') {
    return (
      <GameEngine
        level={level}
        character={selectedChar}
        onExit={() => setMode('editor')}
        onWin={() => { alert("Course Clear!"); setMode('editor'); }}
        onDie={() => { alert("Game Over"); setMode('editor'); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 p-4 flex flex-col items-center">
      <header className="w-full max-w-5xl flex justify-between items-center mb-4">
        <h1 className="text-2xl text-white font-retro text-shadow">Mushroom Maker</h1>
        <div className="flex gap-2">
          <select
            className="bg-gray-700 text-white px-3 py-1 rounded"
            value={selectedChar}
            onChange={(e) => setSelectedChar(e.target.value as CharacterType)}
          >
            {Object.keys(CharacterType).map((key) => {
              // Map enum keys to values
              const charValue = CharacterType[key as keyof typeof CharacterType];
              return (
                <option key={charValue} value={charValue}>{charValue}</option>
              );
            })}
          </select>
          <button
            data-testid="play-button"
            onClick={() => setMode('play')}
            disabled={generating}
            className={`bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-4 rounded border-b-4 border-green-700 active:border-b-0 active:mt-1 ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            PLAY
          </button>
        </div>
      </header>

      {/* Editor Component */}
      <div className="mb-6 w-full flex justify-center">
        <LevelEditor level={level} setLevel={setLevel} />
      </div>

      {/* AI Controls */}
      <div className="w-full max-w-xl bg-gray-700 p-4 rounded-lg shadow-lg">
        <h2 className="text-white font-bold mb-2">AI Level Generator</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="E.g., A sky level with many coins and pipes"
            className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-2">Powered by Gemini 2.5 Flash</p>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-gray-300 max-w-xl text-sm bg-gray-900/50 p-4 rounded border border-gray-700">
        <h3 className="font-bold text-white mb-2">Controls</h3>
        <p className="mb-2 text-blue-300 font-semibold">{selectedChar} selected.</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Editor:</strong> Left-Click to Paint, Right-Click to Pan, Scroll to Zoom.</li>
          <li><strong>Game:</strong> Arrow Keys to Move, 'A' to Jump, 'POW' for Ability.</li>
        </ul>
        <p className="text-xs text-gray-500">
          Tip: Use the palette above the editor to place blocks and enemies manually!
        </p>
      </div>

    </div>
  );
};

export default App;
