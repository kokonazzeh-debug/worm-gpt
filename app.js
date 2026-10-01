const chat = document.querySelector("#chat");
const prompt = document.querySelector("#prompt");
const sendBtn = document.querySelector("#sendBtn");
const modelSelect = document.querySelector("#modelSelect");
const modelCurrent = document.querySelector("#modelCurrent");
const temp = document.querySelector("#temperature");
const tempValue = document.querySelector("#tempValue");
const maxTokens = document.querySelector("#maxTokens");
const tokenValue = document.querySelector("#tokenValue");
const counter = document.querySelector("#counter");
const fileInput = document.querySelector("#fileInput");

const CONFIG = {
  // For a public GitHub Pages site, keep secrets OUT of this file.
  // Put your Hugging Face token on a backend/proxy instead.
  apiUrl: "",
  apiToken: ""
};

let messages = [];

function escapeHtml(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function icon(){return `<img src="assets/worm-icon.png" alt="">`;}

function addMessage(role, text, save=true){
  const el=document.createElement("article");
  el.className=`message ${role}`;
  el.innerHTML=`<div class="avatar">${icon()}</div><div class="message-body"><div class="message-head">${role==="ai"?"NAZZEH AI":"You"}</div><div class="message-content">${escapeHtml(text)}</div></div>`;
  chat.appendChild(el); chat.scrollTop=chat.scrollHeight;
  if(save){messages.push({role:role==="ai"?"assistant":"user",content:text});localStorage.setItem("nazzeh_messages",JSON.stringify(messages));}
}

function greeting(){
  messages=[];
  localStorage.removeItem("nazzeh_messages");
  chat.innerHTML="";
  addMessage("ai","مرحباً، أنا NAZZEH AI، مساعدك الشخصي من صنع nazzeh el founder. كيف أقدر أساعدك اليوم؟");
}

function renderSaved(){
  try{messages=JSON.parse(localStorage.getItem("nazzeh_messages")||"[]")}catch{messages=[]}
  if(!messages.length)return greeting();
  chat.innerHTML="";
  messages.forEach(m=>addMessage(m.role==="assistant"?"ai":"user",m.content,false));
}

async function askAI(text){
  if(!CONFIG.apiUrl){
    return "واجهة NAZZEH AI جاهزة. لربط Hugging Face فعلياً، أضف Backend آمن وضع رابط الـAPI في CONFIG.apiUrl. لا تضع Secret Token داخل GitHub Pages.";
  }
  const body={
    model:modelSelect.value,
    messages:[
      {role:"system",content:"You are NAZZEH AI, a helpful Arabic/English assistant created by nazzeh el founder."},
      ...messages,
      {role:"user",content:text}
    ],
    max_tokens:Number(maxTokens.value),
    temperature:Number(temp.value)
  };
  const headers={"Content-Type":"application/json"};
  if(CONFIG.apiToken)headers.Authorization=`Bearer ${CONFIG.apiToken}`;
  const r=await fetch(CONFIG.apiUrl,{method:"POST",headers,body:JSON.stringify(body)});
  if(!r.ok)throw new Error(`API ${r.status}: ${(await r.text()).slice(0,250)}`);
  const d=await r.json();
  return d.choices?.[0]?.message?.content||d.generated_text||d[0]?.generated_text||"لم يرجع النموذج نصاً.";
}

async function send(){
  const text=prompt.value.trim(); if(!text)return;
  addMessage("user",text); prompt.value=""; resize();
  sendBtn.disabled=true;
  const loading=document.createElement("article");
  loading.className="message ai"; loading.id="loading";
  loading.innerHTML=`<div class="avatar">${icon()}</div><div class="message-body"><div class="message-head">NAZZEH AI</div><div class="message-content">● ● ●</div></div>`;
  chat.appendChild(loading);chat.scrollTop=chat.scrollHeight;
  try{const answer=await askAI(text);loading.remove();addMessage("ai",answer)}
  catch(e){loading.remove();addMessage("ai","حدث خطأ في الاتصال بالنموذج:\n"+e.message)}
  finally{sendBtn.disabled=false}
}

function resize(){prompt.style.height="auto";prompt.style.height=Math.min(prompt.scrollHeight,130)+"px";}
prompt.addEventListener("input",()=>{resize();counter.textContent=`${prompt.value.length}/4000`});
prompt.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
sendBtn.onclick=send;
document.querySelector("#newChat").onclick=greeting;
document.querySelector("#newChat2").onclick=greeting;
document.querySelector("#clearBtn").onclick=greeting;
document.querySelector("#menuBtn").onclick=()=>document.querySelector("#sidebar").classList.toggle("open");
document.querySelector("#uploadBtn").onclick=()=>fileInput.click();
document.querySelector("#imageBtn").onclick=()=>fileInput.click();
fileInput.onchange=()=>{if(fileInput.files[0])addMessage("user","تم اختيار الملف: "+fileInput.files[0].name)};
document.querySelector("#saveBtn").onclick=()=>localStorage.setItem("nazzeh_messages",JSON.stringify(messages));
modelSelect.onchange=()=>modelCurrent.textContent="Model: "+modelSelect.value;
temp.oninput=()=>tempValue.textContent=temp.value;
maxTokens.oninput=()=>tokenValue.textContent=maxTokens.value;

renderSaved();
