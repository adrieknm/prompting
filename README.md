# Prompt Architect

Web app sederhana untuk mengubah prompt singkat menjadi **master prompt** dengan struktur:

1. Role
2. Task
3. Context
4. Reasoning
5. Stop Conditions
6. Output

## Arsitektur

- Frontend: HTML + CSS + vanilla JavaScript.
- Backend: Vercel Function `api/generate.js`.
- AI: OpenAI Responses API.
- API key: server-side melalui `OPENAI_API_KEY`.
- Default model: `gpt-6-luna`; bisa diganti dengan `OPENAI_MODEL`.

## Deploy ke Vercel

### Cara paling mudah

1. Upload folder project ini ke GitHub.
2. Import repository ke Vercel.
3. Di Vercel → Project → Settings → Environment Variables:
   - `OPENAI_API_KEY` = API key OpenAI Anda.
   - `OPENAI_MODEL` = `gpt-6-luna` (opsional).
4. Redeploy.
5. Buka URL Vercel.

### Lokal

Node.js 22+ diperlukan.

```bash
npm install
```

Buat environment variable:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-6-luna
```

Lalu jalankan dengan Vercel CLI:

```bash
npx vercel dev
```

## Catatan keamanan

Jangan menaruh `OPENAI_API_KEY` di `index.html` atau JavaScript browser. App ini sengaja memakai serverless function agar key tetap server-side.

## Alur

`Prompt singkat → AI analisis → Blueprint 6 blok → Master Prompt copy-paste ready`

## Upgrade berikutnya

- Riwayat prompt di localStorage.
- Preset: sekolah, riset, coding, marketing, administrasi.
- Tombol "Perketat Prompt".
- Versi "Ultra Compact".
- Export Markdown.
- Skor kualitas prompt.
- Mode compare: prompt asli vs master prompt.
