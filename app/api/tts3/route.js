// /app/api/tts3/route.js
import { GoogleGenAI } from '@google/genai';
import wav from 'wav';
import path from 'path';
import fs from 'fs';

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

export async function GET() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      TTS the following short conversation clearly with natural pauses:
      Joe: How's it going today, Jane?
      Jane: Not too bad, Joe. How about you? Are you coming to play football?
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
            ]
          }
        }
      }
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    const audioBuffer = Buffer.from(data, 'base64');
    const filePath = path.join(process.cwd(), 'public', 'out.wav');

    await saveWaveFile(filePath, audioBuffer);

    return new Response(
      JSON.stringify({ success: true, message: "Audio saved", file: "/out.wav" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
