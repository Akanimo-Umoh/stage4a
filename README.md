# ⚡ PageSummarizer — AI Chrome Extension

A Manifest V3 Chrome Extension that extracts content from any webpage and generates a structured AI-powered summary using the Google Gemini API, routed securely through a Vercel serverless proxy.

---

## Demo URL

[Watch here](https://drive.google.com/file/d/1huvRI_haGcFvzlVnAd5EmtI24j-HCYgf/view?usp=drive_link)

---

## 🚀 Features

- Extracts meaningful content from any webpage
- Generates a bullet-point summary via Google Gemini AI
- Displays key insights and estimated reading time
- Caches summaries per URL to avoid duplicate API calls
- Clean, minimal dark UI
- Copy summary to clipboard
- Graceful error handling for paywalled and unsupported pages
- No API key required from the user — handled securely server-side

---

## 🗂️ Architecture

```
page-summarizer/
├── manifest.json        # Extension configuration
├── background.js        # Service worker — proxies requests to Vercel
├── content.js           # Injected into pages — extracts DOM content
├── popup/
│   ├── popup.html       # Extension popup UI
│   ├── popup.js         # Popup logic and Chrome messaging
│   └── popup.css        # Popup styles
└── icons/               # Extension icons

page-summarizer-server/
└── api/
    └── summarize.js     # Vercel serverless function — holds API key
```

### How the pieces connect

```
User clicks extension
       ↓
  popup.js opens
       ↓
  Sends message to content.js → extracts page text from DOM
       ↓
  Sends extracted text to background.js
       ↓
  background.js calls Vercel proxy server
       ↓
  Vercel server calls Gemini API using server-side API key
       ↓
  Summary returned to popup.js → rendered in UI
```

---

## 🔐 Security Decisions

**API key handling via Vercel proxy**
The Gemini API key is never stored in the extension code at all. It lives exclusively as an environment variable on a Vercel serverless function. The extension's `background.js` calls the proxy endpoint, which then forwards the request to the Gemini API with the key attached server-side. This means the key is never exposed in any file that ships with the extension.

**XSS Prevention**
All AI response content is sanitized before being injected into the DOM using a `sanitize()` function that sets content as `textContent` before reading back `innerHTML`. Raw HTML from the AI response is never injected directly.

**Message validation**
The background service worker validates all incoming messages before processing them, rejecting any message without a valid `action` field.

**CORS handling**
The Vercel proxy is configured with appropriate CORS headers to only accept `POST` and `OPTIONS` requests with `Content-Type: application/json`, preventing unauthorized cross-origin access.

**Minimal permissions**
The extension only requests the permissions it actually needs:
- `activeTab` — read the current tab URL and title
- `storage` — cache summaries locally
- `scripting` — interact with page scripts

---

## ⚖️ Trade-offs

**AI Provider**
The original implementation targeted the Anthropic Claude API. During development this was switched to the Google Gemini API (`gemini-flash-latest`) due to Anthropic's lack of a free tier. Gemini provides a generous free tier via Google AI Studio making it more accessible for local development and testing without requiring upfront billing.

**Vercel proxy vs direct API call**
Routing through a Vercel serverless function adds a small amount of latency compared to calling the Gemini API directly from the extension. This trade-off is intentional — it fully satisfies the security requirement of never exposing the API key in client-side code, and makes the extension usable by anyone without needing their own API key.

**Content extraction heuristics**
The content extractor targets `article`, `main`, and `[role="main"]` elements in order of preference. This works well for most article and blog pages but may extract less relevant content on heavily JavaScript-rendered pages or single-page apps where content loads dynamically after the DOM is ready.

**Token limit**
Page content is trimmed to 8,000 characters before being sent to the AI. Very long articles will have their tail content cut off. A more robust implementation would chunk the content and summarize in passes.

---

## 🛠️ Setup & Installation

> No API key is required. The extension connects to a hosted proxy that handles AI requests securely.

### Prerequisites
- Google Chrome browser

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Akanimo-Umoh/stage4a.git
   cd page-summarizer
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in the top right)
   - Click **Load unpacked**
   - Select the `page-summarizer` folder

3. Pin the extension:
   - Click the puzzle icon in your Chrome toolbar
   - Find **PageSummarizer** and click the pin icon

4. Use it:
   - Navigate to any article or webpage
   - Click the extension icon
   - Hit **Summarize this page**

That's it — no configuration needed.

---

## 🤖 AI Integration

The extension uses the **Google Gemini API** (`gemini-flash-latest`), routed through a **Vercel serverless proxy** at:

```
https://page-summarizer-server.vercel.app/api/summarize
```

The prompt instructs Gemini to return a strictly structured JSON response:

```json
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "insights": ["insight 1", "insight 2", "insight 3"],
  "readingTime": 4
}
```

Returning structured JSON rather than free-form text means the popup can map the response directly to UI elements without any fragile text parsing. The AI response is also sanitized before DOM injection to prevent XSS.

---

## 🧪 Tested On

- News articles (BBC, CNN, freeCodeCamp)
- Blog posts
- Documentation pages
- Wikipedia articles

### Known limitations
- Does not work on `chrome://` internal pages
- May extract limited content from paywalled articles
- Heavy JavaScript-rendered pages may yield incomplete extraction

---

## 👤 Author

Akanimo Umoh