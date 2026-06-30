import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

let ai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is missing. AI features will be disabled.");
      return new GoogleGenAI({ apiKey: "dummy" }); // Return dummy to avoid crashing, handled via try-catch
    }
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

export interface AIAnalysisResult {
  sentimentScore: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  themes: string[];
}

/**
 * Analyzes qualitative feedback to determine sentiment and key themes.
 */
export async function analyzeFeedback(feedback: string): Promise<AIAnalysisResult | null> {
  if (!feedback || feedback.trim().length < 5) return null;

  try {
    const aiClient = getGeminiClient();
    if (!process.env.GEMINI_API_KEY) return null;

    const prompt = `
      You are an expert academic quality assurance analyst. 
      Analyze the following student feedback for a university lecturer/course.
      
      Feedback: "${feedback}"
      
      Extract the following:
      1. Sentiment Score: Choose exactly one of POSITIVE, NEUTRAL, or NEGATIVE.
      2. Themes: Identify up to 3 core themes discussed in the feedback (e.g., "Course Pacing", "Exam Difficulty", "Engagement", "Material Clarity", "Punctuality").

      Respond strictly in the following JSON format:
      {
        "sentimentScore": "POSITIVE|NEUTRAL|NEGATIVE",
        "themes": ["Theme 1", "Theme 2"]
      }
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for consistent JSON
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text) as AIAnalysisResult;
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Gemini AI Analysis Error:", error);
    return null; // Fail gracefully
  }
}

/**
 * Triggered asynchronously after a student submits an evaluation.
 * Enriches the evaluation record with AI insights.
 */
export async function triggerEvaluationAnalysis(evaluationId: string, feedback: string) {
  try {
    const analysis = await analyzeFeedback(feedback);
    if (analysis) {
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: {
          sentimentScore: analysis.sentimentScore,
          themes: analysis.themes,
        }
      });
      console.log(`[AI Worker] Evaluated record ${evaluationId}: ${analysis.sentimentScore}, Themes: ${analysis.themes.join(", ")}`);
    }
  } catch (error) {
    console.error("[AI Worker] Failed to enrich evaluation:", error);
  }
}
