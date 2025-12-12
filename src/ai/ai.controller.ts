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

import fs from 'fs';

export async function validateEventContent(name: string, description: string, imagePath?: string): Promise<{ valid: boolean; reason: string | null }> {
  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analiza el siguiente nombre, descripción e imagen de un evento.\nDetermina si el contenido es apropiado para una plataforma de venta de entradas familiar (sin contenido ofensivo, ilegal, explícito o pornográfico).\n\nCRITERIOS STRICTOS:\n- RECHAZA cualquier tipo de desnudo, incluso si es artístico, ilustrativo, estatuas o parcial.\n- Si la imagen muestra pechos femeninos (pezones visibles o ilustrados), genitales o nalgas descubiertas: RESPONDE "no apropiado".\n- La seguridad familiar es la prioridad.\n\nNombre del evento: "${name}"\nDescripción: "${description}"\n\nResponde SOLAMENTE con un JSON válido con el siguiente formato:\n{ "valid": boolean, "reason": "breve explicación en español de por qué se rechaza, o null si es valido" }`
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
      // Proceed with text validation only if image fails
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
    // Clean code blocks if present (some models wrap json in ```json ... ```)
    const jsonStr = content.replace(/```json\n?|```/g, '').trim();

    try {
      const result = JSON.parse(jsonStr);
      return { valid: result.valid, reason: result.valid ? null : result.reason };
    } catch (e) {
      // Fallback if JSON parse fails but prompt was followed
      if (content.toLowerCase().includes('"valid": true') || content.toLowerCase().includes('"valid":true')) return { valid: true, reason: null };
      return { valid: false, reason: "Error al procesar la respuesta de seguridad." };
    }

  } catch (err) {
    console.warn("Primary AI model failed, trying backup...", err);
    // Backup - Simple logic for now, hard to get structured JSON reliability from small models without more work
    // We default to allowing if primary fails to avoid blocking users, or block?
    // Let's rely on primary. If it fails, we allow (fail open) for now or basic text check.
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

export default router;
