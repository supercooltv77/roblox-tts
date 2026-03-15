// server.js — Node.js middleman server
// Uses OpenAI TTS instead of ElevenLabs

const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

// OpenAI TTS voices mapped to friendly names
const VOICE_MAP = {
	"adam"   : "onyx",    // Male
	"bella"  : "nova",    // Female
	"antoni" : "echo",    // Male
	"elli"   : "shimmer", // Female
	"glitch" : "fable",   // Robot-ish
	"callum" : "alloy",   // Accent
	"clyde"  : "onyx",    // Funny (reuse onyx with different text)
}

app.post("/tts", async (req, res) => {
	const { text, voiceId, playerId } = req.body;

	if (!text || !voiceId) {
		return res.status(400).json({ error: "Missing text or voiceId" });
	}

	if (text.length > 300) {
		return res.status(400).json({ error: "Text too long" });
	}

	// Map voiceId to OpenAI voice name
	const openaiVoice = VOICE_MAP[voiceId.toLowerCase()] || "alloy";

	try {
		const response = await fetch("https://api.openai.com/v1/audio/speech", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${OPENAI_API_KEY}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: "tts-1",
				input: text,
				voice: openaiVoice,
				response_format: "mp3"
			})
		});

		if (!response.ok) {
			const err = await response.text();
			console.error("OpenAI TTS error:", err);
			return res.status(500).json({ error: "OpenAI TTS error" });
		}

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
