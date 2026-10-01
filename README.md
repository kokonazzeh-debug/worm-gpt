# NAZZEH AI — Worm-style red UI

نسخة واجهة مستوحاة من الصورة المرجعية التي قدمتها:
- أسود + أحمر.
- Sidebar.
- Chat area.
- Model Selection.
- Hugging Face model selector.
- Temperature / Max Tokens.
- Upload File / Image.
- رسالة ترحيب باسم nazzeh el founder.
- تعمل كـ static site على GitHub Pages.

## GitHub Pages

ارفع الملفات إلى Repository ثم:
Settings → Pages → Deploy from a branch → main → root.

## Hugging Face

الواجهة مجهزة للاتصال بـ API عبر `CONFIG.apiUrl` في `app.js`.

لا تضع Hugging Face Secret Token في GitHub Pages العام؛ أي زائر يستطيع رؤية JavaScript. استخدم Backend/Proxy يحتفظ بالسر ثم يجعل المتصفح يرسل له الرسائل.

## ملاحظة

الأيقونة الموجودة في `assets/worm-icon.png` مقتصة من الصورة المرجعية التي قدمتها في المحادثة لاستخدامها كمرجع بصري للمشروع.
