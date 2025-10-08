import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Mensaje vacío" });

  try {
    const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
        model: "google/gemma-3-12b-it:free", // modelo gratuito
        messages: [
        {
            role: "user",
            content: message,
        },
        ],
    },
    {
        headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.FRONTEND_URL,
        "X-Title": "TicketApp Assistant",
        "Content-Type": "application/json",
        },
    }
    );



    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error: any) {
    console.error("❌ Error OpenRouter:", error.response?.data || error.message);
    res.status(500).json({
      error:
        "Error al conectar con OpenRouter. Verificá tu API key o conexión a Internet.",
    });
  }
});

export default router;
