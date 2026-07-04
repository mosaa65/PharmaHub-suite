import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(system: string, user: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI gateway not configured");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`AI gateway error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

export const analyzeInteractions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        drugs: z.array(z.string().min(1)).min(2).max(15),
        lang: z.enum(["ar", "en"]).default("ar"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const lower = data.drugs.map((d) => d.toLowerCase().trim());

    // DB lookup for any pair
    const { data: known } = await context.supabase
      .from("drug_interactions")
      .select("*");

    const dbMatches = (known ?? []).filter((row: any) => {
      const a = String(row.drug_a).toLowerCase();
      const b = String(row.drug_b).toLowerCase();
      return (
        lower.some((d) => d.includes(a) || a.includes(d)) &&
        lower.some((d) => d.includes(b) || b.includes(d)) &&
        a !== b
      );
    });

    let aiText = "";
    try {
      const sys =
        data.lang === "ar"
          ? "أنت صيدلي سريري خبير. حلّل التداخلات الدوائية المحتملة بين القائمة المقدّمة. أعطِ ردًا قصيرًا منظّمًا بنقاط: لكل تداخل اذكر الأدوية المشتركة، شدة التداخل (شديد/متوسط/خفيف)، الآلية، والتوصية. إن لم توجد تداخلات مهمة قل ذلك صراحة. تنبيه: استشارة الطبيب ضرورية."
          : "You are an expert clinical pharmacist. Analyze potential drug interactions among the provided list. Reply concisely as bullets: drugs involved, severity (severe/moderate/mild), mechanism, recommendation. Say so if none significant. Note: clinician review required.";
      aiText = await callAI(sys, `Drugs: ${data.drugs.join(", ")}`);
    } catch (e: any) {
      aiText = "";
    }

    return { dbMatches, aiText };
  });

export const recommendDosage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        drug: z.string().min(1),
        age: z.number().int().min(0).max(120).optional(),
        weight: z.number().min(0).max(400).optional(),
        condition: z.string().max(200).optional(),
        lang: z.enum(["ar", "en"]).default("ar"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sys =
      data.lang === "ar"
        ? "أنت صيدلي سريري. اقترح الجرعة المعتادة للدواء حسب العمر/الوزن إن توفّرا، مع التكرار، المدة المعتادة، أعلى جرعة يومية، وتحذيرات مهمة، ومتى يجب الرجوع للطبيب. اجعل الرد قصيرًا ومنظّمًا. تنبيه إخلاء مسؤولية: للاسترشاد فقط."
        : "You are a clinical pharmacist. Suggest typical adult/pediatric dose by age/weight if given, with frequency, usual duration, max daily dose, key warnings, and when to refer to physician. Keep it concise and structured. Disclaimer: guidance only.";
    const u = `Drug: ${data.drug}\nAge: ${data.age ?? "?"}\nWeight (kg): ${data.weight ?? "?"}\nCondition: ${data.condition ?? "-"}`;
    const text = await callAI(sys, u);
    return { text };
  });

const TurnSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string(),
});

export const smartTriage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        patient: z
          .object({
            age: z.number().int().min(0).max(120).optional(),
            weight: z.number().min(0).max(400).optional(),
            sex: z.enum(["male", "female", "other"]).optional(),
            pregnant: z.boolean().optional(),
            allergies: z.array(z.string()).optional(),
            currentMeds: z.array(z.string()).optional(),
            chiefComplaint: z.string().max(500).optional(),
          })
          .default({}),
        history: z.array(TurnSchema).max(30).default([]),
        answer: z.string().max(500).optional(),
        lang: z.enum(["ar", "en"]).default("ar"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sys =
      data.lang === "ar"
        ? `أنت مساعد صيدلي سريري ذكي. مهمتك مساعدة الصيدلي في تقييم شكوى المريض عبر أسئلة تشخيصية قصيرة، ثم تقديم اقتراح تشخيصي وتوصيات دوائية بجرعات مناسبة.
اسأل سؤالاً واحداً فقط في كل مرة، بلغة بسيطة قابلة للترجمة للمريض. قدّم دائماً 2-5 خيارات إجابة سريعة (نعم/لا أو خيارات محددة).
اجمع بيانات كافية (المدة، الشدة، الأعراض المصاحبة، الحمى، التاريخ المرضي، الحساسية) قبل التوصية.
عندما تكون واثقاً ⩾ 70%، أعطِ التقييم النهائي.
حذّر من علامات الخطر (red flags) واطلب تحويلاً للطبيب عند الحاجة.
راعِ الحمل والرضاعة والأطفال وكبار السن وقصور الكلى/الكبد.
أخرج JSON فقط بالشكل التالي دون أي نص إضافي:
{
 "done": false,
 "question": "سؤال قصير للمريض",
 "options": ["خيار1","خيار2"],
 "rationale": "لماذا تسأل"
}
أو عند الانتهاء:
{
 "done": true,
 "assessment": {
   "likely_conditions": [{"name":"...","confidence":0.8,"reason":"..."}],
   "red_flags": ["..."],
   "refer_to_doctor": false,
   "recommendations": [
     {"drug":"...","dose":"...","frequency":"...","duration":"...","notes":"..."}
   ],
   "lifestyle_advice": ["..."],
   "warnings": ["..."]
 }
}`
        : `You are a smart clinical pharmacist copilot. Help the pharmacist triage a patient with short diagnostic questions, then propose a likely condition and drug/dose recommendations.
Ask ONE question at a time in plain language with 2-5 quick-reply options (yes/no or specific choices).
Gather enough data (duration, severity, associated symptoms, fever, history, allergies) before recommending.
When confidence ≥ 70%, give a final assessment.
Flag red flags and refer to a physician when needed.
Consider pregnancy, breastfeeding, pediatrics, elderly, renal/hepatic impairment.
Return JSON only, no extra text:
{"done":false,"question":"...","options":["a","b"],"rationale":"..."}
or when finished:
{"done":true,"assessment":{"likely_conditions":[{"name":"...","confidence":0.8,"reason":"..."}],"red_flags":["..."],"refer_to_doctor":false,"recommendations":[{"drug":"...","dose":"...","frequency":"...","duration":"...","notes":"..."}],"lifestyle_advice":["..."],"warnings":["..."]}}`;

    const history = [...data.history];
    if (data.answer) history.push({ role: "user", content: data.answer });

    const patientLine = JSON.stringify(data.patient);
    const convo = history
      .map((m) => `${m.role === "assistant" ? "Pharmacist-AI" : "Patient"}: ${m.content}`)
      .join("\n");

    const user = `PATIENT PROFILE: ${patientLine}\n\nCONVERSATION SO FAR:\n${convo || "(none yet — start with the first question)"}\n\nRespond with ONLY the next JSON object.`;

    const raw = await callAI(sys, user);
    const cleaned = raw
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          parsed = { done: false, question: cleaned, options: [] };
        }
      } else {
        parsed = { done: false, question: cleaned, options: [] };
      }
    }

    if (parsed.done && parsed.assessment) {
      history.push({
        role: "assistant",
        content:
          (data.lang === "ar" ? "التقييم النهائي" : "Final assessment") + " ✔",
      });
    } else if (parsed.question) {
      history.push({ role: "assistant", content: parsed.question });
    }

    return { result: parsed, history };
  });

