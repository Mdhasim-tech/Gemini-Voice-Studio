import { GoogleGenAI } from '@google/genai';
import wav from 'wav';
import { PassThrough } from "stream";

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, voiceName } = body;

    if (!text || !voiceName)
      throw new Error("Text and voiceName are required");

    if (!process.env.GEMINI_API_KEY)
      throw new Error("GEMINI_API_KEY is missing");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Generate PCM data from Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) throw new Error("No audio data returned from Gemini");

    // Convert Base64 PCM → Buffer
    const pcmBuffer = Buffer.from(data, "base64");

  // ✅ Convert PCM -> WAV
     const wavStream = new PassThrough();
     const writer = new wav.FileWriter("out.wav", {
       channels: 1,
       sampleRate: 24000,
       bitDepth: 16,
     });

     writer.pipe(wavStream);
     writer.write(pcmBuffer);
     writer.end();

     // Collect the finished WAV buffer
     const chunks = [];
     for await (const chunk of wavStream) chunks.push(chunk);
     const wavBuffer = Buffer.concat(chunks);
     console.log(wavBuffer)
     return new Response(wavBuffer, {
       status: 200,
       headers: {
         "Content-Type": "audio/wav",
       },
     });
   } catch (err) {
    console.error("TTS2 Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
