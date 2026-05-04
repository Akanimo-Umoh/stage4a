const summarizeBtn = document.getElementById("summarize-btn");
const clearBtn = document.getElementById("clear-btn");
const copyBtn = document.getElementById("copy-btn");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const errorMessage = document.getElementById("error-message");
const results = document.getElementById("results");
const pageTitle = document.getElementById("page-title");
const summaryList = document.getElementById("summary-list");
const insightsList = document.getElementById("insights-list");
const readingTime = document.getElementById("reading-time");

// on popup open, show the current page title
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.title) pageTitle.textContent = tab.title;

  // check if we already have a cached summary for this URL
  const cacheKey = `summary_${tab.url}`;
  chrome.storage.local.get([cacheKey], (result) => {
    if (result[cacheKey]) renderResults(result[cacheKey]);
  });
});

// summarize button click
summarizeBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  showLoading();

  // Step A — ask content.js to extract the page content
  chrome.tabs.sendMessage(tab.id, { action: "extractContent" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      showError("Could not extract page content. Try refreshing the page.");
      return;
    }

    // Step B — send extracted content to background.js for AI processing
    chrome.runtime.sendMessage(
      { action: "summarize", data: { ...response, url: tab.url } },
      (result) => {
        if (chrome.runtime.lastError || !result) {
          showError("Something went wrong. Please try again.");
          return;
        }

        if (!result.success) {
          showError(result.error || "Failed to generate summary.");
          return;
        }

        renderResults(result.summary);
      },
    );
  });
});

// clear button
clearBtn.addEventListener("click", () => {
  results.classList.add("hidden");
  error.classList.add("hidden");
  summarizeBtn.disabled = false;
  summaryList.innerHTML = "";
  insightsList.innerHTML = "";
});

// copy button
copyBtn.addEventListener("click", () => {
  const bullets = [...summaryList.querySelectorAll("li")]
    .map((li) => `• ${li.textContent}`)
    .join("\n");
  const insights = [...insightsList.querySelectorAll("li")]
    .map((li) => `→ ${li.textContent}`)
    .join("\n");
  const text = `Summary:\n${bullets}\n\nKey Insights:\n${insights}`;

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy Summary"), 2000);
  });
});

// --- Helper functions ---

function showLoading() {
  loading.classList.remove("hidden");
  error.classList.add("hidden");
  results.classList.add("hidden");
  summarizeBtn.disabled = true;
}

function showError(message) {
  loading.classList.add("hidden");
  error.classList.remove("hidden");
  errorMessage.textContent = message;
  summarizeBtn.disabled = false;
}

function renderResults(data) {
  loading.classList.add("hidden");
  results.classList.remove("hidden");
  summarizeBtn.disabled = false;

  readingTime.textContent = `Estimated reading time: ${data.readingTime} min`;

  summaryList.innerHTML = data.summary
    .map((point) => `<li>${sanitize(point)}</li>`)
    .join("");

  insightsList.innerHTML = data.insights
    .map((insight) => `<li>${sanitize(insight)}</li>`)
    .join("");
}

// Prevent XSS — never inject raw HTML from AI responses
function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
