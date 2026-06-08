import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, lang } = await req.json();
    
    // Map our app languages to Google TTS language codes
    const languageCodeMap: Record<string, string> = {
      ru: 'ru-RU',
      en: 'en-US',
      es: 'es-ES'
    };
    
    // Select premium Journey or standard Neural voices
    const voiceNameMap: Record<string, string> = {
      ru: 'ru-RU-Standard-D', // Excellent standard voice
      en: 'en-US-Journey-D',  // High-quality Journey voice
      es: 'es-ES-Neural2-B'   // Great Neural voice
    };

    const languageCode = languageCodeMap[lang] || 'ru-RU';
    const voiceName = voiceNameMap[lang] || 'ru-RU-Standard-D';
    
    const apiKey = "AIzaSyC6BDuYh5Xy6ZoDv3-s-ncTSLz5b30pcjk"; 
    // Google TTS limit is 5000 characters per request
    const safeText = text.substring(0, 4900); 

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: safeText },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS API Error:", errorText);
      return NextResponse.json({ error: "Failed to generate speech" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ audioContent: data.audioContent });

  } catch (error) {
    console.error("TTS Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
