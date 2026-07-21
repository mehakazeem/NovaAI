/*========================================
        PRELOADER
========================================*/

const preloader = document.getElementById("preloader");

window.addEventListener("load", () => {

    preloader.style.opacity = "0";

    preloader.style.visibility = "hidden";

});


/*========================================
        STICKY NAVBAR
========================================*/

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.style.background = "rgba(5,8,22,.95)";
        header.style.boxShadow = "0 10px 30px rgba(0,229,255,.15)";

    } else {

        header.style.background = "rgba(5,8,22,.75)";
        header.style.boxShadow = "none";

    }

});


/*========================================
        SCROLL TO TOP BUTTON
========================================*/

const scrollBtn = document.getElementById("scrollTop");

window.addEventListener("scroll", () => {

    if (window.scrollY > 400) {

        scrollBtn.style.display = "block";

    } else {

        scrollBtn.style.display = "none";

    }

});


scrollBtn.addEventListener("click", () => {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

});


/*========================================
        SMOOTH SCROLL
========================================*/

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        document.querySelector(this.getAttribute("href")).scrollIntoView({

            behavior: "smooth"

        });

    });

});/*========================================
        FADE UP ANIMATION
========================================*/

const fadeElements = document.querySelectorAll(
".feature-card, .price-card, .chat-container, .contact-container, .section-title"
);

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("fade-up");
            entry.target.classList.add("show");

        }

    });

}, {

    threshold: 0.2

});

fadeElements.forEach(element => {

    observer.observe(element);

});


/*========================================
        BUTTON HOVER EFFECT
========================================*/

const buttons = document.querySelectorAll(
".btn, .btn-outline, .start-btn, button"
);

buttons.forEach(btn => {

    btn.addEventListener("mouseenter", () => {

        btn.style.transform = "translateY(-5px) scale(1.03)";

    });

    btn.addEventListener("mouseleave", () => {

        btn.style.transform = "translateY(0) scale(1)";

    });

});


/*========================================
        CHAT INPUT EFFECT
========================================*/

const chatInput = document.querySelector(".chat-input input");

if(chatInput){

    chatInput.addEventListener("focus",()=>{

        chatInput.style.boxShadow="0 0 20px rgba(0,229,255,.5)";

    });

    chatInput.addEventListener("blur",()=>{

        chatInput.style.boxShadow="none";

    });

}


/*========================================
        CONSOLE MESSAGE
========================================*/

console.log("%c🚀 NovaAI Loaded Successfully",
"color:#00E5FF;font-size:18px;font-weight:bold;");


/*========================================
        NOVAAI CHAT DEMO
========================================*/

const input = document.querySelector(".chat-input input");
const sendBtn = document.querySelector(".chat-input button");
const chatBody = document.querySelector(".chat-body");

const replies = [
    "🤖 That's a great question! I'm here to help you.",
    "💡 You can build amazing projects using HTML, CSS and JavaScript.",
    "🚀 Keep learning every day and you'll become a great developer.",
    "🔐 Cyber Security and AI are the future of technology.",
    "😊 Thanks for trying NovaAI Demo!"
];

function sendMessage() {

    const message = input.value.trim();

    if (message === "") return;

    // User Message
    const userMsg = document.createElement("div");
    userMsg.className = "message user";

    userMsg.innerHTML = `
        <div class="text">${message}</div>
    `;

    chatBody.appendChild(userMsg);

    input.value = "";

    chatBody.scrollTop = chatBody.scrollHeight;

    // AI Reply
    setTimeout(() => {

        const aiMsg = document.createElement("div");

        aiMsg.className = "message ai";

        const randomReply =
            replies[Math.floor(Math.random() * replies.length)];

        aiMsg.innerHTML = `
            <img src="logo.png" alt="AI">
            <div class="text">${randomReply}</div>
        `;

        chatBody.appendChild(aiMsg);

        chatBody.scrollTop = chatBody.scrollHeight;

    }, 800);

}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", function(e){

    if(e.key === "Enter"){

        sendMessage();

    }

});
sendBtn.addEventListener("click", () => {
    alert("Button Working");
});
