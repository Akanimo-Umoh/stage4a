// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.action) return;

  if (message.action === "summarize") {
    handleSummarize(message.data)
      .then((summary) => sendResponse({ success: true, summary }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
  }

  return true;
});

async function handleSummarize({
  title,
  content,
  wordCount,
  readingTime,
  url,
}) {
  // check cache first if we've already summarized this exact url
  const cacheKey = `summary_${url}`;
  const cached = await getFromStorage(cacheKey);
  if (cached) return cached;

  // call the vercel proxy(no api key here)
  const response = await fetch(
    "https://page-summarizer-server.vercel.app/api/summarize",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        wordCount,
        readingTime,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json();
    console.error("Server error:", errorBody);
    throw new Error(errorBody.error || "Server error");
  }

  const data = await response.json();

  // cache the result
  await saveToStorage(cacheKey, data.summary);

  return data.summary;
}

// --- Storage helpers ---

function getFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

function saveToStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}
