console.log("Content script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);
    if (request.action === "pasteText") {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const text = activeElement.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            activeElement.value = before + request.text + after;
            activeElement.selectionStart = activeElement.selectionEnd = start + request.text.length;
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        sendResponse({ success: true });
    }
});