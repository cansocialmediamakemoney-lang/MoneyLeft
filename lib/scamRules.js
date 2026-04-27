// ─────────────────────────────────────────────────────────────────────────────
// Rule-based scam detection — used when the AI is unavailable.
// Scores common scam patterns and returns the same shape as the AI response.
// ─────────────────────────────────────────────────────────────────────────────
 
const RULES = [
  // Urgency / pressure tactics
  { weight: 2, regex: /\b(urgent|immediately|right now|act now|right away|expires? (today|in \d+ (hours?|minutes?)))\b/i,
    reason: "Uses urgent or pressuring language to make you act quickly." },
  { weight: 2, regex: /\b(final notice|last warning|24 hours? to|48 hours? to)\b/i,
    reason: "Uses fake deadlines to pressure you." },
 
  // Threats
  { weight: 3, regex: /\b(arrested?|arrest warrant|legal action|lawsuit|court|prosecuted?|jail|prison|deported?)\b/i,
    reason: "Threatens you with arrest or legal trouble — real agencies don't do this by text or email." },
  { weight: 3, regex: /\b(suspended?|locked|frozen|terminated?|deactivated?|closed?)\s+(account|card|service)/i,
    reason: "Threatens that your account will be suspended or locked." },
 
  // Fake authority impersonation
  { weight: 3, regex: /\b(IRS|Internal Revenue|Social Security Administration|SSA|Medicare|FBI|DEA|customs|immigration)\b/i,
    reason: "Claims to be from a government agency — these agencies almost never contact you by text or email." },
  { weight: 2, regex: /\b(microsoft|apple|amazon|paypal|venmo|zelle|netflix|geek squad|norton)\b.*\b(account|security|alert|invoice|charge|refund)\b/i,
    reason: "Claims to be from a well-known company — scammers often impersonate trusted brands." },
  { weight: 2, regex: /\b(your bank|chase|wells fargo|bank of america|citibank|capital one|fidelity)\b.*\b(verify|confirm|unusual|fraud|alert)\b/i,
    reason: "Pretends to be your bank — banks won't ask you to verify info through text or email links." },
 
  // Money requests
  { weight: 4, regex: /\b(gift card|google play|itunes|steam card|apple card|prepaid card|target gift)\b/i,
    reason: "Asks for gift cards — this is almost always a scam. No real company or agency takes gift cards as payment." },
  { weight: 4, regex: /\b(wire transfer|western union|moneygram|bitcoin|crypto|cryptocurrency|cash app)\b/i,
    reason: "Asks for wire transfers, cryptocurrency, or money apps — scammers use these because they can't be traced." },
  { weight: 3, regex: /\b(send (\$|money)|pay(ment)? .{0,15}required|pay(ment)? .{0,15}immediately)\b/i,
    reason: "Demands money or payment quickly." },
 
  // Refund / prize scams
  { weight: 3, regex: /\b(refund|reimbursement)\b.*(\$\d+|click|link|verify|confirm)/i,
    reason: "Offers an unexpected refund and asks you to click a link — this is a common scam." },
  { weight: 3, regex: /\b(you('| have| have been| are a)?\s*(won|winner|selected)|congratulations|lottery|sweepstakes|prize)\b/i,
    reason: "Claims you've won a prize or lottery you didn't enter." },
  { weight: 3, regex: /\b(inheritance|beneficiary|nigerian|prince|widow|million dollars?)\b/i,
    reason: "Classic 'unexpected inheritance' scam pattern." },
 
  // Personal info requests
  { weight: 3, regex: /\b(verify|confirm|update)\s+(your\s+)?(account|identity|information|details|password|social security|ssn|credit card|bank)\b/i,
    reason: "Asks you to verify or confirm personal information — real companies don't ask this in messages." },
  { weight: 3, regex: /\b(social security number|ssn|date of birth|mother's maiden name|pin number)\b/i,
    reason: "Asks for highly sensitive personal information." },
 
  // Suspicious links
  { weight: 2, regex: /https?:\/\/[^\s]*(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly)[^\s]*/i,
    reason: "Contains a shortened link — these hide the real destination and are commonly used in scams." },
  { weight: 2, regex: /https?:\/\/(?!.*\.(gov|edu)[\/\s]).*\.(xyz|top|club|tk|ml|ga|cf|info|biz)[\/\s]/i,
    reason: "Contains a link with a suspicious domain ending often used by scammers." },
  { weight: 1, regex: /\bclick (here|the link|below)\b/i,
    reason: "Asks you to click a link — be careful, even if the message looks real." },
 
  // Tech support scams
  { weight: 3, regex: /\b(virus|malware|infected|compromised|hacked)\b.*\b(call|contact|support|technician)\b/i,
    reason: "Claims your device is infected and you need to call — this is a tech support scam." },
  { weight: 2, regex: /\b(remote access|teamviewer|anydesk|logmein)\b/i,
    reason: "Asks for remote access to your computer — never give this to someone who contacts you out of the blue." },
 
  // Romance / relationship scams
  { weight: 2, regex: /\b(my (dear|love|darling)|hello dear|sweetheart)\b/i,
    reason: "Uses overly affectionate language from someone you may not know well." },
 
  // Generic red flags
  { weight: 1, regex: /\b(do not (tell|inform|share)|keep this (secret|confidential|between us))\b/i,
    reason: "Tells you to keep the message secret — a major red flag." },
  { weight: 1, regex: /\b(dear (customer|user|sir|madam|account holder))\b/i,
    reason: "Generic greeting — a real company would use your name." },
  { weight: 1, regex: /\b(grammatical|spelling).{0,5}error/i,
    reason: "Contains language that suggests it wasn't written carefully." },
];
 
// Look for unprofessional patterns (multiple red flags from formatting)
function styleScore(text) {
  let score = 0;
  const reasons = [];
 
  // Lots of ALL CAPS
  const capsWords = (text.match(/\b[A-Z]{4,}\b/g) || []).length;
  if (capsWords >= 3) {
    score += 1;
    reasons.push("Uses excessive ALL CAPS — a common scam pattern.");
  }
 
  // Excessive punctuation
  if (/[!?]{3,}/.test(text)) {
    score += 1;
    reasons.push("Uses excessive exclamation or question marks.");
  }
 
  // Random characters in the middle of words (l1ke th1s)
  if (/\b[a-z]+[0-9]+[a-z]+\b/i.test(text) && /\b[a-z]+[0-9]+[a-z]+\b/i.test(text)) {
    score += 1;
    reasons.push("Contains words with numbers replacing letters — used to bypass spam filters.");
  }
 
  return { score, reasons };
}
 
export function ruleCheck(text) {
  const matched = [];
  let totalScore = 0;
 
  for (const rule of RULES) {
    if (rule.regex.test(text)) {
      matched.push(rule);
      totalScore += rule.weight;
    }
  }
 
  const style = styleScore(text);
  totalScore += style.score;
 
  // Deduplicate reasons (in case multiple rules matched similar patterns)
  const seen = new Set();
  const reasons = [];
  for (const rule of matched.sort((a, b) => b.weight - a.weight)) {
    if (!seen.has(rule.reason)) {
      seen.add(rule.reason);
      reasons.push(rule.reason);
    }
    if (reasons.length >= 4) break;
  }
  for (const r of style.reasons) {
    if (reasons.length < 4 && !seen.has(r)) {
      reasons.push(r);
      seen.add(r);
    }
  }
 
  // Decide verdict from total weighted score
  let verdict;
  if (totalScore >= 5)      verdict = "likely scam";
  else if (totalScore >= 2) verdict = "suspicious";
  else                      verdict = "likely safe";
 
  // Build advice
  let advice;
  if (verdict === "likely scam") {
    advice = "Do not click any links, call any numbers, or send any money. If the message claims to be from a company you use, call them directly using the phone number on your card or their official website.";
  } else if (verdict === "suspicious") {
    advice = "Be careful. Don't click links or share personal information. If you're unsure, ask a trusted family member, or call the company directly using a phone number you already have.";
  } else {
    advice = "This message doesn't show common scam warning signs, but always be cautious. When in doubt, contact the sender directly using a phone number or email you already trust.";
  }
 
  // If we have no reasons but the verdict is "likely safe", give a friendly note
  if (reasons.length === 0) {
    reasons.push("No common scam warning patterns were detected.");
  }
 
  return { verdict, reasons, advice };
}
