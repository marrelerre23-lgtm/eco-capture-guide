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
    const { imageUrl, category } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Bild URL saknas');
    }
    
    const categoryHint = category && category !== 'okänt' 
      ? `Användaren tror att detta är en ${category}. Fokusera din analys på ${category === 'svamp' ? 'svampar' : category === 'växt' ? 'växter' : category === 'fågel' ? 'fåglar' : category === 'insekt' ? 'insekter' : category === 'däggdjur' ? 'däggdjur' : 'denna kategori'}.`
      : 'Användaren är osäker på vad detta är. Analysera noggrant och försök identifiera vilken typ av organism det är.';

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API-nyckel är inte konfigurerad');
    }

    console.log('Analyserar bild med Lovable AI...');
    
    // Call Lovable AI Gateway with vision capabilities
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Du är en expert på nordisk flora och fauna. Analysera denna bild och identifiera arten. 

${categoryHint}

Ge svar på svenska i följande JSON-format:

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
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      }),
    });

    const aiData = await aiResponse.json();
    console.log('Lovable AI svar:', JSON.stringify(aiData, null, 2));

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('För många förfrågningar. Försök igen om en stund.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI-krediter har tagit slut. Kontakta support.');
      }
      const errorMessage = aiData.error?.message || JSON.stringify(aiData);
      console.error('Lovable AI fel:', errorMessage);
      throw new Error(`AI API fel: ${errorMessage}`);
    }

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Inget svar från AI API');
    }

    // Parse JSON response from AI
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
