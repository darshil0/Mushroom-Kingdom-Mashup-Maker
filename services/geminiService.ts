import { GoogleGenAI, Type } from "@google/genai";
// FIX 1: Import all necessary types and constants
import { EDITOR_COLS, EDITOR_ROWS } from "../constants";
import { GeneratedLevel, EntityType, CharacterType } from "../types";

// FIX 2: Use process.env.VITE_GEMINI_API_KEY for consistency with Vite config
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// FIX 3: Define EntitySpawnPoint schema for structured entity output
const EntitySpawnPointSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      description: "The type of entity to spawn (e.g., goomba, coin, mushroom).",
      enum: [
        EntityType.Goomba, 
        EntityType.Mushroom, 
        EntityType.SuperMushroom, 
        EntityType.Coin
      ]
    },
    x: { type: Type.NUMBER, description: `The column index (0 to ${EDITOR_COLS - 1})` },
    y: { type: Type.NUMBER, description: `The row index (0 to ${EDITOR_ROWS - 1})` }
  },
  required: ["type", "x", "y"]
};

// Schema for level generation (Enhanced)
// FIX 4: Added entities array to the level schema for non-tile elements
const levelSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Creative name for the level" },
    layout: {
      type: Type.STRING,
      description: `A single string representing the level layout using characters. 
      Width must be ${EDITOR_COLS} chars, Height must be ${EDITOR_ROWS} lines.
      Use these keys: 
      '.' = Empty/Air, 
      '#' = Ground (Solid), 
      'B' = Brick (Breakable), 
      '?' = Question Block (for Mushroom/Coin), 
      'P' = Pipe, 
      '^' = Spike,
      // FIX 5: Removed 'E', 'S', 'G' from layout description to force them into entities/startPos/TileType.Goal
      // This makes parsing simpler and separates concerns (tiles vs. entities).
      // 'S' and 'G' are handled by TileType.Goal in the parser now.
      `
    },
    entities: {
      type: Type.ARRAY,
      description: "A list of entities to spawn at specific tile coordinates.",
      items: EntitySpawnPointSchema
    },
    description: { type: Type.STRING, description: "Short description of the level theme and primary challenge." },
    // FIX 6: Added prompt to response for debugging and history
    prompt: { type: Type.STRING, description: "The user's original prompt." }
  },
  required: ["name", "layout", "entities", "description", "prompt"]
};

// FIX 7: Pass difficulty and selected character for better AI context
export const generateLevel = async (
  prompt: string, 
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  character: CharacterType = CharacterType.Mario
): Promise<GeneratedLevel> => {
  const systemInstruction = `You are a senior game level designer for a Mario-like platformer.
  The player is ${character} (Jump: ${character === CharacterType.Luigi ? 'High' : 'Normal'}, Ability: ${character === CharacterType.Peach ? 'Shield' : 'Offense'}).
  The level must be playable by this character.
  Strictly follow the JSON schema and DO NOT include 'S' (Start) or 'G' (Goal) in the layout string.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // FIX 7: Include difficulty in the content prompt
      contents: `Create a 2D platformer level layout with ${difficulty} difficulty.
      The grid size is strictly ${EDITOR_COLS} columns by ${EDITOR_ROWS} rows.
      Theme: ${prompt}.
      Ensure all generated entities are placed on solid ground or above a platform.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: levelSchema,
        systemInstruction: systemInstruction,
        temperature: 0.8 // FIX 8: Added temperature for creative variety
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Cleanup Markdown code blocks if present (Gemini sometimes adds them despite mimeType)
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?/, "").replace(/```$/, "");
    }
    
    // FIX 9: Added robust JSON parsing with error handling
    try {
      const parsed = JSON.parse(text);
      // FIX 10: Inject the original prompt into the result object
      parsed.prompt = prompt; 
      return parsed as GeneratedLevel;
    } catch (e) {
      console.error("Failed to parse level JSON:", text, e);
      // FIX 11: Throw a more specific error with the original error as the cause
      throw new Error("Failed to parse level JSON response from AI", { cause: e });
    }
  } catch (error) {
    console.error("Level generation failed:", error);
    throw error;
  }
};
