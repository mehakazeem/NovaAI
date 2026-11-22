 const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// Static files (index.html, style.css, script.js, images) serve karne ke liye
app.use(express.static(__dirname));

// Main route ("/") par index.html dikhane ke liye
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Environment variable se Gemini API Key read karein (quotes ke bagair)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Live Crypto Prices & 4H/1H Candles fetch karne ka helper (Binance)
async function getLiveCryptoContext(userMessage) {
    const pairs = {
        btc: "BTCUSDT", bitcoin: "BTCUSDT",
        eth: "ETHUSDT", ethereum: "ETHUSDT",
        sol: "SOLUSDT", solana: "SOLUSDT",
        near: "NEARUSDT",
        strk: "STRKUSDT", starknet: "STRKUSDT",
        sui: "SUIUSDT",
        bnb: "BNBUSDT",
        xrp: "XRPUSDT",
        doge: "DOGEUSDT",
        ada: "ADAUSDT",
        avax: "AVAXUSDT",
        link: "LINKUSDT",
        pepe: "PEPEUSDT",
        arb: "ARBUSDT",
        op: "OPUSDT",
        ton: "TONUSDT",
        trx: "TRXUSDT",
        dot: "DOTUSDT",
        ltc: "LTCUSDT"
    };

    const lower = userMessage.toLowerCase().replace(/(usdt|usd)/g, " ");
    const tfMatch = userMessage.match(/\b(1m|5m|15m|30m|1h|2h|4h|6h|12h|1d|1w)\b/i);
    const tf = tfMatch ? tfMatch[0].toLowerCase() : "4h";

    const foundSymbols = [];
    for (const [k, sym] of Object.entries(pairs)) {
        const rx = new RegExp(`(?:^|[^a-z0-9])${k}(?:$|[^a-z0-9])`, "i");
        if (rx.test(lower) && !foundSymbols.includes(sym)) {
            foundSymbols.push(sym);
        }
    }

    if (foundSymbols.length === 0) return "";

    const notes = [];
    for (const sym of foundSymbols.slice(0, 3)) {
        try {
            const [tRes, kRes] = await Promise.all([
                fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`),
                fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=16`)
            ]);
            if (!tRes.ok || !kRes.ok) continue;

            const t = await tRes.json();
            const k = await kRes.json();

            const price = parseFloat(t.lastPrice);
            const chg = parseFloat(t.priceChangePercent).toFixed(2);
            const lows = k.slice(-12).map(c => parseFloat(c[3]));
            const highs = k.slice(-12).map(c => parseFloat(c[2]));
            const sup = Math.min(...lows);
            const res = Math.max(...highs);

            notes.push(
                `[Live Binance Data for ${sym} (${tf.toUpperCase()})]: Current Price = $${price}, 24h Change = ${chg}%, 24h Low = $${t.lowPrice}, 24h High = $${t.highPrice}, Recent ${tf.toUpperCase()} Swing Support = $${sup}, Recent ${tf.toUpperCase()} Swing Resistance = $${res}.`
            );
        } catch (_) {}
    }

    return notes.join("\n");
}

app.post("/api/chat", async (req, res) => {
    try {
        const { message, history = [], fileInfo = null } = req.body || {};
        if (!message && !fileInfo) {
            return res.status(400).json({ error: "Message is required" });
        }

        if (!GEMINI_API_KEY) {
            return res.status(400).json({
                error: "Please set GEMINI_API_KEY in environment variables"
            });
        }

        const liveMarketContext = await getLiveCryptoContext(message || "");

        const systemInstruction = `You are NovaAI, an intelligent, warm, and super-helpful AI assistant created by Mehak Azeem.
- Respond naturally in the same language/style the user uses (Roman Urdu, English, or Urdu).
- Use clean bullet points and bold headings when explaining multi-part answers.
- You have Google Search access for up-to-date 2026 world events, celebrities (like BTS V), books, places, forex, and stocks.
- When live Binance crypto data is provided in context, use those exact numbers to give a clear trend, support/resistance, and educational setup (always remind that trading involves risk and is not financial advice).
- Never say you are a generic fallback template; answer directly and clearly like Gemini.`;

        const contents = [];

        // Pichli conversation ke last 6 messages context ke liye
        for (const h of history.slice(-6)) {
            if (h && h.text) {
                contents.push({
                    role: h.sender === "user" ? "user" : "model",
                    parts: [{ text: h.text }]
                });
            }
        }

        const currentParts = [];
        let combinedUserPrompt = message || "Analyze the attached file.";

        if (liveMarketContext) {
            combinedUserPrompt += `\n\n${liveMarketContext}`;
        }

        if (fileInfo && fileInfo.textContent) {
            combinedUserPrompt += `\n\n[Attached File: ${fileInfo.name}]\n${fileInfo.textContent}`;
        }

        currentParts.push({ text: combinedUserPrompt });

        // Agar image upload ki ho toh Gemini Vision mein bhejein!
        if (fileInfo && fileInfo.dataUrl && fileInfo.type && fileInfo.type.startsWith("image/")) {
            const base64Data = fileInfo.dataUrl.split(",")[1];
            if (base64Data) {
                currentParts.push({
                    inlineData: {
                        mimeType: fileInfo.type,
                        data: base64Data
                    }
                });
            }
        }

        contents.push({ role: "user", parts: currentParts });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
        const apiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents
            })
        });

        const data = await apiRes.json();

        if (!apiRes.ok) {
            const errMsg = data?.error?.message || "Gemini API error";
            return res.status(500).json({ error: errMsg });
        }

        const replyText =
            data?.candidates?.[0]?.content?.parts
                ?.map(p => p.text || "")
                .join("\n")
                .trim() || "Jawab tayar nahi ho saka, dobara try karein.";

        res.json({ reply: replyText });
    } catch (err) {
        res.status(500).json({ error: err.message || "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ NovaAI Gemini Backend running at http://localhost:${PORT}`);
});
