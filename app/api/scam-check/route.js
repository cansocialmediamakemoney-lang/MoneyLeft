import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ruleCheck } from "@/lib/scamRules";
 
// Per-user rate limit (in memory — for production use Redis/Upstash)
const RATE = new Map();
const LIMIT = 10;        // 10 checks
const WINDOW = 60 * 60 * 1000; // per hour
 
function checkRate(userId) {
  const now = Date.now();
  const arr = (RATE.get(userId) || []).filter((t) => now - t < WINDOW);
  if (arr.length >= LIMIT) return false;
  arr.push(now);
  RATE.set(userId, arr);
  return true;
}
 
// Choose checker mode:
//  - "ai"     = always use Claude (errors if unavailable)
//  - "rules"  = always use rule-based (free, no API needed)
//  - "auto"   = try Claude, fall back to rules if API fails
// Set in your .env.local file with: SCAM_CHECKER_MODE=rules
const MODE = process.env.SCAM_CHECKER_MODE || "auto";
 
export async function POST(request) {
  // 1. Require login
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
 
  // 2. Rate limit
  if (!checkRate(user.id)) {
    return NextResponse.json({ error: "You've used your scam checks for the hour. Please try again later." }, { status: 429 });
  }
 
  // 3. Parse + validate input
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
 
  const text = (body.text || "").toString().trim();
  if (!text) return NextResponse.json({ error: "Please paste a message to check." }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: "Message is too long. Please paste a shorter version (under 4000 characters)." }, { status: 400 });
 
  // ─── Mode: rules-only (free, no API) ─────────────────────────────────────
  if (MODE === "rules" || !process.env.ANTHROPIC_API_KEY) {
    const result = ruleCheck(text);
    return NextResponse.json({ ...result, source: "rules" });
  }
 
  // ─── Mode: AI (try Claude, optionally fall back) ─────────────────────────
  const systemPrompt = `You are helping older adults identify likely scam messages (texts, emails, voicemails). The user pastes a suspicious message and you assess it.
 
You MUST respond with ONLY a JSON object — no extra text, no markdown fences. Schema:
{
  "verdict": "likely safe" | "suspicious" | "likely scam",
  "reasons": ["short plain-English reason", "another reason"],
  "advice": "one or two sentences in simple language about what to do next"
}
 
Guidelines:
- Use plain, simple language a 70-year-old can understand. No jargon.
- "likely scam" = clear scam patterns (urgency, threats, fake authority, gift cards, wire transfers, suspicious links, impersonation of IRS/SSA/Medicare/banks, etc.)
- "suspicious" = some red flags but uncertain
- "likely safe" = looks like a legitimate message
- Keep reasons short and concrete (8-15 words each, max 4 reasons).
- For advice, suggest: don't click links, call the company directly using a number from their official website or your card, ask family for a second opinion, never send gift cards or wire transfers based on a message.
- Never tell the user to do anything that could harm them. Never invent details not in the message.`;
 
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: `Please assess this message:\n\n${text}` }],
    });
 
    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
 
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
 
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // AI gave us junk — fall back to rules
      const result = ruleCheck(text);
      return NextResponse.json({ ...result, source: "rules" });
    }
 
    const allowed = ["likely safe", "suspicious", "likely scam"];
    const verdict = allowed.includes((parsed.verdict || "").toLowerCase()) ? parsed.verdict.toLowerCase() : "suspicious";
    const reasons = Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 4).map(String) : [];
    const advice = typeof parsed.advice === "string" ? parsed.advice : "";
 
    return NextResponse.json({ verdict, reasons, advice, source: "ai" });
  } catch (e) {
    console.error("Anthropic error (using fallback):", e?.message || e);
 
    // In "auto" mode, fall back silently to rules
    if (MODE === "auto") {
      const result = ruleCheck(text);
      return NextResponse.json({ ...result, source: "rules" });
    }
 
    // In "ai" mode, return an error
    return NextResponse.json({ error: "We couldn't check the message right now. Please try again in a moment." }, { status: 500 });
  }
}
 