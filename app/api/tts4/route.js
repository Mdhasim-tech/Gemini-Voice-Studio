import { GoogleGenAI } from "@google/genai";
import wav from 'wav';
import { PassThrough } from "stream";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function saveWaveFile(
   filename,
   pcmData,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
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
   const body = await request.json();
   const trans = body.transcript;
   console.log(trans);
   const transcript = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: trans,
   })

   const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: transcript,
      config: {
         responseModalities: ['AUDIO'],
         speechConfig: {
            multiSpeakerVoiceConfig: {
               speakerVoiceConfigs: [
                  {
                     speaker: "Dr. Anya",
                     voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Kore" },
                     }
                  },
                  {
                     speaker: "Liam",
                     voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Puck" },
                     }
                  }
               ]
            }
         }
      }
   });

   const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
}


