require("dotenv").config();
const express = require("express");
const path = require("path");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function askGemini(prompt) {
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1800 },
    }),
  });
  if (!res.ok) throw new Error("Gemini error: " + await res.text());
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const arr = JSON.parse(clean);
  if (!Array.isArray(arr) || !arr.length) throw new Error("Parse failed");
  return arr;
}

// Law Terms
app.post("/api/law", async (req, res) => {
  const { exclude = [] } = req.body;
  const ex = exclude.length ? `Do NOT repeat: ${exclude.slice(0, 25).join(", ")}.` : "";
  try {
    const items = await askGemini(`Generate exactly 5 English law terms. ${ex}
Return ONLY a valid JSON array, no markdown:
[{"term":"Habeas Corpus","latin":"You shall have the body","english":"A legal order requiring a detained person to be brought before a judge to determine whether the detention is lawful.","telugu":"అక్రమంగా నిర్బంధించిన వ్యక్తిని న్యాయస్థానం ముందు హాజరుపరచమని ఇచ్చే ఆదేశం. వ్యక్తి స్వేచ్ఛను రక్షించే ముఖ్యమైన హక్కు.","example":"The lawyer filed a habeas corpus petition to challenge her client's imprisonment without trial."}]
Mix: Latin maxims, procedural, contract, tort, criminal law. Exactly 5 objects.`);
    res.json({ items });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Vocabulary
app.post("/api/voc", async (req, res) => {
  const { exclude = [] } = req.body;
  const ex = exclude.length ? `Do NOT repeat: ${exclude.slice(0, 25).join(", ")}.` : "";
  try {
    const items = await askGemini(`Generate exactly 5 useful English vocabulary words. ${ex}
Return ONLY a valid JSON array, no markdown:
[{"word":"Ephemeral","partOfSpeech":"adjective","english":"Lasting for a very short time; transitory and fleeting.","telugu":"క్షణికమైన, తాత్కాలికమైన. చాలా తక్కువ కాలం మాత్రమే నిలిచేది. శాశ్వతం కానిది.","example":"The ephemeral beauty of cherry blossoms makes people travel miles to witness it."}]
Mix adjectives, verbs, nouns — varied difficulty. Exactly 5 objects.`);
    res.json({ items });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  const interfaces = os.networkInterfaces();
  let localIP = "localhost";
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) { localIP = addr.address; break; }
    }
  }
  console.log("\n📚 Strong Vocab (Gemini FREE) is running!\n");
  console.log(`💻 Computer → http://localhost:${PORT}`);
  console.log(`📱 Phone    → http://${localIP}:${PORT}`);
  console.log(`\n(Phone & Computer must be on same WiFi)\n`);
});
