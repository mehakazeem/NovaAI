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