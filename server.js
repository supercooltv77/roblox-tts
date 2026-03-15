const express = require("express");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

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
		const tts = new MsEdgeTTS();
		await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

		// toStream returns a promise in newer versions
		const result = await tts.toStream(text);
		const audioStream = result.audioStream || result;

		const chunks = [];
		await new Promise((resolve, reject) => {
			audioStream.on("data", chunk => chunks.push(chunk));
			audioStream.on("close", resolve);
			audioStream.on("end", resolve);
			audioStream.on("error", reject);
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
