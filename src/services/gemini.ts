import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: any = null;

if (API_KEY && API_KEY !== 'YOUR_API_KEY') {
    genAI = new GoogleGenerativeAI(API_KEY);
}

export const getGeminiModel = () => {
    if (!genAI) return null;
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const processStatement = async (content: string) => {
    const model = getGeminiModel();
    if (!model) throw new Error("Gemini API Key missing");

    const prompt = `
    Extract date, description, and amount from this statement content. 
    Return a JSON array of objects with keys: date (YYYY-MM-DD), description, amount (number).
    Focus on financial transactions.
    
    Content:
    ${content}
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up JSON from markdown if necessary
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
};

export const draftInvoiceEmail = async (clientName: string, amount: string, projects: string[]) => {
    const model = getGeminiModel();
    if (!model) throw new Error("Gemini API Key missing");

    const prompt = `
    Write a polite, premium, and professional invoice notification email.
    Agency: Tribute Studio
    Client: ${clientName}
    Amount: ${amount}
    Projects covered: ${projects.join(', ')}
    
    Keep it concise but sophisticated.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};
