chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "extractContent") {
    const contentArea =
      document.querySelector("article") ||
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.body;

    // clone it in order not to mutate the actual page
    const clone = contentArea.cloneNode(true);

    // remove clutter
    const clutter = clone.querySelectorAll(
      "nav, footer, aside, header, script, style, iframe, img, form, button",
    );
    clutter.forEach((el) => el.remove());

    // extract clean text
    const rawText = clone.innerText || clone.textContent;

    // clean up excessive whitespace
    const content = rawText.replace(/\s+/g, " ").trim();

    const title = document.title;

    // rough reading time est avg of 200 words per min
    const wordCount = content.split(" ").length;
    const readingTime = Math.ceil(wordCount / 200);

    sendResponse({ title, content, wordCount, readingTime });
  }

  return true;
});
