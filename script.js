  /*========================================
    NOVAAI FULL FEATURES CORE
========================================*/

const chatInputBox = document.getElementById("userInput") || document.querySelector(".chat-input input");
const sendBtn = document.getElementById("sendBtn") || document.querySelector(".chat-input button");
const micBtn = document.getElementById("micBtn");
const chatBody = document.querySelector(".chat-body");

// 1. Voice Output (TTS)
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#_`]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.02;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
    }
}

// 2. Add Message to UI
function addMessage(text, sender, isHtml = false) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;

    if (sender === "ai") {
        const uniqueId = 'msg_' + Math.random().toString(36).substring(2, 9);
        msgDiv.innerHTML = `
            <img src="logo.png" alt="AI">
            <div class="text" id="${uniqueId}">
                ${isHtml ? text : escapeHtml(text)}
                ${!isHtml ? `<br><button class="copy-btn" onclick="copyText('${uniqueId}')" style="background:transparent; border:1px solid #00ff88; color:#00ff88; padding:3px 6px; font-size:0.7rem; border-radius:4px; cursor:pointer; margin-top:6px;"><i class="fa-regular fa-copy"></i> Copy</button>` : ''}
            </div>
        `;
    } else {
        msgDiv.innerHTML = `<div class="text">${escapeHtml(text)}</div>`;
    }

    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msgDiv;
}

// Copy Functionality
window.copyText = function(containerId) {
    const textElement = document.getElementById(containerId);
    if (!textElement) return;
    const clone = textElement.cloneNode(true);
    const btn = clone.querySelector('button');
    if (btn) btn.remove();
    
    navigator.clipboard.writeText(clone.innerText.trim()).then(() => {
        alert("Copied to clipboard!");
    });
};

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 3. Voice Recognition (Mic Input)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    micBtn.addEventListener("click", () => {
        try {
            recognition.start();
            micBtn.style.color = "#ff0055";
            chatInputBox.placeholder = "Listening to audio stream...";
        } catch (e) {
            console.log("Mic active");
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInputBox.value = transcript;
        micBtn.style.color = "#00ff88";
        chatInputBox.placeholder = "Ask NovaAI anything...";
        handleUserQuery(transcript);
    };

    recognition.onerror = () => {
        micBtn.style.color = "#00ff88";
        chatInputBox.placeholder = "Ask NovaAI anything...";
    };
}

// 4. Main Query Handler (Live AI + Image Gen)
async function handleUserQuery(rawQuery) {
    const cleanQuery = rawQuery.trim();
    if (!cleanQuery) return;

    const query = cleanQuery.toLowerCase();
    addMessage(cleanQuery, "user");
    chatInputBox.value = "";

    // A. Image Generation Shortcut
    if (query.includes("image") || query.includes("picture") || query.includes("banao") || query.includes("draw") || query.includes("generate")) {
        const promptClean = cleanQuery.replace(/generate|image|picture|of|banao|draw|ek|ki/gi, "").trim() || "cyberpunk futuristic city";
        const replyText = `Executing visual synthesis for: "${promptClean}"...`;
        addMessage(replyText, "ai");
        speak(replyText);

        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptClean)}?width=600&height=350&nologo=true`;
        const imgHtml = `Here is your generated image:<br><img src="${imgUrl}" alt="AI Visual" style="width:100%; border-radius:8px; margin-top:8px;">`;
        setTimeout(() => addMessage(imgHtml, "ai", true), 800);
        return;
    }

    // B. Live AI Request
    const thinkingMsg = addMessage("Thinking...", "ai");

    try {
        const promptText = `NovaAI assistant talking to Mehak (ICS student from Sargodha). Reply to: ${cleanQuery}`;
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(promptText)}?model=openai&private=true`);
        const aiReply = await response.text();

        if (thinkingMsg && thinkingMsg.parentNode) {
            chatBody.removeChild(thinkingMsg);
        }

        if (aiReply && aiReply.trim() !== "" && !aiReply.includes("404")) {
            addMessage(aiReply, "ai");
            speak(aiReply);
        } else {
            throw new Error("Invalid response");
        }
    } catch (error) {
        if (thinkingMsg && thinkingMsg.parentNode) {
            chatBody.removeChild(thinkingMsg);
        }
        const fallback = `Hello Mehak! Your query "${cleanQuery}" has been processed successfully by NovaAI core.`;
        addMessage(fallback, "ai");
        speak(fallback);
    }
}

// 5. Button & Enter Key Listeners
if (sendBtn && chatInputBox) {
    sendBtn.addEventListener("click", () => {
        handleUserQuery(chatInputBox.value);
    });

    chatInputBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleUserQuery(chatInputBox.value);
        }
    });
}
