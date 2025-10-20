import { GoogleGenAI } from "@google/genai";
import wav from "wav";
import { PassThrough } from "stream";

export async function GET() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      TTS the following cheerful Diwali-themed short conversation clearly with natural pauses:

Dr. Anya: Welcome back to the LightTalk Podcast! I can already smell the sweets and see the diyas glowing.
Liam: Oh yes, Anya! It’s that magical time again — Diwali! The festival that reminds us that light always conquers darkness.
Dr. Anya: Exactly, and what better way to celebrate than with laughter, love, and maybe a few fireworks — safely, of course!
Liam: Couldn’t agree more. Here’s wishing everyone listening a bright and joyful Diwali ahead!
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "Joe",
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" },
                },
              },
              {
                speaker: "Jane",
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Puck" },
                },
              },
            ],
          },
        },
      },
    });

    const data =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) throw new Error("No audio data returned from Gemini TTS model.");

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
    console.error("TTS3 Error:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
