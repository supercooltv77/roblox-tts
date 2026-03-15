// server.js — Node.js middleman server
// Uses Microsoft Edge TTS (completely free, no API key needed)

const express = require("express");
const edgeTTS = require("edge-tts");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Edge TTS voice map
const VOICE_MAP = {
	"adam"   : "en-US-GuyNeural",
	"bella"  : "en-US-JennyNeural",
	"antoni" : "en-US-DavisNeural",
	"elli"   : "en-US-AriaNeural",
	"glitch" : "en-US-TonyNeural",
	"callum" : "en-GB-RyanNeural",
	"clyde"  : "en-US-ChristopherNeural"
}

app.post("/tts", async (req, res) => {
	const { text, voiceId } = req.body;

	if (!text || !voiceId) {
		return res.status(400).json({ error: "Missing text or voiceId" });
	}

	if (text.length > 300) {
		return res.status(400).json({ error: "Text too long" });
	}

	const voice = VOICE_MAP[voiceId.toLowerCase()] || "en-US-GuyNeural";

	try {
		const synthesizer = new edgeTTS.MsEdgeTTS();
		await synthesizer.setMetadata(voice, edgeTTS.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

		const chunks = [];
		const readable = synthesizer.toStream(text);

		await new Promise((resolve, reject) => {
			readable.on("data", chunk => chunks.push(chunk));
			readable.on("end", resolve);
			readable.on("error", reject);
		});

		const audioBuffer = Buffer.concat(chunks);
		const base64Audio = audioBuffer.toString("base64");
		const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

		return res.json({ audioUrl });

	} catch (err) {
		console.error("Edge TTS error:", err);
		return res.status(500).json({ error: "Edge TTS error" });
	}
});

app.get("/", (req, res) => res.send("TTS server running!"));

app.listen(PORT, () => console.log(`TTS server listening on port ${PORT}`));
