# NAZZEH AI

واجهة AI Chat قابلة للنشر على GitHub Pages.

## المميزات

- واجهة Chat داكنة حديثة.
- رسالة ترحيب تلقائية:
  > مرحباً، أنا NAZZEH AI، مساعدك الشخصي من صنع nazzeh el founder.
- اختيار موديل Hugging Face.
- حفظ المحادثة محلياً في LocalStorage.
- رفع ملف في الواجهة.
- Responsive للموبايل والكمبيوتر.
- لا يحتاج Backend لتشغيل الواجهة.

## تشغيل على GitHub Pages

1. ارفع الملفات إلى Repository.
2. من:
   `Settings -> Pages`
3. اختر:
   `Deploy from a branch`
4. اختر `main` ثم `/root`.
5. Save.

## ربط Hugging Face

GitHub Pages لا يشغّل Backend. لا تضع Secret Token داخل `app.js` في Repository عام.

الأفضل:

`GitHub Pages -> Backend/Proxy -> Hugging Face`

ضع رابط الـBackend في:

`CONFIG.apiUrl`

في `app.js`.

## تغيير الموديلات

عدّل خيارات `modelSelect` في `index.html` وضع Model ID المناسب من Hugging Face.

المشروع هنا مجرد واجهة؛ توفر كل موديل وطريقة استدعائه تعتمد على خدمة Hugging Face والنموذج المختار.
