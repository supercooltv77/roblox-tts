const express = require("express");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AUDIO_DIR = path.join(__dirname, "audio");

// Create audio directory if it doesn't exist
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR);
}

const VOICE_MAP = {
    "adam"   : "en-US-GuyNeural",
    "bella"  : "en-US-JennyNeural",
    "antoni" : "en-US-DavisNeural",
    "elli"   : "en-US-AriaNeural",
    "glitch" : "en-US-TonyNeural",
    "callum" : "en-GB-RyanNeural",
    "clyde"  : "en-US-ChristopherNeural"
}

// Serve audio files
app.use("/audio", express.static(AUDIO_DIR));

app.post("/tts", async (req, res) => {
    const { text, voiceId } = req.body;

    if (!text || !voiceId) {
        return res.status(400).json({ error: "Missing text or voiceId" });
    }

    if (text.length > 300) {
        return res.status(400).json({ error: "Text too long" });
    }

    const voice = VOICE_MAP[voiceId.toLowerCase()] || "en-US-GuyNeural";
    const fileName = crypto.randomUUID() + ".mp3";
    const filePath = path.join(AUDIO_DIR, fileName);

    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

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
        fs.writeFileSync(filePath, audioBuffer);

        // Delete file after 60 seconds
        setTimeout(() => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 60000);

        const audioUrl = `https://roblox-tts.onrender.com/audio/${fileName}`;
        return res.json({ audioUrl });

    } catch (err) {
        console.error("Edge TTS error:", err);
        return res.status(500).json({ error: "Edge TTS error" });
    }
});

app.get("/", (req, res) => res.send("TTS server running!"));

app.listen(PORT, () => console.log(`TTS server listening on port ${PORT}`));
