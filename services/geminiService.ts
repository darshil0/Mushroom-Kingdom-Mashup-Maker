import { GoogleGenAI, Type } from "@google/genai";
import { EDITOR_COLS, EDITOR_ROWS } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for level generation
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
      '?' = Question Block, 
      'P' = Pipe, 
      '^' = Spike,
      'E' = Enemy (Goomba),
      'S' = Start Position (only one),
      'G' = Goal/Flag`
    },
    description: { type: Type.STRING, description: "Short description of the level theme" }
  },
  required: ["name", "layout", "description"]
};

export const generateLevel = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a 2D platformer level layout. 
      The grid size is strictly ${EDITOR_COLS} columns by ${EDITOR_ROWS} rows.
      Theme: ${prompt}.
      Make sure it is playable (jumps are possible). 
      Ensure there is exactly one 'S' (Start) and one 'G' (Goal).
      Use pipes 'P' and spikes '^' sparingly but effectively.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: levelSchema,
        systemInstruction: "You are a senior game level designer for a Mario-like platformer."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Level generation failed:", error);
    throw error;
  }
};