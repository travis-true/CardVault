import { GoogleGenAI, Type } from "@google/genai";
import { CardAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCardImage = async (base64Image: string): Promise<CardAnalysisResult> => {
  try {
    // We strip the data:image/xyz;base64, prefix if present for the API call data payload
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, API is flexible
              data: base64Data
            }
          },
          {
            text: "Analyze this sports card image. Extract the player name, year, brand/set, card number, sport, and team. Provide a short visual description."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            player: { type: Type.STRING },
            year: { type: Type.STRING },
            brand: { type: Type.STRING },
            card_number: { type: Type.STRING },
            sport: { type: Type.STRING },
            team: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["player", "sport", "brand"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CardAnalysisResult;
    }
    
    throw new Error("No analysis result returned");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
