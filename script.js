  /*========================================
    NOVAAI FINAL CORE (COMMANDS + LIVE CRYPTO + VOICE + HISTORY)
========================================*/

const chatInputBox = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const chatBody = document.getElementById("chatBody") || document.querySelector(".chat-body");
const sidebarHistory = document.getElementById("sidebarHistory");
const voiceToggleBtn = document.getElementById("voiceToggleBtn");
const voiceIcon = document.getElementById("voiceIcon");
const newChatBtn = document.getElementById("newChatBtn");

const ELEVENLABS_API_KEY = "sk_2de989c181095b947ba0718202956d5607e75fa5ffcc5264";
let isVoiceEnabled = true;

// Voice Toggle
if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", () => {
        isVoiceEnabled = !isVoiceEnabled;
        if (isVoiceEnabled) {
            voiceToggleBtn.classList.remove("muted");
            if (voiceIcon) voiceIcon.className = "fa-solid fa-volume-high";
            speak("Voice enabled");
        } else {
            voiceToggleBtn.classList.add("muted");
            if (voiceIcon) voiceIcon.className = "fa-solid fa-volume-xmark";
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        }
    });
}

// New Chat Button
if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
        localStorage.removeItem("novaai_chat_history");
        chatBody.innerHTML = `
            <div class="message ai">
                <img src="logo.png" alt="AI">
                <div class="text">
                    ✨ New chat started! How can NovaAI help you today? 🚀
                </div>
            </div>
        `;
        renderSidebarHistory();
    });
}

// Startup Load
document.addEventListener("DOMContentLoaded", () => {
    loadChatHistory();
    renderSidebarHistory();
});

// Speak Function
async function speak(text) {
    if (!isVoiceEnabled) return;

    const cleanText = text
        .replace(/https?:\/\/[^\s]+/g, "")
        .replace(/[*#_`|~-]/g, " ")
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, "")
        .trim();

    if (!cleanText) return;
    const speechText = cleanText.length > 350 ? cleanText.substring(0, 350) + "..." : cleanText;

    const isUrduOrRoman = /[a-z]/i.test(speechText) && (
        speechText.includes("hai") || speechText.includes("hain") ||
        speechText.includes("kya") || speechText.includes("mein") ||
        speechText.includes("aur") || speechText.includes("kese") ||
        /[\u0600-\u06FF]/.test(speechText)
    );

    const selectedVoiceId = isUrduOrRoman ? "EXAVITQu4vr4xnSDxMaL" : "21m00Tcm4TlvDq8ikWAM";

    if (ELEVENLABS_API_KEY && ELEVENLABS_API_KEY !== "YOUR_ELEVENLABS_API_KEY_HERE") {
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
                method: "POST",
                headers: {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: speechText,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: { stability: 0.50, similarity_boost: 0.75 }
                })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audio = new Audio(URL.createObjectURL(audioBlob));
                audio.play();
                return;
            }
        } catch (e) {
            console.warn("ElevenLabs fallback:", e);
        }
    }

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 1.0;
        utterance.lang = isUrduOrRoman ? "ur-PK" : "en-US";
        window.speechSynthesis.speak(utterance);
    }
}

function formatCleanText(rawText) {
    let text = rawText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    text = text.replace(/\|/g, " • ").replace(/[-]{3,}/g, "");
    text = text.replace(/^### (.*$)/gim, '<h4 style="color:#00E5FF; margin:10px 0 5px 0;">$1</h4>');
    text = text.replace(/^## (.*$)/gim, '<h3 style="color:#00E5FF; margin:12px 0 6px 0;">$1</h3>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00ff88;">$1</strong>');
    text = text.replace(/^\* /gim, "• ").replace(/^- /gim, "• ");
    text = text.replace(/\n/g, "<br>");
    return text;
}

function addMessage(text, sender, isRawHtml = false, saveToStorage = true) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    const uniqueId = "msg_" + Math.random().toString(36).substring(2, 9);
    msgDiv.setAttribute("id", uniqueId);

    if (sender === "ai") {
        const formattedContent = isRawHtml ? text : formatCleanText(text);
        msgDiv.innerHTML = `
            <img src="logo.png" alt="AI">
            <div class="text" style="line-height: 1.6;">
                ${formattedContent}
                ${!isRawHtml ? `
                    <div style="margin-top:8px; display:flex; gap:10px;">
                        <button onclick="copyText('${uniqueId}')" style="background:transparent; border:1px solid #00ff88; color:#00ff88; padding:3px 6px; font-size:0.7rem; border-radius:4px; cursor:pointer;"><i class="fa-regular fa-copy"></i> Copy</button>
                        <button onclick="regenerateLast()" style="background:transparent; border:1px solid #00E5FF; color:#00E5FF; padding:3px 6px; font-size:0.7rem; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-rotate"></i> Regenerate</button>
                    </div>` : ""}
            </div>
        `;
    } else {
        msgDiv.innerHTML = `<div class="text">${escapeHtml(text)}</div>`;
    }

    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    if (saveToStorage) saveChatToLocalStorage();
    return msgDiv;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function saveChatToLocalStorage() {
    const messages = [];
    document.querySelectorAll(".chat-body .message").forEach(msg => {
        const isUser = msg.classList.contains("user");
        const textElem = msg.querySelector(".text");
        if (textElem) {
            messages.push({ sender: isUser ? "user" : "ai", text: textElem.innerHTML });
        }
    });
    localStorage.setItem("novaai_chat_history", JSON.stringify(messages));
    renderSidebarHistory();
}

function loadChatHistory() {
    const saved = localStorage.getItem("novaai_chat_history");
    if (!saved) return;
    try {
        const messages = JSON.parse(saved);
        if (messages.length > 1) {
            messages.forEach(m => {
                if (!m.text.includes("Hello Mehak") && !m.text.includes("New chat started")) {
                    const msgDiv = document.createElement("div");
                    msgDiv.className = `message ${m.sender}`;
                    msgDiv.innerHTML = m.sender === "ai"
                        ? `<img src="logo.png" alt="AI"><div class="text">${m.text}</div>`
                        : `<div class="text">${m.text}</div>`;
                    chatBody.appendChild(msgDiv);
                }
            });
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    } catch (e) {
        console.error("Error loading history:", e);
    }
}

function renderSidebarHistory() {
    if (!sidebarHistory) return;
    sidebarHistory.innerHTML = "";
    const userQueries = [];
    document.querySelectorAll(".message.user .text").forEach(el => {
        userQueries.push(el.innerText.trim());
    });

    userQueries.slice(-6).reverse().forEach(q => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerText = q;
        item.onclick = () => handleUserQuery(q);
        sidebarHistory.appendChild(item);
    });
}

window.regenerateLast = function () {
    const userMsgs = document.querySelectorAll(".message.user");
    if (userMsgs.length > 0) {
        const lastQuery = userMsgs[userMsgs.length - 1].innerText.trim();
        handleUserQuery(lastQuery);
    }
};

window.copyText = function (containerId) {
    const textElement = document.getElementById(containerId);
    if (!textElement) return;
    const clone = textElement.cloneNode(true);
    clone.querySelectorAll("div").forEach(b => b.remove());
    navigator.clipboard.writeText(clone.innerText.trim()).then(() => alert("Copied to clipboard!"));
};

window.selectUseCase = function (useCaseName) {
    const promptText = `Give me a short, clean 4-bullet point guide for ${useCaseName}.`;
    document.getElementById("chat").scrollIntoView({ behavior: "smooth" });
    handleUserQuery(promptText);
};

window.selectPlan = function (planName) {
    const promptText = `I want to subscribe to the ${planName} plan. Please guide me through the features and setup.`;
    document.getElementById("chat").scrollIntoView({ behavior: "smooth" });
    handleUserQuery(promptText);
};

// Mic Input
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    micBtn.addEventListener("click", () => {
        try {
            recognition.start();
            micBtn.style.color = "#ff0055";
        } catch (e) {}
    });
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInputBox.value = transcript;
        micBtn.style.color = "#00ff88";
        handleUserQuery(transcript);
    };
    recognition.onerror = () => { micBtn.style.color = "#00ff88"; };
}

// ==========================================
// MAIN COMMAND & QUERY HANDLER
// ==========================================
async function handleUserQuery(rawQuery) {
    const cleanQuery = rawQuery.trim();
    if (!cleanQuery) return;

    const queryLower = cleanQuery.toLowerCase();
    addMessage(cleanQuery, "user");
    chatInputBox.value = "";

    // 1. MUSIC COMMAND (Direct window.open - No setTimeout so browser doesn't block)
    if (queryLower.includes("music") || queryLower.includes("gana") || queryLower.includes("song")) {
        window.open("https://music.youtube.com", "_blank");
        const reply = '🎵 Opening <a href="https://music.youtube.com" target="_blank" style="color:#00ff88; text-decoration:underline;">YouTube Music</a> for you... 🚀';
        addMessage(reply, "ai", true);
        speak("Opening YouTube Music for you.");
        return;
    }

    // 2. YOUTUBE COMMAND
    if (queryLower.includes("youtube") || queryLower.includes("drama") || queryLower.includes("video")) {
        const searchTerm = cleanQuery
            .replace(/youtube|open|karo|kholo|play|drama|video|chalao/gi, "")
            .trim();
        const targetUrl = searchTerm
            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`
            : "https://www.youtube.com";
        window.open(targetUrl, "_blank");
        const reply = searchTerm
            ? `📺 Opening <a href="${targetUrl}" target="_blank" style="color:#00ff88; text-decoration:underline;">YouTube for "${searchTerm}"</a>... 🚀`
            : '📺 Opening <a href="https://www.youtube.com" target="_blank" style="color:#00ff88; text-decoration:underline;">YouTube</a> for you... 🚀';
        addMessage(reply, "ai", true);
        speak(searchTerm ? `Opening YouTube for ${searchTerm}` : "Opening YouTube for you.");
        return;
    }

    // 3. GOOGLE COMMAND
    if (queryLower.includes("google")) {
        window.open("https://www.google.com", "_blank");
        const reply = '🌐 Opening <a href="https://www.google.com" target="_blank" style="color:#00ff88; text-decoration:underline;">Google</a> for you... ✨';
        addMessage(reply, "ai", true);
        speak("Opening Google for you.");
        return;
    }

    // 4. LIVE CRYPTO PRICE (CoinGecko API)
    if (queryLower.includes("btc") || queryLower.includes("bitcoin") || (queryLower.includes("crypto") && queryLower.includes("price"))) {
        const thinkingMsg = addMessage("📈 Fetching live market data from CoinGecko...", "ai", false, false);
        try {
            const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
            const data = await response.json();
            if (thinkingMsg && thinkingMsg.parentNode) chatBody.removeChild(thinkingMsg);

            const btcUSD = data.bitcoin.usd.toLocaleString();
            const ethUSD = data.ethereum.usd.toLocaleString();
            const liveResult = `📊 <strong>Live Cryptocurrency Market Data:</strong><br>• <strong>Bitcoin (BTC):</strong> $${btcUSD} USD 🚀<br>• <strong>Ethereum (ETH):</strong> $${ethUSD} USD 💡<br>• <strong>Source:</strong> CoinGecko Live API ✨`;
            addMessage(liveResult, "ai", true);
            speak(`Bitcoin current price is ${btcUSD} US dollars.`);
            return;
        } catch (error) {
            if (thinkingMsg && thinkingMsg.parentNode) chatBody.removeChild(thinkingMsg);
            addMessage("⚠️ Unable to fetch live price right now. Please check your internet connection.", "ai");
            return;
        }
    }

    // 5. IMAGE GENERATION
    if (queryLower.includes("image") || queryLower.includes("picture") || queryLower.includes("banao") || queryLower.includes("draw") || queryLower.includes("generate")) {
        const promptClean = cleanQuery.replace(/generate|image|picture|of|banao|draw|ek|ki/gi, "").trim() || "cyberpunk futuristic city";
        const replyText = `🎨 Generating visual masterpiece for: "${promptClean}"... ✨`;
        addMessage(replyText, "ai");
        speak(replyText);

        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptClean)}?width=600&height=350&nologo=true`;
        const imgHtml = `Here is your generated image 🖼️:<br><img src="${imgUrl}" alt="AI Visual" style="width:100%; border-radius:8px; margin-top:8px;">`;
        setTimeout(() => addMessage(imgHtml, "ai", true), 800);
        return;
    }

    // 6. WORLD KNOWLEDGE & GENERAL AI RESPONSE
    const thinkingMsg = addMessage("🤖 Thinking & analyzing... ⚡", "ai", false, false);

    try {
        const systemInstruction = `You are NovaAI, an intelligent and helpful AI assistant created for Mehak. Answer any question clearly across science, technology, history, coding, and general knowledge. Use clean short bullet points and expressive emojis (🚀, 💡, ✨, 🧠, 🎯). Do NOT use markdown tables. If asked in Urdu or Roman Urdu, reply in natural Roman Urdu. User query: ${cleanQuery}`;
        
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(systemInstruction)}?model=openai&private=true`);
        const aiReply = await response.text();

        if (thinkingMsg && thinkingMsg.parentNode) chatBody.removeChild(thinkingMsg);

        if (aiReply.includes("Free limit reached") || aiReply.includes("429")) {
            const waitMsg = "⏳ Please wait a few seconds before sending the next message.";
            addMessage(waitMsg, "ai");
            speak(waitMsg);
            return;
        }

        if (aiReply && aiReply.trim() !== "" && !aiReply.includes("404")) {
            addMessage(aiReply, "ai");
            speak(aiReply);
        } else {
            throw new Error("Invalid response");
        }
    } catch (error) {
        if (thinkingMsg && thinkingMsg.parentNode) chatBody.removeChild(thinkingMsg);
        const fallback = `👋 Hello Mehak! Your request "${cleanQuery}" has been processed by NovaAI 🚀.`;
        addMessage(fallback, "ai");
        speak(fallback);
    }
}

// Event Listeners
if (sendBtn && chatInputBox) {
    sendBtn.addEventListener("click", () => handleUserQuery(chatInputBox.value));
    chatInputBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleUserQuery(chatInputBox.value);
        }
    });
}
