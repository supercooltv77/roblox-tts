// server.js — Node.js middleman server
// Deploy this on Railway.app (free)
// It receives text + voiceId from Roblox and returns an audio URL from ElevenLabs

const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY; // set this in Railway environment variables
const PORT = process.env.PORT || 3000;

app.post("/tts", async (req, res) => {
    const { text, voiceId, playerId } = req.body;

    // Basic validation
    if (!text || !voiceId) {
        return res.status(400).json({ error: "Missing text or voiceId" });
    }

    if (text.length > 300) {
        return res.status(400).json({ error: "Text too long" });
    }

    try {
        // Call ElevenLabs API
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("ElevenLabs error:", err);
            return res.status(500).json({ error: "ElevenLabs API error" });
        }

        // Convert audio to base64 so Roblox can load it as a data URI
        const audioBuffer = await response.buffer();
        const base64Audio = audioBuffer.toString("base64");
        const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

        return res.json({ audioUrl });

    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/", (req, res) => res.send("TTS server running!"));

app.listen(PORT, () => console.log(`TTS server listening on port ${PORT}`));
