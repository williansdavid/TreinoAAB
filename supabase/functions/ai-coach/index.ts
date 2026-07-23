import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um coach de musculação em pt-BR. Foque em segurança, técnica correta e progressão gradual baseada no histórico do usuário. 

REGRAS IMPORTANTES:
- Nunca forneça diagnósticos médicos.
- Inclua avisos de segurança e instruções claras.
- Se faltarem dados, pergunte de forma objetiva.
- Adapte exercícios ao equipamento disponível e limitações informadas.
- Sempre inclua ao final: "⚠️ Estas orientações são informativas e não substituem acompanhamento profissional."
- Responda de forma concisa e prática.
- Use emojis relevantes para tornar a leitura mais agradável.
- Formate usando Markdown quando apropriado.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt = "";

    switch (type) {
      case "generate_plan":
        userPrompt = `Crie um plano de treino semanal com as seguintes especificações:
- Objetivo: ${data.objetivo}
- Experiência: ${data.experiencia}
- Dias por semana: ${data.dias_semana}
- Tempo por treino: ${data.tempo_por_dia_min} minutos
- Equipamentos disponíveis: ${data.equipamentos?.join(", ") || "Academia completa"}
- Limitações: ${data.limitacoes?.join(", ") || "Nenhuma"}

Retorne em formato JSON com a estrutura:
{
  "nome_plano": "Nome do plano",
  "dias": [
    {
      "dia": "segunda",
      "nome_treino": "Nome do treino (ex: Peito e Tríceps)",
      "exercicios": [
        {
          "nome": "Nome do exercício",
          "series": 3,
          "reps": 12,
          "descanso_seg": 60
        }
      ]
    }
  ]
}`;
        break;

      case "exercise_guidance":
        userPrompt = `Forneça instruções detalhadas para o exercício "${data.exercise_name}":

1. **Como executar**: Passos detalhados da técnica correta
2. **Posicionamento**: Posição de pés, mãos, coluna
3. **Respiração**: Quando inspirar e expirar
4. **Erros comuns**: Os 3 erros mais frequentes
5. **Dicas de segurança**: Cuidados importantes
6. **Alternativas**: 2-3 variações do exercício

${data.limitacoes?.length > 0 ? `Considere as seguintes limitações do usuário: ${data.limitacoes.join(", ")}` : ""}
${data.equipamentos?.length > 0 ? `Equipamentos disponíveis: ${data.equipamentos.join(", ")}` : ""}`;
        break;

      case "progression_suggestion":
        userPrompt = `Analise o histórico do usuário e sugira progressão:

Exercício: ${data.exercise_name}
Histórico recente:
${data.history?.map((h: any) => `- ${h.date}: ${h.carga}kg x ${h.reps} reps (RPE: ${h.rpe || "N/A"})`).join("\n") || "Sem histórico"}

Último treino: ${data.last_weight}kg x ${data.last_reps} reps

Sugira de forma conservadora:
1. Próxima carga recomendada
2. Ajuste de repetições se necessário
3. Sinais de atenção para reduzir carga`;
        break;

      case "chat":
        userPrompt = data.message;
        break;

      default:
        throw new Error("Tipo de requisição inválido");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao processar requisição de IA");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // For generate_plan, try to extract JSON
    if (type === "generate_plan") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const planData = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ success: true, plan: planData, raw: content }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.error("Error parsing plan JSON:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-coach function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
