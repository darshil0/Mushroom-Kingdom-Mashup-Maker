import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { generateLevel } from './services/geminiService';

// Mock GameEngine to avoid Canvas issues and verify mounting
jest.mock('./components/GameEngine', () => ({
  GameEngine: ({ onExit, onWin, onDie }: any) => (
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders editor mode by default', () => {
    render(<App />);
    expect(screen.getByText('Mushroom Maker')).toBeInTheDocument();
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    expect(screen.queryByTestId('game-engine')).not.toBeInTheDocument();
  });

  it('switches to play mode when PLAY is clicked', async () => {
    render(<App />);
    await user.click(screen.getByTestId('play-button'));
    
    expect(screen.getByTestId('game-engine')).toBeInTheDocument();
    expect(screen.queryByText('Mushroom Maker')).not.toBeInTheDocument();
  });

  it('returns to editor mode when exiting game', async () => {
    render(<App />);
    
    // Enter Play Mode
    await user.click(screen.getByTestId('play-button'));
    expect(screen.getByTestId('game-engine')).toBeInTheDocument();

    // Exit Game
    await user.click(screen.getByTestId('exit-button'));
    expect(screen.queryByTestId('game-engine')).not.toBeInTheDocument();
    expect(screen.getByText('Mushroom Maker')).toBeInTheDocument();
  });

  it('handles level generation flow', async () => {
    (generateLevel as jest.Mock).mockResolvedValue({
      name: "Test Level",
      layout: "S...........................................................\n" +
              "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      description: "A test generated level"
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/E.g., A sky level/i);
    const generateBtn = screen.getByText('Generate');

    await user.type(input, 'Test Prompt');
    await user.click(generateBtn);

    expect(generateBtn).toBeDisabled();
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(generateLevel).toHaveBeenCalledWith('Test Prompt');

    await waitFor(() => {
      expect(generateBtn).not.toBeDisabled();
      expect(screen.getByText('Generate')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles generation errors', async () => {
    (generateLevel as jest.Mock).mockRejectedValue(new Error('API Failure'));

    render(<App />);
    
    const input = screen.getByPlaceholderText(/E.g., A sky level/i);
    const generateBtn = screen.getByText('Generate');

    await user.type(input, 'Fail Prompt');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to generate'));
    }, { timeout: 2000 });
  });
});
