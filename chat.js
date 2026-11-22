exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "GEMINI_API_KEY Netlify Environment Variables mein set nahi hai."
        })
      };
    }

    const { message, history = [], fileInfo = null } = JSON.parse(event.body || "{}");
    if (!message && !fileInfo) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Message is required" })
      };
    }

    const systemInstruction =
      "You are NovaAI, an intelligent, warm, and helpful AI assistant created by Mehak Azeem. Reply naturally in the user's language (Roman Urdu, English, or Urdu) using clear formatting.";

    const contents = [];
    for (const h of (Array.isArray(history) ? history : []).slice(-6)) {
      if (h && h.text) {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: String(h.text) }]
        });
      }
    }

    const currentParts = [{ text: message || "Analyze the attached file." }];

    if (fileInfo && fileInfo.textContent) {
      currentParts[0].text += `\n\n[Attached File: ${fileInfo.name}]\n${fileInfo.textContent}`;
    }

    if (fileInfo && fileInfo.dataUrl && fileInfo.type && fileInfo.type.startsWith("image/")) {
      const base64Data = String(fileInfo.dataUrl).split(",")[1];
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data?.error?.message || "Gemini API error" })
      };
    }

    const replyText =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("\n")
        .trim() || "Jawab tayar nahi ho saka, dobara try karein.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" })
    };
  }
};
