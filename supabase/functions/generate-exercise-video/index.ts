import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseName, muscleGroup, equipment } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!exerciseName) {
      throw new Error("Nome do exercício é obrigatório");
    }

    // Generate a descriptive prompt for the exercise visualization
    const imagePrompt = `Professional fitness illustration showing the exercise "${exerciseName}" with proper form. 
Athletic person in workout clothes demonstrating the movement with clear muscle engagement.
${muscleGroup ? `Target muscle group: ${muscleGroup}.` : ""}
${equipment ? `Equipment: ${equipment}.` : ""}
Clean gym background, good lighting, anatomically correct form, showing starting and ending position side by side.
Fitness instruction style, professional quality, clear demonstration of proper technique.
Ultra high resolution fitness illustration.`;

    console.log("Generating image for exercise:", exerciseName);
    console.log("Prompt:", imagePrompt);

    // Step 1: Generate an image of the exercise using Gemini image model
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (imageResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await imageResponse.text();
      console.error("Image generation error:", imageResponse.status, errorText);
      throw new Error("Erro ao gerar imagem do exercício");
    }

    const imageData = await imageResponse.json();
    console.log("Image response received");

    // Extract the generated image
    const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(imageData));
      throw new Error("Nenhuma imagem foi gerada");
    }

    // Return the image directly (it's already base64)
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: generatedImage,
        description: imageData.choices?.[0]?.message?.content || `Visualização do exercício ${exerciseName}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-exercise-video function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
