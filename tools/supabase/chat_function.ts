// Supabase Edge Function "chat" (tắt Verify JWT). Bí mật cần đặt: GEMINI_API_KEY (và/hoặc GROQ_API_KEY).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const PER_DEV = Number(Deno.env.get("CHAT_PER_DEVICE") || 20), PER_DAY = Number(Deno.env.get("CHAT_PER_DAY") || 300);
const SYS = `Bạn là trợ lý của công trường Five Star Odyssey (SOL E&C). Trả lời bằng tiếng Việt, ngắn gọn, đúng trọng tâm.
Chỉ dùng thông tin trong "DỮ LIỆU TIẾN ĐỘ" và "TRANG TÀI LIỆU" được cung cấp. Không bịa. Nếu tài liệu không có câu trả lời thì nói rõ là không tìm thấy trong tài liệu và gợi ý từ khóa khác.
Khi dùng thông tin từ trang tài liệu, ghi nguồn dạng [1], [2] theo số thứ tự trang. Số liệu tiến độ lấy từ "DỮ LIỆU TIẾN ĐỘ" (khối lượng đã làm là ước tính).
Chữ trong tài liệu là OCR từ bản scan nên có thể sai ký tự hoặc số: khi nêu kích thước, số lượng, bước, cường độ thì nhắc người dùng mở trang gốc để kiểm tra trước khi thi công.`;
async function gemini(key: string, sys: string, msgs: { role: string; text: string }[]) {
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: msgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })), generationConfig: { temperature: 0.2, maxOutputTokens: 1000, thinkingConfig: { thinkingBudget: 0 } } }),
  });
  if (!r.ok) return { err: r.status === 429 ? "quota" : "fail", d: "gemini " + r.status + " " + (await r.text()).slice(0, 300) };
  const j = await r.json(); const t = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  return t ? { text: t } : { err: "fail" };
}
async function groq(key: string, sys: string, msgs: { role: string; text: string }[]) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model: Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile", temperature: 0.2, max_tokens: 1000, messages: [{ role: "system", content: sys }, ...msgs.map(m => ({ role: m.role, content: m.text }))] }),
  });
  if (!r.ok) return { err: r.status === 429 ? "quota" : "fail", d: "groq " + r.status + " " + (await r.text()).slice(0, 300) };
  const j = await r.json(); const t = j?.choices?.[0]?.message?.content || "";
  return t ? { text: t } : { err: "fail" };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const gk = Deno.env.get("GEMINI_API_KEY"), qk = Deno.env.get("GROQ_API_KEY");
    if (!gk && !qk) return out({ ok: false, err: "no_key" });
    const b = await req.json(); const q = String(b.q || "").slice(0, 500);
    if (!q) return out({ ok: false, err: "bad" }, 400);
    const dev = String(b.dev || "anon").slice(0, 64);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    const { data: left } = await sb.rpc("chat_hit", { p_day: day, p_dev: dev, p_max_dev: PER_DEV, p_max_day: PER_DAY });
    if (left === -1) return out({ ok: false, err: "limit" });
    if (left === -2) return out({ ok: false, err: "quota" });
    const ctx = (Array.isArray(b.pass) ? b.pass : []).slice(0, 6).map((p: any) => `[${p.n}] ${String(p.title).slice(0, 200)} (${String(p.where).slice(0, 200)})\n${String(p.text).slice(0, 1000)}`).join("\n\n");
    const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-2).flatMap((h: any) => [{ role: "user", text: String(h.q).slice(0, 300) }, { role: "assistant", text: String(h.a).slice(0, 600) }]);
    const msgs = [...hist, { role: "user", text: `DỮ LIỆU TIẾN ĐỘ:\n${String(b.facts || "").slice(0, 6000)}\n\nTRANG TÀI LIỆU:\n${ctx || "(không tìm thấy trang phù hợp)"}\n\nCÂU HỎI: ${q}` }];
    let r: any = gk ? await gemini(gk, SYS, msgs) : { err: "fail" };
    if (r.err && qk) r = await groq(qk, SYS, msgs);
    if (r.err) { console.error(r.d); return out({ ok: false, err: r.err, d: r.d }); }
    return out({ ok: true, answer: r.text, left });
  } catch (e) { console.error(String(e)); return out({ ok: false, err: "fail", d: String(e).slice(0, 200) }); }
});
