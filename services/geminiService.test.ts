import { generateLevel } from './geminiService';
import { GoogleGenAI } from '@google/genai';

declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

// Mock the GoogleGenAI library
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          name: "Test Level",
          layout: "............................................................\n".repeat(15),
          description: "A test level description"
        })
      })
    }
  })),
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING'
  }
}));

describe('geminiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a level successfully', async () => {
    const prompt = 'A simple test level';
    const result = await generateLevel(prompt);

    expect(GoogleGenAI).toHaveBeenCalled();
    expect(result).toHaveProperty('name', 'Test Level');
    expect(result).toHaveProperty('layout');
    expect(result).toHaveProperty('description', 'A test level description');
  });

  it('should handle errors gracefully', async () => {
    (GoogleGenAI as unknown as any).mockImplementationOnce(() => ({
      models: {
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      }
    }));

    await expect(generateLevel('fail')).rejects.toThrow('API Error');
  });
});