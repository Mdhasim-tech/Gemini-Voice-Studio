import { GoogleGenAI } from '@google/genai';
import wav from 'wav';
import path from "path";

async function saveWaveFile(filename, pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(filename, {
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });
    writer.on('finish', resolve);
    writer.on('error', reject);
    writer.write(pcmData);
    writer.end();
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const text = body.text;
    const voiceName = body.voiceName;

    if (!text) throw new Error("Text is required");
    if (!voiceName) throw new Error("VoiceName is required");
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

    console.log("Text:", text, "Voice:", voiceName);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) throw new Error("No audio data returned from TTS API");

    const audioBuffer = Buffer.from(data, 'base64');
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": "inline; filename=tts.wav"
      }
    });

  } catch (error) {
    console.error("TTS API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
