import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Valid categories - must match frontend
const VALID_CATEGORIES = [
  'blomma', 'buske', 'ört', 'träd', 'svamp', 
  'mossa', 'sten', 'insekt', 'fågel', 'däggdjur', 'annat'
];

const VALID_DETAIL_LEVELS = ['quick', 'standard', 'deep'];

// Input validation schema
const requestSchema = z.object({
  imageUrl: z.string()
    .url({ message: "Ogiltig bild URL" })
    .min(10, { message: "Bild URL är för kort" })
    .max(2048, { message: "Bild URL är för lång" })
    .refine((url) => {
      const allowedDomains = [
        'supabase.co',
        'lovableproject.com', 
        'lovable.app',
        'iccxtssdximiuarmnbmx.supabase.co'
      ];
      try {
        const parsed = new URL(url);
        return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
      } catch {
        return false;
      }
    }, { message: "Bild URL från otillåten domän" }),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]])
    .optional()
    .nullable(),
  detailLevel: z.enum(VALID_DETAIL_LEVELS as [string, ...string[]])
    .optional()
    .default('standard'),
});

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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized', upgradeRequired: false }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized', upgradeRequired: false }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    // Check user limits BEFORE analysis
    const { data: limitCheck, error: limitError } = await supabaseClient
      .rpc('check_user_limits', { user_id_input: user.id, action_type: 'analysis' });

    if (limitError) {
      console.error('Error checking limits:', limitError);
      return new Response(JSON.stringify({ 
        error: 'Kunde inte kontrollera användargränser',
        upgradeRequired: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Limit check result:', limitCheck);

    if (!limitCheck || limitCheck.length === 0 || !limitCheck[0]?.allowed) {
      const reason = limitCheck?.[0]?.reason || 'Analysgräns nådd';
      console.log('User limit reached:', reason);
      return new Response(JSON.stringify({ 
        error: reason,
        upgradeRequired: true 
      }), {
        status: 429, // Too Many Requests
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(JSON.stringify({ 
        error: 'Ogiltig request data',
        details: validationResult.error.issues.map(i => i.message).join(', '),
        upgradeRequired: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageUrl, category, detailLevel } = validationResult.data;

    // Validate image URL is from allowed domain
    const ALLOWED_DOMAINS = [
      'supabase.co',
      'lovableproject.com',
      'lovable.app'
    ];

    const isAllowedDomain = ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname.includes(domain)
    );

    if (!isAllowedDomain) {
      throw new Error('Bild URL måste vara från tillåten domän (Supabase eller Lovable)');
    }

    console.log('Validerad bild URL:', imageUrl);
    
    const categoryHint = category && category !== 'okänt' 
      ? `Användaren tror att detta är en ${category}. Fokusera din analys på ${
          category === 'svamp' ? 'svampar' : 
          category === 'blomma' ? 'blommor' : 
          category === 'buske' ? 'buskar' : 
          category === 'ört' ? 'örter' : 
          category === 'träd' ? 'träd' : 
          category === 'mossa' ? 'mossor och lavar' : 
          category === 'sten' ? 'stenar och mineraler' : 
          category === 'fågel' ? 'fåglar' : 
          category === 'insekt' ? 'insekter' : 
          category === 'däggdjur' ? 'däggdjur' : 
          'denna kategori'
        }.`
      : 'Användaren är osäker på vad detta är. Analysera noggrant och försök identifiera vilken typ av organism eller objekt det är.';

    const detailPrompt = detailLevel === 'deep' 
      ? 'Ge en mycket detaljerad och grundlig analys med omfattande beskrivningar.'
      : detailLevel === 'quick'
      ? 'Ge en snabb och koncis analys med de viktigaste punkterna.'
      : 'Ge en balanserad analys med bra detaljnivå.';

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API-nyckel är inte konfigurerad');
    }

    console.log('Analyserar bild med Lovable AI...');
    
    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError;
    let aiResponse;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Call Lovable AI Gateway with vision capabilities
        aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: `Du är en expert på nordisk flora och fauna. Analysera denna bild och identifiera de 3 mest sannolika arterna. 

${categoryHint}
${detailPrompt}

Ge svar på svenska i följande JSON-format med EXAKT 3 alternativ sorterade efter confidence (högst först):

{
  "alternatives": [
    {
      "species": {
        "commonName": "Svenskt artnamn",
        "scientificName": "Vetenskapligt namn",
        "category": "blomma/buske/ört/träd/svamp/mossa/sten/insekt/fågel/däggdjur",
        "confidence": 0.85,
        "description": "Detaljerad beskrivning av arten på svenska",
        "habitat": "Var arten normalt förekommer",
        "identificationFeatures": "Kännetecken som hjälper till identifiering",
        "rarity": "vanlig/ovanlig/sällsynt/hotad",
        "sizeInfo": "Information om storlek"
      },
      "reasoning": "Förklaring av varför du tror det är denna art"
    }
  ]
}

VIKTIGT:
- Returnera EXAKT 3 alternativ, sorterade efter confidence
- Använd "blomma" för alla blommande växter (vildblommor, prydnadsblommor)
- Använd "buske" specifikt för buskar och större buskartade växter
- Använd "ört" för örtartade växter, gräs och icke-blommande växter
- Använd "träd" specifikt för träd
- Använd "svamp" för alla svampar
- Använd "mossa" för mossor och lavar
- Använd "sten" för stenar, mineraler och bergarter
- Använd "insekt" för alla insekter (flugor, bin, fjärilar, skalbaggar etc)
- Använd "fågel" för alla fåglar
- Använd "däggdjur" för alla däggdjur
- Du MÅSTE alltid välja en av ovanstående kategorier baserat på bilden, även om användaren valde "okänt"
- Gör alltid ditt bästa för att identifiera rätt kategori från bilden

Fokusera på nordiska arter (Sverige, Norge, Danmark, Finland). Om du är osäker, ge lägre confidence-värden.`
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
        
        // Success - break retry loop
        break;
      } catch (error) {
        lastError = error;
        console.error(`Försök ${attempt} misslyckades:`, error);
        
        if (attempt < maxRetries) {
          const waitTime = 1000 * attempt; // Exponential backoff
          console.log(`Väntar ${waitTime}ms innan nytt försök...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (!aiResponse) {
      throw new Error(`AI-anrop misslyckades efter ${maxRetries} försök: ${lastError?.message || 'Okänt fel'}`);
    }

    const aiData = await aiResponse.json();
    console.log('Lovable AI svar:', JSON.stringify(aiData, null, 2));

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('För många förfrågningar just nu. Vänta en stund och försök igen. Om problemet kvarstår, kontakta support.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI-tjänsten är tillfälligt otillgänglig på grund av användningsgräns. Vänligen kontakta support för att utöka din användning.');
      }
      const errorMessage = aiData.error?.message || JSON.stringify(aiData);
      console.error('Lovable AI fel:', errorMessage);
      throw new Error(`AI-analys misslyckades: ${errorMessage}. Försök igen senare eller kontakta support om problemet kvarstår.`);
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
      
      // Ensure we have alternatives array
      if (!analysisResult.alternatives || !Array.isArray(analysisResult.alternatives)) {
        throw new Error('Svaret innehåller inte alternatives array');
      }
      
      // Ensure we have at least 1 alternative (preferably 3)
      if (analysisResult.alternatives.length === 0) {
        throw new Error('Inga alternativ returnerades från AI');
      }
      
      // Validate and fix categories
      analysisResult.alternatives = analysisResult.alternatives.map((alt: any) => {
        const category = alt.species?.category?.toLowerCase()?.trim();
        if (!category || !VALID_CATEGORIES.includes(category)) {
          console.warn(`Ogiltig kategori från AI: "${category}", använder "annat"`);
          alt.species.category = 'annat';
        } else {
          alt.species.category = category;
        }
        
        // Set default confidence if missing or invalid
        if (typeof alt.species.confidence !== 'number' || isNaN(alt.species.confidence)) {
          console.warn('Confidence saknas eller är ogiltig, använder default 0.5');
          alt.species.confidence = 0.5;
        }
        
        return alt;
      });
    } catch (parseError) {
      console.error('JSON parse fel:', parseError);
      // Fallback: create structured response with single alternative
      analysisResult = {
        alternatives: [{
          species: {
            commonName: "Okänd art",
            scientificName: "Okänd",
            category: "annat",
            confidence: 0.3,
            description: content,
            habitat: "Okänd",
            identificationFeatures: "Kunde inte identifiera tydliga kännetecken",
            rarity: "okänd",
            sizeInfo: "Okänd"
          },
          reasoning: "Automatisk analys kunde inte ge en tydlig identifiering. Försök ta en bättre bild med mer ljus och närmare på objektet."
        }]
      };
    }

    console.log('Slutgiltig analys:', analysisResult);

    // Increment usage counter after successful analysis
    try {
      await supabaseClient.rpc('increment_usage_counter', { 
        user_id_input: user.id, 
        action_type: 'analysis' 
      });
      console.log('Usage counter incremented for user:', user.id);
    } catch (counterError) {
      console.error('Error incrementing usage counter:', counterError);
      // Don't fail the request if counter update fails
    }

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
