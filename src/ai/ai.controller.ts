import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const openRouterHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
  "X-Title": "TicketApp Assistant",
};

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

// Llamada genérica a OpenRouter - Intermediario con Gemma y Mistral -
async function getAIResponse(model: string, message: string) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages: [
        {
          role: "user",
          content: message, // el frontend ya manda el prompt completo
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

// Endpoint principal: reenvía prompt completo del front
router.post("/", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ reply: "No se recibió ningún mensaje." });
  }

  try {
    console.log("Mensaje recibido desde frontend IA:", message.slice(0, 120) + "...");

    // 1️Intentar con Gemma primero
    const replyGemma = await withTimeout(
      getAIResponse("google/gemma-3-12b-it:free", message),
      15000
    );
    console.log("Gemma respondió OK");
    return res.json({ reply: replyGemma });

  } catch (err1: any) {
    console.warn("Gemma falló o tardó demasiado:", err1.message);

    try {
      // 2️⃣ Fallback con Mistral
      const replyMistral = await withTimeout(
        getAIResponse("mistralai/mistral-7b-instruct:free", message),
        20000
      );
      console.log("Fallback Mistral respondió OK");
      return res.json({ reply: replyMistral });

    } catch (err2: any) {
      console.error("❌ Ambos modelos fallaron:", err2.message);
      return res.status(504).json({
        reply:
          "El asistente no pudo responder en este momento. Intentalo nuevamente más tarde.",
      });
    }
  }
});

export default router;
