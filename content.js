console.log("コンテンツスクリプトが読み込まれました");

// バックグラウンドスクリプトからのメッセージを待ち受ける
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("コンテンツスクリプトでメッセージを受信:", request);

    // テキスト貼り付けアクションの処理
    if (request.action === "pasteText") {
        const activeElement = document.activeElement;

        // 入力フィールドやテキストエリアがアクティブな場合のみ処理を実行
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const text = activeElement.value;

            // カーソル位置にテキストを挿入
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            activeElement.value = before + request.text + after;

            // カーソル位置を更新
            activeElement.selectionStart = activeElement.selectionEnd = start + request.text.length;

            // 入力イベントを発火させて変更を反映
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // 処理成功を通知
        sendResponse({ success: true });
    }
});