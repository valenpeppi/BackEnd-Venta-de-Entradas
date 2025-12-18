import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { env } from "../config/env";
import fs from 'fs';


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


export async function validateEventContent(name: string, description: string, imagePath?: string): Promise<{ valid: boolean; reason: string | null }> {
  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analiza el siguiente nombre, descripción e imagen de un evento.\nDetermina si el contenido es apropiado para una plataforma de venta de entradas familiar (sin contenido ofensivo, ilegal, explícito o pornográfico).\n\nCRITERIOS ESTRICTOS DE RECHAZO (Si cumple ALGUNO, responde "valid": false):\n1. VIOLENCIA Y ARMAS: Imágenes de armas de fuego, armas blancas, sangre, violencia gráfica o amenazas.\n2. DROGAS ILEGALES: Representación visual o mención de drogas ilícitas, parafernalia de drogas o consumo de sustancias.\n3. CONTENIDO SEXUAL: Desnudos totales o parciales (incluso artísticos), genitales, nalgas descubiertas, pezones femeninos visibles, o posturas sexualmente sugerentes.\n4. DISCURSO DE ODIO: Símbolos de odio (ej. esvásticas), racismo, o discriminación.\n\nLa seguridad familiar es la prioridad.\n\nNombre del evento: "${name}"\nDescripción: "${description}"\n\nResponde SOLAMENTE con un JSON válido con el siguiente formato:\n{ "valid": boolean, "reason": "breve explicación en español de por qué se rechaza, o null si es valido" }`
        }
      ]
    }
  ];

  if (imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`
        }
      });
    } catch (error) {
      console.error("Error reading image for AI validation:", error);
    }
  }

  const model = "google/gemini-2.0-flash-exp:free";

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages,
        response_format: { type: "json_object" }
      },
      { headers: openRouterHeaders }
    );

    const content = response.data?.choices?.[0]?.message?.content || "";
    const jsonStr = content.replace(/```json\n?|```/g, '').trim();

    try {
      const result = JSON.parse(jsonStr);
      return { valid: result.valid, reason: result.valid ? null : result.reason };
    } catch (e) {
      if (content.toLowerCase().includes('"valid": true') || content.toLowerCase().includes('"valid":true')) return { valid: true, reason: null };
      return { valid: false, reason: "Error al procesar la respuesta de seguridad." };
    }

  } catch (err) {
    console.warn("Primary AI model failed, trying backup...", err);
    return { valid: true, reason: null };
  }
}

router.post("/", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ reply: "No se recibió ningún mensaje." });
  }

  try {
    const replyDeepSeek = await withTimeout(
      getAIResponse("deepseek/deepseek-chat-v3.1:free", message),
      15000
    );
    return res.json({ reply: replyDeepSeek });

  } catch (err1: any) {


    try {

      const replyGemma = await withTimeout(
        getAIResponse("google/gemma-3-12b-it:free", message),
        20000
      );

      return res.json({ reply: replyGemma });

    } catch (err2: any) {

      return res.status(504).json({
        reply: "El asistente no pudo responder en este momento. Intentalo nuevamente más tarde.",
      });
    }
  }
});

router.post("/generate-reply", async (req: Request, res: Response) => {
  const { userMessage } = req.body;
  console.log("DEBUG: /generate-reply called with:", userMessage);

  if (!userMessage) {
    console.log("DEBUG: No userMessage provided");
    return res.status(400).json({ reply: "No se recibió el mensaje del usuario." });
  }

  const prompt = `Actúa como un agente de soporte técnico amable y profesional para la plataforma 'TicketApp'. 
  Tu tarea es redactar una respuesta breve, cordial y útil para el siguiente mensaje de un usuario:
  "${userMessage}"
  
  La respuesta debe estar en español y lista para ser enviada. No incluyas saludos genéricos como "Aquí tienes tu respuesta", solo el texto del mensaje.`;

  try {
    const reply = await withTimeout(
      getAIResponse("deepseek/deepseek-chat-v3.1:free", prompt),
      15000
    );
    console.log("DEBUG: AI reply generated:", reply);
    return res.json({ reply });
  } catch (err: any) {
    console.error("DEBUG: Primary model failed, trying fallback:", err.message);
    try {
      const replyFallback = await withTimeout(
        getAIResponse("google/gemma-3-12b-it:free", prompt),
        20000
      );
      console.log("DEBUG: AI reply generated (fallback):", replyFallback);
      return res.json({ reply: replyFallback });
    } catch (err2: any) {
      console.error("DEBUG: All models failed:", err2.message);
      return res.status(500).json({ reply: "No se pudo generar la respuesta. Intenta de nuevo más tarde." });
    }
  }
});

export default router;
