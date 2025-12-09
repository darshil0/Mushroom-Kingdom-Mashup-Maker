# 🍄 Mushroom Kingdom Mashup Maker

**Repository Name**: `mushroom-kingdom-mashup-maker`
**Description**: A **React.js** and **TypeScript** powered retro platformer and level editor featuring AI level generation and unique character abilities.

---

## 🌟 Features

* **AI Level Generation**: Use text prompts to generate infinite, customized platformer levels powered by **Gemini 2.5 Flash**.
* **Multiple Characters**: Play as **Mario**, **Luigi**, **Toad**, or **Peach**, each possessing unique statistics and abilities.
* **Advanced Abilities**:
    * **Mario**: Fire Cyclone (Offensive/Defensive Spin)
    * **Luigi**: Ghost Dash (Momentarily phase through solid obstacles and enemies)
    * **Toad**: Super Sprout (Grow climbable vines from the ground)
    * **Peach**: Crystal Barrier (Temporary defensive shield)
* **Classic Power-ups**: Find **Super Mushrooms** in **Question Blocks (?)** to grow Big and break blocks!
* **Solid Physics**: Features precise platforming physics, including **variable jump height**, momentum, and granular collision detection.

---

## 🎮 Controls and Gameplay

### Standard Controls
| Action | Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Move** | Left / Right Arrow Keys | Left / Right On-Screen Arrows |
| **Jump** | **Spacebar** or **W** / **Up Arrow** | A Button |
| **Ability** | **P** or **X** Key | POW Button |
| **Climb** | Up / Down Arrow Keys | Up / Down On-Screen Arrows |

### Editor Controls
| Action | Input |
| :--- | :--- |
| **Paint Tile** | Left-Click |
| **Pan Camera** | Right-Click + Drag |
| **Zoom** | Scroll Wheel |

### Game Rules
* **Goal**: Reach the **Goal (G)** tile to win and clear the course.
* **Hazards**: Avoid **Spikes** and enemies like **Goombas**.
* **Power-ups**: Hit **Question Blocks (?)** from below to reveal **Super Mushrooms**.
* **SUPER Form (Big)**:
    * Allows you to break **Brick Blocks** by jumping into them from underneath.
    * Taking damage reverts you to the Small form (one-hit damage buffer).

---

## 💻 Development

The project is built using:
* **Frontend**: React, TypeScript, HTML5 Canvas (for game rendering)
* **Styling**: TailwindCSS
* **AI Service**: Google Gemini 2.5 Flash (for level generation)

### Testing

This project includes extensive unit and integration tests.

To run tests:
```bash
npm test
````

  * `utils/physics.test.ts`: Validates collision detection logic.
  * `utils/levelParser.test.ts`: Validates the level string parsing logic.
  * `services/geminiService.test.ts`: Validates AI integration (using mocks).
  * `App.test.tsx`: Validates the main application flow and UI interactions.

### 📜 Version History

| Version | Changes |
| :--- | :--- |
| **v1.0.4** | Fix: Corrected an array padding issue in `App.tsx` during AI level generation, ensuring level data integrity. |
| **v1.0.3** | Fix: Isolated game state to prevent destructible blocks (bricks, question blocks) from persisting when switching back to Editor mode. Refactored UI 'magic numbers' into constants. |
| **v1.0.2** | Optimization: Improved the `GameEngine` loop. Added comprehensive AI integration tests. Finalized project documentation. |
| **v1.0.1** | Feature: Added robust level parsing. Fix: Corrected collision bugs involving pipes. Added new unit tests and improved code formatting. |
| **v1.0.0** | Initial project release. |

