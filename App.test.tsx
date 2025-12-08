import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { generateLevel } from './services/geminiService';

// Declare Jest globals
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

// Mock GameEngine to avoid Canvas issues and verify mounting
jest.mock('./components/GameEngine', () => ({
  GameEngine: ({ onExit, onWin, onDie }: any) => (
    <div data-testid="game-engine">
      <h1>Game Engine Mock</h1>
      <button onClick={onExit}>Exit</button>
      <button onClick={onWin}>Win</button>
      <button onClick={onDie}>Die</button>
    </div>
  )
}));

// Mock geminiService
jest.mock('./services/geminiService', () => ({
  generateLevel: jest.fn()
}));

// Mock browser alert
window.alert = jest.fn();

describe('App', () => {
  it('renders editor mode by default', () => {
    render(<App />);
    expect(screen.getByText('Mushroom Maker')).toBeInTheDocument();
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    expect(screen.queryByTestId('game-engine')).not.toBeInTheDocument();
  });

  it('switches to play mode when PLAY is clicked', () => {
    render(<App />);
    const playBtn = screen.getByTestId('play-button');
    fireEvent.click(playBtn);
    
    expect(screen.getByTestId('game-engine')).toBeInTheDocument();
    expect(screen.queryByText('Mushroom Maker')).not.toBeInTheDocument();
  });

  it('returns to editor mode when exiting game', () => {
    render(<App />);
    
    // Enter Play Mode
    fireEvent.click(screen.getByTestId('play-button'));
    expect(screen.getByTestId('game-engine')).toBeInTheDocument();

    // Exit Game
    fireEvent.click(screen.getByText('Exit'));
    expect(screen.queryByTestId('game-engine')).not.toBeInTheDocument();
    expect(screen.getByText('Mushroom Maker')).toBeInTheDocument();
  });

  it('handles level generation flow', async () => {
    (generateLevel as any).mockResolvedValue({
      name: "Test Level",
      layout: "S...........................................................\n" +
              "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      description: "A test generated level"
    });

    render(<App />);
    
    const input = screen.getByPlaceholderText(/E.g., A sky level/i);
    const generateBtn = screen.getByText('Generate');

    fireEvent.change(input, { target: { value: 'Test Prompt' } });
    fireEvent.click(generateBtn);

    expect(generateBtn).toBeDisabled();
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(generateLevel).toHaveBeenCalledWith('Test Prompt');

    await waitFor(() => {
      expect(generateBtn).not.toBeDisabled();
      expect(screen.getByText('Generate')).toBeInTheDocument();
    });
  });

  it('handles generation errors', async () => {
    (generateLevel as any).mockRejectedValue(new Error('API Failure'));
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);
    
    const input = screen.getByPlaceholderText(/E.g., A sky level/i);
    const generateBtn = screen.getByText('Generate');

    fireEvent.change(input, { target: { value: 'Fail Prompt' } });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Failed to generate'));
    });

    alertMock.mockRestore();
  });
});