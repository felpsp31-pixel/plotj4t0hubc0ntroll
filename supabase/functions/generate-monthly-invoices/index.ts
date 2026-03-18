import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate previous month in YYYY-MM format
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    
    // Friendly label like "Mar/2026"
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const referenceMonth = `${monthNames[prevMonth.getMonth()]}/${prevMonth.getFullYear()}`;

    // Get unprocessed summaries for the previous month
    const { data: summaries, error: fetchError } = await supabase
      .from("monthly_recibo_summaries")
      .select("*")
      .eq("month", monthStr)
      .eq("processed", false);

    if (fetchError) throw fetchError;

    if (!summaries || summaries.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum resumo pendente para processar", month: monthStr }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Due date: 10th of the current month
    const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;

    const invoicesToInsert = summaries
      .filter((s) => s.total > 0)
      .map((s) => ({
        entity_id: s.cliente_id,
        entity_name: s.cliente_name,
        entity_type: "client",
        description: `Serviços prestados - ${referenceMonth}`,
        value: s.total,
        due_date: dueDate,
        reference_month: referenceMonth,
        status: "open",
        attachments: [],
      }));

    if (invoicesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("financial_invoices")
        .insert(invoicesToInsert);

      if (insertError) throw insertError;
    }

    // Mark summaries as processed
    const ids = summaries.map((s) => s.id);
    const { error: updateError } = await supabase
      .from("monthly_recibo_summaries")
      .update({ processed: true })
      .in("id", ids);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        message: `${invoicesToInsert.length} lançamento(s) criado(s) para ${referenceMonth}`,
        month: monthStr,
        count: invoicesToInsert.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
