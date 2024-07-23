// 拡張機能がインストールされたときに実行される
chrome.runtime.onInstalled.addListener(() => {
    console.log("拡張機能がインストールされました");
});

// 注: 現在このファイルは最小限の機能しか持っていませんが、
// 将来的にバックグラウンドタスクや長期実行プロセスを
// 追加する際の基盤となります。