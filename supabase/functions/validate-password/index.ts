import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compare, hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { password, type } = await req.json();

    if (!password || !type) {
      return new Response(
        JSON.stringify({ valid: false, error: "Missing password or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTypes = ["access_password", "financial_password", "reports_password"];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", type)
      .single();

    if (error || !data) {
      // Fallback to env var
      const envMap: Record<string, string> = {
        access_password: "VITE_SYSTEM_PASSWORD",
        financial_password: "VITE_FINANCIAL_PASSWORD",
        reports_password: "VITE_REPORTS_PASSWORD",
      };
      const envVal = Deno.env.get(envMap[type]) ?? "";
      const trimmed = password.trim();
      const valid = !!envVal && trimmed === envVal;

      if (valid) {
        // Auto-hash into DB
        const hashed = await hash(trimmed);
        await supabase.from("app_settings").upsert({ key: type, value: hashed });
      }

      return new Response(
        JSON.stringify({ valid }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storedValue = data.value?.trim() ?? "";
    const trimmedPassword = password.trim();
    let valid = false;

    if (storedValue.startsWith("$2a$") || storedValue.startsWith("$2b$") || storedValue.startsWith("$2y$")) {
      valid = await compare(trimmedPassword, storedValue);
    } else if (storedValue && storedValue !== "PLACEHOLDER") {
      valid = trimmedPassword === storedValue;
      // Auto-hash plaintext passwords
      if (valid) {
        const hashed = await hash(trimmedPassword);
        await supabase.from("app_settings").update({ value: hashed }).eq("key", type);
      }
    }

    // Fallback to env var
    if (!valid) {
      const envMap: Record<string, string> = {
        access_password: "VITE_SYSTEM_PASSWORD",
        financial_password: "VITE_FINANCIAL_PASSWORD",
        reports_password: "VITE_REPORTS_PASSWORD",
      };
      const envVal = Deno.env.get(envMap[type]) ?? "";
      valid = !!envVal && trimmedPassword === envVal;

      if (valid) {
        const hashed = await hash(trimmedPassword);
        await supabase.from("app_settings").update({ value: hashed }).eq("key", type);
      }
    }

    return new Response(
      JSON.stringify({ valid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
