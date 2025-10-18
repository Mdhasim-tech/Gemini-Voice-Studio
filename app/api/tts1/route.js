import {GoogleGenAI} from '@google/genai';
import wav from 'wav';
import path from "path"

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

export async function GET() {
    try{
   const ai = new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY,
   });

   const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: 'Say Cheerfully: Have a wonderful day!' }] }],
      config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
               voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
               },
            },
      },
   });

   const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
   const audioBuffer = Buffer.from(data, 'base64');

   const fileName = path.join(process.cwd(),"public",'out.wav');
   await saveWaveFile(fileName, audioBuffer);

   return new Response(
    JSON.stringify({success:true,message:"Audio saved",file:"/out.wav"}),
    {status:200,headers:{"Content-Type":"application/json"}}
   );
}catch(error){
    return new Response(JSON.stringify({success:false,error:error.message}),{
        status:500,headers:{"Content-Type":"application/json"}
    })
}
}
