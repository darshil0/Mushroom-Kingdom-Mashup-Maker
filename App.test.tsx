import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { generateLevel } from './services/geminiService';

// Mock GameEngine to avoid Canvas issues and verify mounting
jest.mock('./components/GameEngine', () => ({
  // Ensure the mock component is typed correctly for the props it receives
  GameEngine: ({ onExit, onWin, onDie }: { onExit: () => void, onWin: () => void, onDie: () => void }) => (
    <div data-testid="game-engine">
      <h1>Game Engine Mock</h1>
      <button data-testid="exit-button" onClick={onExit}>Exit</button>
      <button data-testid="win-button" onClick={onWin}>Win</button>
      <button data-testid="die-button" onClick={onDie}>Die</button>
    </div>
  )
}));

// Mock geminiService
jest.mock('./services/geminiService', () => ({
  generateLevel: jest.fn()
}));

// Mock browser alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: jest.fn()
});

const user = userEvent.setup();

describe('App', () => {
  // FIX 1: Ensure window.alert is reset between tests
  beforeEach(() => {
    jest.clearAllMocks();
    (window.alert as jest.Mock).mockClear();
  });

  // FIX 2: Added test for winning/dying the game and returning to editor
  it('returns to editor mode when game is won or player dies', async () => {
    render(<App />);
    
    // Enter Play Mode
    await user.click(screen.getByTestId('play-button'));
    expect(screen.getByTestId('game-engine')).toBeInTheDocument();

    // Test Win scenario
    await user.click(screen.getByTestId('win-button'));
    // Wait for the UI state change after a game event
    await waitFor(() => {
        expect(screen.queryByTestId('game-engine')).not.toBeInTheDocument();
        expect(screen.getByText('Mushroom Maker')).toBeInTheDocument();
    });

    // Re-enter Play Mode
    await user.click(screen.getByTestId('play-button'));
    expect(screen.getByTestId('game-engine')).toBeInTheDocument();

    // Test Die scenario
    await user.click(screen.getByTestId('die-button'));
    await waitFor(() => {
        expect(screen.queryByTestId('game-engine')).not.toBeInTheDocument();
        expect(screen.getByText('Mushroom Maker')).toBeInTheDocument();
    });
  });

  // FIX 3: Changed the original test name for better clarity
  it('returns to editor mode when user manually exits game', async () => {
    render(<App />);
    
    // Enter Play Mode
    await user.click(screen.getByTestId('play-button'));
    expect(screen.getByTestId('game-engine')).toBeInTheDocument();

    // Exit Game
    await user.click(screen.getByTestId('exit-button'));
    await waitFor(() => { // Added waitFor for robust asynchronous state changes
        expect(screen.queryByTestId('game-engine')).not.toBeInTheDocument();
        expect(screen.getByText('Mushroom Maker')).toBeInTheDocument();
    });
  });

  it('handles level generation flow and loads the new level', async () => {
    const mockLevel = {
      name: "Test Level",
      layout: "S...........................................................\n" +
              "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      description: "A test generated level"
    };
    (generateLevel as jest.Mock).mockResolvedValue(mockLevel);

    render(<App />);
    
    const input = screen.getByPlaceholderText(/E.g., A sky level/i);
    const generateBtn = screen.getByText('Generate');

    await user.type(input, 'Test Prompt');
    await user.click(generateBtn);

    expect(generateBtn).toBeDisabled();
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(generateLevel).toHaveBeenCalledWith('Test Prompt');

    await waitFor(() => {
      // FIX 4: Assert that the UI state has changed back to normal
      expect(generateBtn).not.toBeDisabled();
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      // FIX 5: Assert that the newly generated level name is displayed in the editor UI
      expect(screen.getByText(/Test Level/i)).toBeInTheDocument(); 
    }, { timeout: 2000 });
  });

  it('handles generation errors and shows alert', async () => {
    const errorMessage = 'API Failure: Invalid prompt';
    (generateLevel as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<App />);
    
    const input = screen.getByPlaceholderText(/E.g., A sky level/i);
    const generateBtn = screen.getByText('Generate');

    await user.type(input, 'Fail Prompt');
    await user.click(generateBtn);

    // FIX 6: Use a more specific assertion pattern and check for loading state reset
    await waitFor(() => {
      // Should show an alert with part of the error message
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to generate level: ${errorMessage}`)
      );
      // The button should be re-enabled after the error
      expect(generateBtn).not.toBeDisabled();
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
