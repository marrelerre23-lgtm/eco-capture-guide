import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Bild URL saknas');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API-nyckel är inte konfigurerad');
    }

    // Fetch image and convert to base64
    console.log('Hämtar bild från URL:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Kunde inte hämta bild: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    console.log('Analyserar bild med Gemini Vision...');
    
    // Call Gemini Vision API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Du är en expert på nordisk flora och fauna. Analysera denna bild och identifiera arten. Ge svar på svenska i följande JSON-format:

{
  "species": {
    "commonName": "Svenskt artnamn",
    "scientificName": "Vetenskapligt namn",
    "category": "svamp/växt/djur",
    "confidence": 0.85,
    "description": "Detaljerad beskrivning av arten på svenska",
    "habitat": "Var arten normalt förekommer",
    "identificationFeatures": "Kännetecken som hjälper till identifiering",
    "rarity": "vanlig/ovanlig/sällsynt/hotad",
    "sizeInfo": "Information om storlek"
  },
  "reasoning": "Förklaring av varför du tror det är denna art"
}

Fokusera på nordiska arter (Sverige, Norge, Danmark, Finland). Om du inte kan identifiera arten med hög säkerhet (>70%), säg det tydligt.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1000,
        },
      }),
    });

    const geminiData = await geminiResponse.json();
    console.log('Gemini svar:', JSON.stringify(geminiData, null, 2));

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API fel: ${geminiData.error?.message || 'Okänt fel'}`);
    }

    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Inget svar från Gemini API');
    }

    // Parse JSON response from Gemini
    let analysisResult;
    try {
      // Extract JSON from the response (might be wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Kunde inte hitta JSON i svaret');
      }
    } catch (parseError) {
      console.error('JSON parse fel:', parseError);
      // Fallback: create structured response from text
      analysisResult = {
        species: {
          commonName: "Okänd art",
          scientificName: "Okänd",
          category: "okänd",
          confidence: 0.5,
          description: content,
          habitat: "Okänd",
          identificationFeatures: "Kunde inte identifiera tydliga kännetecken",
          rarity: "okänd",
          sizeInfo: "Okänd"
        },
        reasoning: "Automatisk analys kunde inte ge en tydlig identifiering"
      };
    }

    console.log('Slutgiltig analys:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fel i analyze-species function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      species: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});