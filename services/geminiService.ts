import { GoogleGenAI, Type } from "@google/genai";
import { CardAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

export const analyzeCardImage = async (base64Image: string): Promise<CardAnalysisResult> => {
  try {
    // We strip the data:image/xyz;base64, prefix if present for the API call data payload
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, API is flexible
              data: base64Data
            }
          },
          {
            text: "Analyze this sports card image. Extract the player first name, last name, year, brand/set, card number, sport, and team. Provide a short visual description."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            first_name: { type: Type.STRING },
            last_name: { type: Type.STRING },
            year: { type: Type.STRING },
            brand: { type: Type.STRING },
            card_number: { type: Type.STRING },
            sport: { type: Type.STRING },
            team: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["first_name", "sport", "brand"],
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

export const lookupCardInfo = async (year: string, brand: string, cardNumber: string): Promise<Partial<CardAnalysisResult>> => {
  try {
    const prompt = `Identify the sports card with these details: Year: "${year}", Brand/Set: "${brand}", Card Number: "${cardNumber}". Return the player first name, last name, sport, and team.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            first_name: { type: Type.STRING },
            last_name: { type: Type.STRING },
            sport: { type: Type.STRING },
            team: { type: Type.STRING }
          },
          required: ["first_name", "last_name", "sport"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<CardAnalysisResult>;
    }
    throw new Error("No lookup result returned");
  } catch (error) {
    console.error("Gemini Lookup Error:", error);
    throw error;
  }
};

export const findCardValue = async (details: string): Promise<number> => {
  try {
    const prompt = `Find the most recent fair market value (price in USD) for this sports card: ${details}. 
    Look for recent sold listings on eBay, PWCC, or Goldin. 
    Return a JSON object with a single key "value" containing the number (average if range). Do not add markdown formatting.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are NOT supported with googleSearch
      }
    });

    if (response.text) {
      // Clean potential markdown code blocks
      const text = response.text.replace(/```json|```/g, '').trim();
      try {
          const data = JSON.parse(text);
          return data.value || 0;
      } catch (e) {
          // Fallback simple number extraction
          const match = text.match(/[\d,]+(\.\d+)?/);
          if (match) {
             const val = parseFloat(match[0].replace(/,/g, ''));
             return isNaN(val) ? 0 : val;
          }
          return 0;
      }
    }
    return 0;
  } catch (error) {
    console.error("Gemini Value Search Error:", error);
    return 0;
  }
};

export const findCardImage = async (details: string): Promise<string | null> => {
  try {
    const prompt = `Find a high-quality image URL for the following sports card: ${details}. 
    The image should be of the card front.
    Return a JSON object with a single key "imageUrl" containing the URL. Do not add markdown formatting.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are NOT supported with googleSearch
      }
    });

    if (response.text) {
       const text = response.text.replace(/```json|```/g, '').trim();
       try {
        const data = JSON.parse(text);
        return data.imageUrl || null;
       } catch (e) {
         // Fallback link extraction
         const match = text.match(/https?:\/\/[^\s"']+/);
         return match ? match[0] : null;
       }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Search Error:", error);
    return null;
  }
};