# NAZZEH AI v2 — Hugging Face Edition

واجهة NAZZEH AI بأسلوب أسود/أحمر، مع Backend آمن يحفظ Hugging Face token خارج GitHub Pages.

## أهم نقطة: أين تضع المفتاح؟

1. افتح `frontend/setup.html` أو افتح:
   https://huggingface.co/settings/tokens
2. أنشئ **Fine-grained token** وفعّل صلاحية **Make calls to Inference Providers**.
3. انسخ المفتاح `hf_...`.
4. داخل مجلد `backend` انسخ `.env.example` إلى `.env`.
5. ضع المفتاح هنا فقط:

```env
HF_TOKEN=hf_xxxxxxxxxxxxxxxxx
```

**لا تضع المفتاح في `frontend/config.js` أو `app.js` ولا ترفعه إلى GitHub.**

## تشغيل محليًا

```bash
cd backend
npm install
npm start
```

ثم افتح `frontend/index.html` عبر Live Server أو أي web server محلي.

`frontend/config.js` يحتوي على:

```js
API_BASE_URL: "http://localhost:8787"
```

## GitHub Pages

GitHub Pages يستضيف الواجهة فقط. الـBackend يجب نشره على خدمة تدعم Node.js/serverless وتمنحك HTTPS.
بعد نشر الـBackend، غيّر `frontend/config.js` إلى رابط الـBackend HTTPS، مثل:

```js
API_BASE_URL: "https://YOUR-BACKEND.example.com"
```

ثم ارفع مجلد `frontend` إلى GitHub Pages.

## الموديلات

الواجهة تطلب قائمة الموديلات مباشرة من Backend، والـBackend يقرأ قائمة OpenAI-compatible من Hugging Face Router. تظهر للمستخدم:
- دعم الصور: `يدعم الصور` أو `نص فقط`.
- حالة مجانية حالية إن أعلنها أحد المزودين: `Free now`.
- وإلا تظهر `HF credit / paid حسب المزود`.

حساب Hugging Face المجاني لديه رصيد شهري تجريبي صغير لـ Inference Providers؛ هذا ليس استخدامًا مجانيًا بلا حدود، وقد تتغير القيم والسياسات. راجع صفحة الأسعار الرسمية.

## الأمان

- `.env` مستثنى من Git.
- CORS يمكن تقييده عبر `FRONTEND_ORIGINS`.
- لا يوجد HF token في JavaScript العام.
- الصور لا تُرسل إلا عند اختيار موديل يعلن دعم الصور.
