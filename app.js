const CONFIG = window.NAZZEH_CONFIG || { API_BASE_URL: "http://localhost:8787" };
const API = String(CONFIG.API_BASE_URL || "").replace(/\/$/, "");
const chat = document.getElementById("chat");
const prompt = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const modelSelect = document.getElementById("modelSelect");
const modelCurrent = document.getElementById("modelCurrent");
const modelMeta = document.getElementById("modelMeta");
const modelSearch = document.getElementById("modelSearch");
const imageOnly = document.getElementById("imageOnly");
const fileInput = document.getElementById("fileInput");
const attachmentPreview = document.getElementById("attachmentPreview");
const counter = document.getElementById("counter");
const temp = document.getElementById("temperature");
const maxTokens = document.getElementById("maxTokens");
const tempValue = document.getElementById("tempValue");
const tokenValue = document.getElementById("tokenValue");
let models = [];
let messages = [];
let currentAttachment = null;

const fallbackModels = [
  {id:"deepseek-ai/DeepSeek-V3-0324", supportsImage:false, freeNow:false, providers:[]},
  {id:"deepseek-ai/DeepSeek-R1", supportsImage:false, freeNow:false, providers:[]},
  {id:"Qwen/Qwen3-8B", supportsImage:false, freeNow:false, providers:[]},
  {id:"Qwen/Qwen2.5-7B-Instruct", supportsImage:false, freeNow:false, providers:[]},
  {id:"meta-llama/Llama-3.2-3B-Instruct", supportsImage:false, freeNow:false, providers:[]},
  {id:"google/gemma-2-9b-it", supportsImage:false, freeNow:false, providers:[]},
  {id:"mistralai/Mistral-7B-Instruct-v0.3", supportsImage:false, freeNow:false, providers:[]},
  {id:"deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct", supportsImage:false, freeNow:false, providers:[]}
];

function addMessage(role, content, extra = {}) {
  const el = document.createElement("div");
  el.className = `message ${role}`;
  const who = role === "user" ? "You" : "NAZZEH AI";
  el.innerHTML = `<div class="message-head"><b>${who}</b></div><div class="message-body"></div>`;
  const body = el.querySelector(".message-body");
  body.textContent = content;
  if (extra.image) { const img = document.createElement("img"); img.src = extra.image; img.alt = "uploaded"; body.appendChild(img); }
  chat.appendChild(el); chat.scrollTop = chat.scrollHeight;
  return el;
}

function resetWelcome() {
  chat.innerHTML = "";
  addMessage("assistant", "مرحباً، أنا NAZZEH AI، مساعدك الشخصي من صنع nazzeh el founder. اختر موديل من القائمة وابدأ المحادثة.");
}

function renderModels() {
  const q = modelSearch.value.trim().toLowerCase();
  const onlyImage = imageOnly.checked;
  const list = models.filter(m => m.id.toLowerCase().includes(q) && (!onlyImage || m.supportsImage));
  modelSelect.innerHTML = "";
  for (const m of list) {
    const o = document.createElement("option"); o.value = m.id; o.textContent = `${m.id} ${m.supportsImage ? "• IMAGE" : "• TEXT"}`; modelSelect.appendChild(o);
  }
  if (!list.length) { modelSelect.innerHTML = `<option value="">لا يوجد موديل مطابق</option>`; modelCurrent.textContent = "لا يوجد موديل مطابق للفلتر"; modelMeta.textContent = ""; return; }
  const saved = localStorage.getItem("nazzeh-model");
  if (saved && list.some(m => m.id === saved)) modelSelect.value = saved;
  updateModelInfo();
}

function selectedModel() { return models.find(m => m.id === modelSelect.value); }
function updateModelInfo() {
  const m = selectedModel();
  if (!m) return;
  localStorage.setItem("nazzeh-model", m.id);
  modelCurrent.textContent = `Model: ${m.id}`;
  modelMeta.innerHTML = `<span class="pill ${m.supportsImage ? "ok" : "no"}">${m.supportsImage ? "يدعم الصور" : "نص فقط"}</span><span class="pill">${m.freeNow ? "Free now" : "HF credit / paid حسب المزود"}</span><span class="pill">${(m.providers || []).join(", ") || "provider حسب HF"}</span>`;
}

async function loadModels() {
  try {
    const r = await fetch(`${API}/api/models`);
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    models = data.data || [];
  } catch (e) {
    models = fallbackModels;
    addMessage("assistant", "تعذر تحميل قائمة الموديلات من الـBackend. استخدمت قائمة احتياطية. تأكد أن السيرفر يعمل وأن HF_TOKEN موجود.");
  }
  renderModels();
}

function updateCounter() { counter.textContent = `${prompt.value.length}/4000`; }
function setAttachment(file) {
  if (!file) return;
  currentAttachment = file;
  attachmentPreview.innerHTML = `<span>${file.name}</span><button id="removeAttachment">×</button>`;
  document.getElementById("removeAttachment").onclick = () => { currentAttachment = null; attachmentPreview.innerHTML = ""; };
}

async function fileToDataURL(file) {
  return await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
}
async function buildUserContent(text) {
  if (!currentAttachment) return text;
  if (currentAttachment.type.startsWith("image/")) {
    const m = selectedModel();
    if (!m?.supportsImage) throw new Error("الموديل المختار لا يعلن دعم الصور. اختر موديل عليه IMAGE.");
    return [{type:"text", text: text || "حلل الصورة."}, {type:"image_url", image_url:{url: await fileToDataURL(currentAttachment)}}];
  }
  const allowed = /^(text|application\/json|application\/csv|application\/javascript|text\/javascript|text\/markdown|text\/html|text\/css)/i.test(currentAttachment.type) || /\.(txt|md|json|csv|js|ts|html|css|py|java|cpp|c|xml|yaml|yml)$/i.test(currentAttachment.name);
  if (!allowed) throw new Error("الملف غير مدعوم في النسخة الحالية. استخدم ملفًا نصيًا أو صورة.");
  const textFile = await currentAttachment.text();
  return `${text}\n\n[محتوى الملف: ${currentAttachment.name}]\n${textFile.slice(0, 50000)}`;
}

async function sendMessage() {
  const text = prompt.value.trim();
  if (!text && !currentAttachment) return;
  const model = selectedModel();
  if (!model) return addMessage("assistant", "اختر موديلًا أولاً.");
  if (currentAttachment?.type.startsWith("image/") && !model.supportsImage) return addMessage("assistant", "هذا الموديل نصي فقط. فعّل فلتر الصور واختر موديلًا يدعم الصور.");

  const attachment = currentAttachment;
  let userContent;
  try { userContent = await buildUserContent(text); } catch (e) { return addMessage("assistant", e.message); }
  addMessage("user", text || `تم إرفاق ${attachment.name}`, attachment?.type?.startsWith("image/") ? {image: URL.createObjectURL(attachment)} : {});
  messages.push({ role: "user", content: userContent });
  prompt.value = ""; currentAttachment = null; attachmentPreview.innerHTML = ""; updateCounter();
  sendBtn.disabled = true;
  const thinking = addMessage("assistant", "... جاري التفكير");

  try {
    const r = await fetch(`${API}/api/chat`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:model.id, messages:[{role:"system",content:"You are NAZZEH AI, a helpful Arabic/English assistant created by nazzeh el founder."}, ...messages], max_tokens:Number(maxTokens.value), temperature:Number(temp.value) }) });
    const raw = await r.text();
    if (!r.ok) throw new Error(raw || `HTTP ${r.status}`);
    const data = JSON.parse(raw);
    const answer = data?.choices?.[0]?.message?.content || "لم يصل رد من الموديل.";
    thinking.remove(); addMessage("assistant", answer); messages.push({role:"assistant",content:answer});
  } catch (e) {
    thinking.remove(); addMessage("assistant", `حصل خطأ في الاتصال: ${e.message}`);
  } finally { sendBtn.disabled = false; prompt.focus(); }
}

function newChat() { messages = []; resetWelcome(); }
function saveChat() { localStorage.setItem("nazzeh-chat", JSON.stringify(messages)); addMessage("assistant", "تم حفظ المحادثة على هذا الجهاز."); }
function loadChat() { try { const saved = JSON.parse(localStorage.getItem("nazzeh-chat") || "[]"); if (saved.length) { messages=saved; for (const m of saved) addMessage(m.role === "assistant" ? "assistant" : "user", typeof m.content === "string" ? m.content : "[رسالة متعددة الوسائط]"); return; } } catch {} resetWelcome(); }

temp.oninput=()=>tempValue.textContent=temp.value; maxTokens.oninput=()=>tokenValue.textContent=maxTokens.value; prompt.oninput=updateCounter;
sendBtn.onclick=sendMessage; prompt.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}});
document.getElementById("uploadBtn").onclick=()=>fileInput.click(); document.getElementById("imageBtn").onclick=()=>{fileInput.accept="image/*";fileInput.click();}; fileInput.onchange=()=>setAttachment(fileInput.files[0]);
document.getElementById("clearBtn").onclick=()=>{messages=[];resetWelcome();}; document.getElementById("newChat").onclick=newChat; document.getElementById("newChat2").onclick=newChat; document.getElementById("saveBtn").onclick=saveChat;
modelSelect.onchange=updateModelInfo; modelSearch.oninput=renderModels; imageOnly.onchange=renderModels;
document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
const settingsPanel=document.querySelector(".settings-panel");
document.getElementById("modelsBtn").onclick=()=>settingsPanel.classList.toggle("open-mobile");
document.addEventListener("click",e=>{ if(window.innerWidth<=950 && settingsPanel.classList.contains("open-mobile") && !settingsPanel.contains(e.target) && e.target.id!=="modelsBtn"){settingsPanel.classList.remove("open-mobile");} });

resetWelcome(); loadChat(); loadModels();
