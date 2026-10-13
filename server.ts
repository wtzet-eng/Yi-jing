import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Serve the privacy policy directly instead of letting the SPA fallback handle it.
  app.get("/privacy.html", async (_req, res) => {
    const candidates = [
      path.resolve("dist/privacy.html"),
      path.resolve("public/privacy.html"),
    ];

    for (const filePath of candidates) {
      try {
        await fs.access(filePath);
        return res.sendFile(filePath);
      } catch {
        // Try the next location; the page may be in the Vite build or source public directory.
      }
    }

    return res.status(404).type("text/plain").send("Privacy policy page not found.");
  });

  // API presence endpoint for the Yi Jing guide
  app.post("/api/presence", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          response: "Take a gentle breath and notice what sensations are present in your body right now.",
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ response: response.text });
    } catch (error) {
      console.error("Error in /api/presence:", error);
      res.json({
        response: "Notice what sensations and feelings are present in this moment.",
      });
    }
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
