# 🍄 Mushroom Kingdom Mashup Maker - Walkthrough

Welcome to the Mashup Maker! This guide will help you create your first AI-generated level and master the unique character abilities.

---

## 1. Creating a Level

When you open the app, you start in **Editor Mode**.

1.  **Select a Character**: Use the dropdown menu at the top to choose your hero.
    | Character | Key Trait |
    | :--- | :--- |
    | **Mario** | Balanced stats. |
    | **Luigi** | Higher jump, slippery movement. |
    | **Toad** | Faster running speed. |
    | **Peach** | Floatier jump. |
2.  **Enter a Prompt**: In the "AI Level Generator" box, describe the level you want to play.
    * *Examples:*
        * "A difficult castle level with lots of spikes"
        * "A flat grassland level with many goombas"
        * "A vertical level with pipes and springs"
3.  **Generate**: Click the **Generate** button (or press **Enter** while the input is active). The AI (Gemini 2.5 Flash) will create a layout based on your prompt, which will replace the current map in the editor.

---

## 2. Playing the Level

Once your level is generated or edited to your liking:

1.  **Click PLAY**: Press the green **▶ PLAY** button in the header.
2.  **The Interface**:
    * **Canvas**: The game view tracks your character.
    * **HUD**: Displays your current Character and State (Small/Super).
3.  **Controls**: Refer to the full controls list in the main `README.md`.
    * **Movement**: Arrow Keys (Left/Right)
    * **Jump**: **Spacebar**, **W**, or **Up Arrow**. (Hold for higher jumps.)
    * **Ability**: **P** or **X** key. (Activates character's POW ability.)

---

## 3. Character Abilities

Each character has a unique ability activated with the **POW** button/key. Mastering these is key to beating difficult levels.

| Character | Ability | Effect |
| :--- | :--- | :--- |
| **Mario** | **Fire Cyclone** | Creates a small, short-range shockwave that knocks back and deals a small amount of damage to enemies in front. |
| **Luigi** | **Ghost Dash** | Luigi briefly phases out, becoming **invulnerable to damage** and able to pass through solid terrain (excluding pits) for 0.5 seconds. |
| **Toad** | **Super Sprout** | Instantly grows a climbable green vine tower from the ground directly below Toad's position. Use **Up/Down** to climb. Has a short cooldown. |
| **Peach** | **Crystal Barrier**| Peach generates a barrier that grants **complete invulnerability** to damage and enemy collision for 1 second. |

---

## 4. Power-Ups

* **Question Blocks (?)**: Jump and hit these from below. They may contain a **Super Mushroom**.
* **Super Mushroom**: Touching this turns you **SUPER**.
    * You become visibly larger.
    * You can break **Brick Blocks** by hitting them from below.
    * If you take damage (touch a Goomba or Spike), you shrink back to Small instead of dying instantly.

---

## 5. Winning and Losing

* **Win**: Touch the **Goal** block (Yellow flag/block) to clear the course.
* **Lose**: Touch a Goomba or Spike while Small, or fall into a pit.

Have fun creating and playing!
