import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Valid subcategories - detailed categories for AI prompt
const VALID_SUBCATEGORIES = [
  // Träd och Vedartade
  'barrträd', 'lövträd', 'buske', 'klätterväxt',
  // Örter och Blommor
  'ört', 'blomma', 'gräs',
  // Mossor och Lavar
  'mossa', 'lav',
  // Svampar
  'svamp',
  // Fåglar
  'fågel',
  // Däggdjur
  'däggdjur',
  // Grod- och Kräldjur
  'groda', 'salamander', 'ödla', 'orm',
  // Insekter och Spindeldjur
  'insekt', 'spindel',
  // Vatten- och Ryggradslöst Liv
  'vattenlevande', 'snäcka', 'mask',
  // Stenar & Mineraler
  'sten', 'mineral',
  // Spår och Övrigt
  'spår', 'annat'
];

// Main categories that map to subcategories
const MAIN_CATEGORIES = [
  'träd-vedartade', 'örter-blommor', 'mossor-lavar', 'svampar', 
  'fåglar', 'däggdjur', 'grod-kräldjur', 'insekter-spindeldjur', 
  'vatten-ryggradslöst', 'stenar-mineraler', 'spår-övrigt'
];

// All valid categories (subcategories + main categories)
const ALL_VALID_CATEGORIES = [...VALID_SUBCATEGORIES, ...MAIN_CATEGORIES];

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
  category: z.enum(ALL_VALID_CATEGORIES as [string, ...string[]])
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
      console.error('[ANALYZE] Missing authorization header');
      return new Response(JSON.stringify({ 
        error: 'Du måste vara inloggad för att använda AI-analys',
        code: 'AUTH_REQUIRED',
        upgradeRequired: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[ANALYZE] Missing Supabase configuration');
      return new Response(JSON.stringify({ 
        error: 'Konfigurationsfel på servern. Kontakta support.',
        code: 'CONFIG_ERROR',
        upgradeRequired: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('[ANALYZE] Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ 
        error: 'Du måste vara inloggad för att använda AI-analys',
        code: 'AUTH_FAILED',
        upgradeRequired: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    // Check user limits BEFORE analysis
    const { data: limitCheck, error: limitError } = await supabaseClient
      .rpc('check_user_limits', { user_id_input: user.id, action_type: 'analysis' });

    if (limitError) {
      console.error('[ANALYZE] Error checking limits:', limitError.message);
      return new Response(JSON.stringify({ 
        error: 'Ett fel uppstod vid kontroll av gränser. Försök igen.',
        code: 'LIMIT_CHECK_ERROR',
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

    console.log('Validerad bild URL:', imageUrl);
    console.log('Kategori-tips från användaren:', category);
    
    // Map main categories to hints for better AI guidance
    const getCategoryHint = (cat: string | null | undefined): string => {
      if (!cat) {
        return 'Användaren är osäker på vad detta är. Analysera noggrant och försök identifiera vilken typ av organism eller objekt det är.';
      }
      
      const hints: Record<string, string> = {
        // Main categories
        'träd-vedartade': 'Fokusera på träd, buskar och klätterväxter. Bestäm om det är barrträd, lövträd, buske eller klätterväxt.',
        'örter-blommor': 'Fokusera på örter, blommor och gräs. OBS: Klätterväxter (murgröna, humle, etc) hör INTE hit - de ska vara "klätterväxt" under träd och vedartade.',
        'mossor-lavar': 'Fokusera på mossor och lavar. Bestäm om det är en mossa eller lav.',
        'svampar': 'Fokusera på svampar. Identifiera svampart och ange om den är ätlig eller giftig.',
        'fåglar': 'Fokusera på fåglar. Identifiera fågelart.',
        'däggdjur': 'Fokusera på däggdjur. Identifiera däggdjursart.',
        'grod-kräldjur': 'Fokusera på groddjur och kräldjur (grodor, salamandrar, ödlor, ormar).',
        'insekter-spindeldjur': 'Fokusera på insekter och spindlar. Bestäm om det är en insekt eller spindel.',
        'vatten-ryggradslöst': 'Fokusera på vattenlevande organismer och ryggradslösa djur (snäckor, maskar, etc).',
        'stenar-mineraler': 'Fokusera på stenar, mineraler och bergarter. Bestäm typ av sten eller mineral.',
        'spår-övrigt': 'Fokusera på spår (fotavtryck, spillning, etc) eller annat som inte passar andra kategorier.',
        // Legacy support
        'växter': 'Fokusera på växter. Bestäm om det är träd, buske, blomma, ört eller gräs.',
        'insekter': 'Fokusera på insekter och spindlar.',
        'stenar': 'Fokusera på stenar och mineraler.'
      };
      
      return hints[cat] || 'Fokusera din analys baserat på bilden.';
    };
    
    const categoryHint = getCategoryHint(category);

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
                text: `Du är en expert på nordisk natur - flora, fauna, geologi och ekologi. Analysera denna bild och identifiera de 3 mest sannolika alternativen. 

${categoryHint}
${detailPrompt}

Ge svar på svenska i följande JSON-format med EXAKT 3 alternativ sorterade efter confidence (högst först):

{
  "alternatives": [
    {
      "species": {
        "commonName": "Svenskt namn",
        "scientificName": "Vetenskapligt namn",
        "category": "Välj från listan nedan",
        "confidence": 0.85,
        "description": "Detaljerad beskrivning på svenska",
        "habitat": "Var arten/objektet normalt förekommer",
        "identificationFeatures": "Kännetecken som hjälper till identifiering",
        "rarity": "vanlig/ovanlig/sällsynt/hotad",
        "sizeInfo": "Information om storlek",
        "edibility": "För svamp och växter: ätlig/giftig/ätlig med förbehåll/inte ätlig/okänd",
        "ageStage": "Ålder, mognad eller livsstadium (t.ex. ung/mogen, larv/vuxen, etc)"
      },
      "reasoning": "Förklaring av varför du tror det är detta alternativ"
    }
  ]
}

KATEGORIER (välj EXAKT en):

TRÄD OCH VEDARTADE:
- "barrträd" - för alla barrträd (tall, gran, en, cypress, etc)
- "lövträd" - för alla lövfällande träd (björk, ek, asp, lönn, etc)
- "buske" - för buskar och större buskartade växter
- "klätterväxt" - för klättrande eller slingrande växter (murgröna, humle, vinranka, etc)

ÖRTER OCH BLOMMOR (INTE klätterväxter - de hör till "klätterväxt"):
- "blomma" - för alla blommande örter och prydnadsväxter (INTE klättrande)
- "ört" - för icke-blommande örtartade växter (INTE klättrande)
- "gräs" - för gräs, vass och gräsliknande växter

MOSSOR OCH LAVAR:
- "mossa" - för mossor
- "lav" - för lavar

SVAMPAR:
- "svamp" - för alla svampar (ange ALLTID om ätlig/giftig i edibility-fältet!)

FÅGLAR:
- "fågel" - för alla fåglar

DÄGGDJUR:
- "däggdjur" - för alla däggdjur

GROD- OCH KRÄLDJUR:
- "groda" - för grodor och paddor
- "salamander" - för salamandrar och tritoner
- "ödla" - för ödlor
- "orm" - för ormar

INSEKTER OCH SPINDELDJUR:
- "insekt" - för alla insekter (flugor, bin, fjärilar, skalbaggar, myror, etc)
- "spindel" - för spindlar och andra spindeldjur

VATTEN- OCH RYGGRADSLÖST LIV:
- "vattenlevande" - för vattenlevande organismer som fiskar, kräftdjur, etc
- "snäcka" - för snäckor och sniglar
- "mask" - för maskar

STENAR & MINERALER:
- "sten" - för bergarter och stenar
- "mineral" - för mineraler och kristaller

SPÅR OCH ÖVRIGT:
- "spår" - för fotavtryck, spillning, gnagspår, etc
- "annat" - för allt som inte passar ovanstående kategorier

PRIORITERINGSREGLER (viktigt vid tveksamhet):
1. En vattenlevande insekt klassas som "insekt", INTE "vattenlevande"
2. En klätterväxt klassas som "klätterväxt", INTE "ört" eller "blomma"
3. Gräs klassas som "gräs", INTE "ört"
4. Lavar klassas som "lav", INTE "mossa"
5. Spindlar klassas som "spindel", INTE "insekt"

VIKTIGT:
- Returnera EXAKT 3 alternativ, sorterade efter confidence (högst först)
- För svampar och växter: ange ALLTID edibility (ätlig/giftig/etc)
- För alla organismer: ange ALLTID ageStage (ålder/mognad/livsstadium)
- Du MÅSTE alltid välja rätt kategori från listan ovan
- Fokusera på nordiska arter (Sverige, Norge, Danmark, Finland)
- Om osäker, ge lägre confidence-värden (0.3-0.5)`
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
      
      // Validate and fix categories - only subcategories are valid in responses
      analysisResult.alternatives = analysisResult.alternatives.map((alt: any) => {
        const category = alt.species?.category?.toLowerCase()?.trim();
        if (!category || !VALID_SUBCATEGORIES.includes(category)) {
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
    console.error('[ANALYZE] Unexpected error:', error);
    
    // Categorize error types for better user feedback
    let errorMessage = 'Ett oväntat fel uppstod vid analys';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Nätverksfel. Kontrollera din internetanslutning och försök igen.';
        errorCode = 'NETWORK_ERROR';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Analysen tog för lång tid. Försök igen med en mindre bild.';
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message.includes('API') || error.message.includes('key')) {
        errorMessage = 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om ett ögonblick.';
        errorCode = 'AI_SERVICE_ERROR';
      } else {
        errorMessage = `Analys misslyckades: ${error.message}`;
        errorCode = 'ANALYSIS_ERROR';
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: errorCode,
      upgradeRequired: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
