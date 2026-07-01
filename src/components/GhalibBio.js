// Special-cased response for questions about Ghalib Kamal, the creator of GI.
// Detected before hitting the Gemini API, so it's instant, always accurate,
// and never subject to hallucination or rate limits.

const GHALIB_QUERY_PATTERNS = [
  /\bwho\s+is\s+ghalib(\s+kamal)?\b/i,
  /\btell\s+me\s+about\s+ghalib(\s+kamal)?\b/i,
  /\babout\s+ghalib(\s+kamal)?\b/i,
  /\bghalib\s+kaun\s+hai\b/i,
  /\bghalib\s+kamal\s+kaun\s+hai\b/i,
  /\bghalib\s+ke\s+baare\s+me(in)?\b/i,
  /\bwho\s+(made|built|created|founded)\s+(you|gi)\b/i,
  /\byour\s+(founder|creator|maker)\b/i,
  /\btumhe\s+kisne\s+banaya\b/i,
  /\bgi\s+ko\s+kisne\s+banaya\b/i,
];

export function isGhalibQuery(text) {
  if (!text) return false;
  return GHALIB_QUERY_PATTERNS.some((p) => p.test(text));
}

export function getGhalibBio() {
  return `**Ghalib Kamal** — Founder & Creator of GI (Ghalib Intelligence)

Ghalib is a student-developer passionate about AI, software development, and building technology that helps people learn smarter. GI is his flagship project — an AI-powered study companion built end-to-end by him.

**🎓 Education**
- Secondary School: Delhi Public School, Fatehpur
- Senior Secondary: Saiyyed Hamid Senior Secondary School (Boys), Aligarh Muslim University
- Currently pursuing: **BS in Data Science, IIT Madras**

**💻 Skills**
- Web Development (React, JavaScript)
- Artificial Intelligence & AI Product Design
- Firebase & Cloud Infrastructure
- Full-stack App Development

**🎯 Mission**
To grow GI into a powerful, accessible AI platform that delivers high-quality education and productivity tools for students everywhere.

**👨‍👩‍👦 Family**
- Father: Shabbir Alam
- Mother: Musarrat Jahan
- Brothers: Shahid Kamal, Saquib Kamal, Sadique Kamal

If you'd like to connect with Ghalib or learn more about GI's roadmap, just ask!`;
}