# Mushroom Kingdom Mashup Maker

**Description**: A React-based retro platformer and level editor featuring AI level generation and unique character abilities.

## Features

- **AI Level Generation**: Use prompts to generate infinite platformer levels powered by Gemini 2.5 Flash.
- **Multiple Characters**: Play as Mario, Luigi, Toad, or Peach, each with unique stats and abilities.
- **Advanced Abilities**:
  - **Mario**: Fire Cyclone
  - **Luigi**: Ghost Dash (Phase through obstacles)
  - **Toad**: Super Sprout (Grow vines to climb)
  - **Peach**: Crystal Barrier (Shield)
- **Classic Power-ups**: Find Super Mushrooms in Question blocks to grow big and break bricks!
- **Solid Physics**: Precise platforming physics including variable jump height, momentum, and collision detection.

## Controls

### Mobile / Touch
- **Left / Right Arrows**: Move character.
- **A Button**: Jump.
- **POW Button**: Activate special ability.
- **Up / Down Arrows**: Climb vines (Toad's ability).

### Game Rules
- Reach the **Goal (G)** to win.
- Avoid **Spikes** and **Goombas**.
- Hit **Question Blocks (?)** to find **Super Mushrooms**.
- While **SUPER** (Big):
  - You can break **Brick Blocks** by jumping into them from below.
  - Taking damage reverts you to Small form instead of dying instantly.

## Development

Built with React, TypeScript, and TailwindCSS.
Uses HTML5 Canvas for high-performance rendering.

### Testing

This project includes unit tests for utility functions, services, and the app component.

To run tests (if environment supports Jest):
```bash
npm test
```

Key test files:
- `utils/physics.test.ts`: Validates collision detection logic.
- `utils/levelParser.test.ts`: Validates the level string parsing logic.
- `services/geminiService.test.ts`: Validates AI integration (mocked).
- `App.test.tsx`: Validates main application flow and UI interactions.

### Version History
- **v1.0.3**: Fix: Isolated game state to prevent destructible blocks (bricks, question blocks) from persisting in Editor mode. Fixed magic numbers in UI code.
- **v1.0.2**: Optimization of GameEngine loop, added comprehensive integration tests for AI flow, and finalized documentation.
- **v1.0.1**: Added robust level parsing, fixed collision bugs with pipes, added unit tests, and improved code formatting.
- **v1.0.0**: Initial release.
