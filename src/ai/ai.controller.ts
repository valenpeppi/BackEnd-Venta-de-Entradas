import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { env } from "../config/env";

dotenv.config();
const router = express.Router();

const openRouterHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "HTTP-Referer": env.FRONTEND_URL,
  "X-Title": "TicketApp Assistant",
};

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

export async function getAIResponse(model: string, message: string) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    },
    { headers: openRouterHeaders }
  );

  return (
    response.data?.choices?.[0]?.message?.content ||
    "No se recibió respuesta del modelo."
  );
}

export async function validateEventContent(name: string, description: string): Promise<boolean> {
  const prompt = `
  Analiza el siguiente nombre y descripción de un evento.
  Determina si el contenido es apropiado para una plataforma de venta de entradas general (sin contenido ofensivo, ilegal, o explícito).
  
  Nombre del evento: "${name}"
  Descripción: "${description}"
  
  Responde EXACTAMENTE con una de las siguientes dos frases: "apropiado" o "no apropiado". No expliques nada más.
`;

  try {
    // Principal: DeepSeek.
    const response = await withTimeout(
      getAIResponse("deepseek/deepseek-chat-v3.1:free", prompt),
      10000
    );

    const cleanResponse = response.trim().toLowerCase();
    /* console.log(`AI Validation Response: ${cleanResponse}`); */

    if (cleanResponse.includes("no apropiado")) {
      return false;
    }
    return true;

  } catch (err) {
    console.warn("AI validation failed with primary model, trying backup...");
    try {
      // Backup model: Gemma.
      const responseBackup = await withTimeout(
        getAIResponse("google/gemma-3-12b-it:free", prompt),
        10000
      );
      const cleanResponseBackup = responseBackup.trim().toLowerCase();
      /* console.log(`AI Validation Backup Response: ${cleanResponseBackup}`); */

      if (cleanResponseBackup.includes("no apropiado")) {
        return false;
      }
      return true;
    } catch (err2) {
      console.error("AI validation failed completely. Allowing event by default to avoid blocking.");
      return true; // Fail open
    }
  }
}

router.post("/", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ reply: "No se recibió ningún mensaje." });
  }

  try {
    console.log("Mensaje recibido desde frontend IA:", message.slice(0, 120) + "...");
    // Principal: DeepSeek.
    const replyDeepSeek = await withTimeout(
      getAIResponse("deepseek/deepseek-chat-v3.1:free", message),
      15000
    );
    console.log("DeepSeek respondió OK");
    return res.json({ reply: replyDeepSeek });

  } catch (err1: any) {
    console.warn("DeepSeek falló o tardó demasiado:", err1?.message);

    try {
      // Modelo de Backup: Gemma.
      const replyGemma = await withTimeout(
        getAIResponse("google/gemma-3-12b-it:free", message),
        20000
      );
      console.log("Backup Gemma respondió OK");
      return res.json({ reply: replyGemma });

    } catch (err2: any) {
      console.error("❌ Ambos modelos fallaron:", err2?.message);
      return res.status(504).json({
        reply: "El asistente no pudo responder en este momento. Intentalo nuevamente más tarde.",
      });
    }
  }
});

export default router;
