import { GoogleGenAI } from "@google/genai";
import { Ticket, FlightData } from "../types";
import { env } from "../env";

const ai = new GoogleGenAI({ apiKey: env.VITE_GEMINI_API_KEY });

export const generateTicketAnalysis = async (tickets: Ticket[]): Promise<string> => {
    const dataSummary = tickets.map(t => ({
        code: t.propertyCode,
        type: t.serviceType,
        priority: t.priority,
        desc: t.description,
        status: t.status,
        created: new Date(t.createdAt).toLocaleDateString()
    }));

    const prompt = `
    Analise estes dados de chamados de manutenção da Casapē Boutique Imóveis.
    Responda em Português do Brasil.

    Dados: ${JSON.stringify(dataSummary)}

    Por favor, forneça um relatório curto e executivo contendo:
    1. Um resumo geral da saúde da operação.
    2. Identifique se há algum imóvel com recorrência de problemas.
    3. Sugestão de priorização baseada nos chamados urgentes e antigos.
    4. Formate a resposta usando Markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Não foi possível gerar a análise.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Erro ao conectar com a Inteligência Artificial. Verifique sua conexão ou cota de API.";
    }
};

export const checkFlightStatus = async (flightString: string): Promise<FlightData | null> => {
    if (!flightString) return null;

    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `
    Role: Flight Status API.
    Current Date: ${today}.
    Input: "${flightString}"

    Task:
    1. Identify the airline and flight number (e.g., "LA3352").
    2. USE GOOGLE SEARCH to find the *real-time* status of this flight for TODAY.
    3. Return a JSON object with the status.

    Valid Statuses: 'Scheduled', 'On Time', 'Delayed', 'Landed', 'Cancelled'.

    Output Format:
    {
        "number": "LA3352",
        "status": "On Time",
        "estimatedArrival": "14:30",
        "airline": "LATAM Airlines"
    }

    If not found or if the input is a car license plate, return null or appropriate status.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text;
        if (!text) return null;

        let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const firstOpen = jsonString.indexOf('{');
        const lastClose = jsonString.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1) {
            jsonString = jsonString.substring(firstOpen, lastClose + 1);
        }

        const data = JSON.parse(jsonString);

        return {
            number: data.number || flightString,
            status: data.status || 'Scheduled',
            estimatedArrival: data.estimatedArrival || 'N/A',
            lastUpdated: Date.now()
        };
    } catch (error) {
        console.error("Flight Status Error:", error);
        return null;
    }
};

export interface WeatherData {
    current: { temp: string; condition: string; icon: string };
    forecast: { day: string; temp: string; condition: string; icon: string }[];
}

export const getWeatherForecast = async (): Promise<WeatherData | null> => {
    const prompt = `
    What is the current weather in Rio de Janeiro, Brazil, and the forecast for the next 3 days?
    Return strictly a JSON object with this structure:
    {
        "current": { "temp": "28°C", "condition": "Ensolarado", "icon": "sun" },
        "forecast": [
            { "day": "Segunda", "temp": "26° - 30°", "condition": "Nublado", "icon": "cloud" },
            ... (3 days total)
        ]
    }
    
    IMPORTANT Rules:
    1. Translate condition text and day names to Portuguese (Brazil).
    2. Map 'icon' to one of these EXACT values: sun, cloud, rain, cloud-rain, cloud-lightning, wind, cloud-sun.
    3. Ensure current temperature is accurate for right now.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text;
        if (!text) return null;

        let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstOpen = jsonString.indexOf('{');
        const lastClose = jsonString.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1) {
            jsonString = jsonString.substring(firstOpen, lastClose + 1);
        }

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Weather API Error:", error);
        return null;
    }
};