const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const statusEl = document.getElementById("status");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

let recognition;
let maleVoice = null;
let femaleVoice = null;
let karenActive = false;

/* ---------------- PRELOAD VOICES ---------------- */
function loadVoices() {
  const voices = synth.getVoices();
  if (!voices.length) return;

  maleVoice = voices.find(v =>
    v.name.toLowerCase().includes("male") ||
    v.name.toLowerCase().includes("daniel") ||
    v.name.toLowerCase().includes("alex")
  ) || voices[0];

  femaleVoice = voices.find(v =>
    v.name.toLowerCase().includes("karen") ||
    v.name.toLowerCase().includes("female") ||
    v.name.toLowerCase().includes("samantha") ||
    v.name.toLowerCase().includes("google us english")
  ) || voices[0];
}
synth.onvoiceschanged = loadVoices;
loadVoices();

/* ---------------- SPEAK ---------------- */
function speak(text, useFemale = true) {
  if (!text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = useFemale ? femaleVoice : maleVoice;
  utter.rate = 1;
  utter.pitch = useFemale ? 1.1 : 1;
  synth.cancel(); // stop overlapping
  synth.speak(utter);
}

/* ---------------- CHAT UI ---------------- */
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  statusEl.textContent = sender.toUpperCase() + ": " + text;
}

/* ---------------- HANDLE COMMANDS ---------------- */
async function handleCommand(text, useFemale = true) {
  text = text.toLowerCase();
  let response = "";

  if (!navigator.onLine) {
    response = "Activate your internet first.";
    addMessage("bot", response);
    speak(response, useFemale);
    return;
  }

  // 👋 Basic small-talk
  if (text.includes("hi") || text.includes("hello") || text.includes("hey karen")) {
    response = "Hello! How can I help you today?";
  }
  else if (text.includes("how are you")) {
    response = "I'm doing great, thanks for asking! How are you?";
  }
  else if (text.includes("what is the time") || text.includes("tell me the time") || text.includes("current time")) {
    const now = new Date();
    response = `The time is ${now.toLocaleTimeString()}.`;
  }
  else if (text.includes("who made you") || text.includes("who created you")) {
    response = "I was created by Shashwat Pandey with some coding magic!";
  }
  // 🌐 Wikipedia queries
  else if (text.includes("who is") || text.includes("what is") || text.includes("tell me about")) {
    const query = text.replace("who is", "")
                      .replace("what is", "")
                      .replace("tell me about", "")
                      .trim();

    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.extract) {
        response = data.extract;
      } else {
        response = "Sorry, I couldn’t find anything on Wikipedia.";
      }
    } catch (err) {
      console.error(err);
      response = "Oops! Something went wrong while searching Wikipedia.";
    }
  }
   else if (text.includes("open youtube")) {
    window.open("https://www.youtube.com", "_blank");
    response = "Opening YouTube...";
  } else if (text.includes("open whatsapp")) {
    window.open("https://web.whatsapp.com/", "_blank");
    response = "Opening WhatsApp Web...";
  } else if (text.includes("open chrome")) {
    window.open("https://www.google.com", "_blank");
    response = "Opening Google Chrome homepage...";
  } else if (text.includes("open gmail")) {
    window.open("https://mail.google.com", "_blank");
    response = "Opening Gmail...";
  }
  else {
    response = "I only know Wikipedia searches and some basic chats for now.";
  }

  addMessage("bot", response);
  speak(response, useFemale);
}


/* ---------------- SPEECH RECOGNITION ---------------- */
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("Heard:", transcript);

    if (transcript.includes("karen")) {
      karenActive = true;
      addMessage("bot", "Yes, I'm listening 👂");
      speak("Yes, I'm listening", true);
    }
    else if (karenActive) {
      addMessage("user", transcript);
      handleCommand(transcript, true);
      karenActive = false;
    }
    else {
      addMessage("user", transcript);
      handleCommand(transcript, false);
    }
  };

  recognition.onerror = () => {
    statusEl.textContent = "Error with speech recognition.";
    speak("Sorry, I couldn't hear you.");
  };

  recognition.start();
} else {
  alert("Your browser does not support Speech Recognition 😢");
}

/* ---------------- BUTTONS ---------------- */
sendBtn.addEventListener("click", () => {
  const text = userInput.value.trim();
  if (text !== "") {
    addMessage("user", text);
    handleCommand(text, false);
    userInput.value = "";
  }
});

voiceBtn.addEventListener("click", () => {
  recognition.start();
  statusEl.textContent = "Listening...";
});
