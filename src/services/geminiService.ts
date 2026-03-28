import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateMotivation(streak: number, missedLast: boolean) {
  const model = "gemini-3-flash-preview";
  const prompt = `You are a tough but inspiring gym coach. The user has a ${streak} day streak. ${missedLast ? "They missed their alarm yesterday." : "They are doing great."} Give them a short, punchy, 1-sentence wake-up message that will get them out of bed immediately. Be aggressive but motivating.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  
  return response.text;
}

export async function generateWorkout(goals: string[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate a quick 15-minute home workout for someone with these goals: ${goals.join(", ")}. Provide 5 exercises with reps and a brief tip. Format as a clean list.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  
  return response.text;
}

export async function verifySelfie(base64Image: string) {
  const model = "gemini-3-flash-preview";
  const prompt = "Analyze this image. Is it a selfie of a person? The person should look like they just woke up or are ready for a workout. Respond with exactly 'YES' if it is a selfie of a person, or 'NO' if it is not. No other text.";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
      ]
    },
  });
  
  return response.text.trim().toUpperCase() === "YES";
}

export async function chatWithCoach(message: string, history: { role: string, parts: string }[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are 'Iron Coach', a professional fitness trainer. You are direct, motivating, and knowledgeable. You help users with workout plans, diet advice, and overcoming laziness. Keep responses concise and action-oriented.",
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
