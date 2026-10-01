# NAZZEH AI Backend

Node.js + Express proxy for Hugging Face Inference Providers.

Set `HF_TOKEN` in `.env`, never in frontend files.

Run:

```bash
npm install
npm start
```

Endpoints:
- `GET /api/health`
- `GET /api/models`
- `POST /api/chat`
