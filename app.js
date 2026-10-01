const $ = (s) => document.querySelector(s);

const chat = $("#chat");
const prompt = $("#prompt");
const composer = $("#composer");
const sendBtn = $("#sendBtn");
const modelSelect = $("#modelSelect");
const modelLabel = $("#modelLabel");
const history = $("#history");
const fileInput = $("#fileInput");
const filePreview = $("#filePreview");

const CONFIG = {
  // IMPORTANT:
  // Do NOT put a Hugging Face secret token here when this site is public.
  // Use a backend/proxy or Hugging Face's supported public/browser-safe setup.
  apiUrl: "https://router.huggingface.co/v1/chat/completions",
  apiToken: "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",
  maxTokens: 600,
  temperature: 0.7
};

let messages = [];
let attachedFile = null;

function escapeHtml(text) {
  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function addMessage(role, content, save=true) {
  const el = document.createElement("article");
  el.className = `message ${role}`;
  el.innerHTML = `
    <div class="avatar">${role === "ai" ? "N" : "U"}</div>
    <div class="message-body">
      <div class="message-head">${role === "ai" ? "NAZZEH AI" : "أنت"}</div>
      <div class="message-content">${escapeHtml(content)}</div>
    </div>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;

  if (save) {
    messages.push({role: role === "ai" ? "assistant" : "user", content});
    saveConversation();
  }
  return el;
}

function showWelcome() {
  chat.innerHTML = `
    <div class="welcome">
      <div class="welcome-logo">N</div>
      <h1>مرحباً بك في NAZZEH AI</h1>
      <p>مساعدك الشخصي من صنع <b>nazzeh el founder</b></p>
    </div>`;
}

function typeIndicator() {
  const el = document.createElement("article");
  el.className = "message ai";
  el.id = "typing";
  el.innerHTML = `
    <div class="avatar">N</div>
    <div class="message-body">
      <div class="message-head">NAZZEH AI</div>
      <div class="message-content typing">
        <span></span><span></span><span></span>
      </div>
    </div>`;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

function saveConversation() {
  localStorage.setItem("nazzeh_messages", JSON.stringify(messages));
  updateHistory();
}

function loadConversation() {
  try {
    const saved = JSON.parse(localStorage.getItem("nazzeh_messages") || "[]");
    if (Array.isArray(saved) && saved.length) {
      messages = saved;
      chat.innerHTML = "";
      for (const m of messages) {
        const role = m.role === "assistant" ? "ai" : "user";
        addMessage(role, m.content, false);
      }
    } else {
      startConversation();
    }
  } catch {
    startConversation();
  }
}

function updateHistory() {
  history.innerHTML = "";
  const userMessages = messages.filter(m => m.role === "user").slice(-8).reverse();
  userMessages.forEach((m) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.textContent = m.content;
    history.appendChild(item);
  });
}

function startConversation() {
  messages = [];
  localStorage.removeItem("nazzeh_messages");
  showWelcome();
  const greeting = "مرحباً، أنا NAZZEH AI، مساعدك الشخصي من صنع nazzeh el founder. كيف أقدر أساعدك اليوم؟";
  addMessage("ai", greeting);
}

async function askAI(userText) {
  if (!CONFIG.apiUrl) {
    return "الواجهة شغالة تمام. لربط نموذج Hugging Face فعلياً، ضع رابط الـAPI في CONFIG.apiUrl واربطه من Backend آمن. لا تضع Secret Token داخل GitHub Pages.";
  }

  const selectedModel = modelSelect.value;

  const payload = {
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: "You are NAZZEH AI, a helpful Arabic/English assistant created by nazzeh el founder. Be clear, practical, and honest about uncertainty."
      },
      ...messages,
      { role: "user", content: userText }
    ],
    max_tokens: CONFIG.maxTokens,
    temperature: CONFIG.temperature
  };

  const headers = {"Content-Type":"application/json"};
  if (CONFIG.apiToken) headers.Authorization = `Bearer ${CONFIG.apiToken}`;

  const response = await fetch(CONFIG.apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail.slice(0,300)}`);
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content
      || data.generated_text
      || data[0]?.generated_text
      || "لم يرجع النموذج نصاً مفهوماً.";
}

async function sendMessage() {
  const text = prompt.value.trim();
  if (!text || sendBtn.disabled) return;

  addMessage("user", text);
  prompt.value = "";
  autoResize();

  sendBtn.disabled = true;
  typeIndicator();

  try {
    const answer = await askAI(text);
    $("#typing")?.remove();
    addMessage("ai", answer);
  } catch (error) {
    $("#typing")?.remove();
    addMessage("ai", `حصل خطأ أثناء الاتصال بالنموذج:\n${error.message}`);
  } finally {
    sendBtn.disabled = false;
    prompt.focus();
  }
}

function autoResize() {
  prompt.style.height = "auto";
  prompt.style.height = Math.min(prompt.scrollHeight, 150) + "px";
}

composer.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

prompt.addEventListener("input", autoResize);

modelSelect.addEventListener("change", () => {
  modelLabel.textContent = modelSelect.value;
});

$("#newChat").addEventListener("click", startConversation);
$("#clearBtn").addEventListener("click", startConversation);
$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

fileInput.addEventListener("change", () => {
  attachedFile = fileInput.files[0] || null;
  if (attachedFile) {
    filePreview.textContent = `الملف المحدد: ${attachedFile.name}`;
    filePreview.classList.remove("hidden");
  } else {
    filePreview.classList.add("hidden");
  }
});

showWelcome();
setTimeout(() => {
  if (!localStorage.getItem("nazzeh_messages")) startConversation();
  else loadConversation();
}, 250);
