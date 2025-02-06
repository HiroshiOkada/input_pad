// グローバル変数
let currentTab = 1;
const MAX_ITEMS = 10;

// デバウンス関数
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    }
}

// DOMの読み込み完了時に実行
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateActiveTab(); // 初期状態でアクティブなタブを設定


    // ポップアップの幅を最大に設定
    const setMaxWidth = () => {
        const maxWidth = 800; // Chrome拡張機能ポップアップの最大幅（実際の制限に応じて調整）
        document.body.style.width = `${maxWidth}px`;
    };

    setMaxWidth();

    // ウィンドウのリサイズ時にも幅を調整（オプション）
    window.addEventListener('resize', setMaxWidth);

});

// イベントリスナーのセットアップ
function setupEventListeners() {
    // タブ切り替えのイベントリスナー
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(parseInt(tab.dataset.tab)));
    });

    // 新規アイテム追加ボタンのイベントリスナー
    document.getElementById('addBtn').addEventListener('click', addNewItem);
}

// タブ切り替え処理
function switchTab(tabNumber) {
    // 前のタブのデータをクリーンアップ
    cleanupData(currentTab).then(() => {
        currentTab = tabNumber;
        updateActiveTab();
        loadData();
    });
}

// アクティブなタブの更新
function updateActiveTab() {
    const tabs = document.querySelectorAll('.tab');
    const inputArea = document.getElementById('inputArea');
    tabs.forEach(tab => {
        if (parseInt(tab.dataset.tab) === currentTab) {
            tab.classList.add('active');
            const color = tab.dataset.color;
            inputArea.dataset.color = color;
        } else {
            tab.classList.remove('active');
        }
    });
}

// データのクリーンアップ（空のアイテムを削除）
function cleanupData(tabNumber) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(`tab${tabNumber}`, (result) => {
            let data = result[`tab${tabNumber}`] || [];
            // 最後の非空アイテムのインデックスを見つける
            let lastNonEmptyIndex = data.length - 1;
            while (lastNonEmptyIndex >= 0 && data[lastNonEmptyIndex].trim() === '') {
                lastNonEmptyIndex--;
            }
            // 空のアイテムを削除
            data = data.slice(0, lastNonEmptyIndex + 1);
            // 更新されたデータを保存
            chrome.storage.sync.set({ [`tab${tabNumber}`]: data }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error during cleanupData save:", chrome.runtime.lastError);
                }
                resolve();
            });
        });
    });
}

function loadData() {
    chrome.storage.sync.get(`tab${currentTab}`, (result) => {
        const data = result[`tab${currentTab}`] || [];
        renderItems(data);
    });
}

// アイテムの描画
function renderItems(items) {
    const inputArea = document.getElementById('inputArea');
    inputArea.innerHTML = '';
    items.forEach((item, index) => {
        inputArea.appendChild(createInputGroup(item, index));
    });
    document.getElementById('addBtn').style.display = items.length < MAX_ITEMS ? 'block' : 'none';
}

// 入力グループの作成
function createInputGroup(text, index) {
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `
        <textarea>${text}</textarea>
        <button class="copy-btn">Copy</button>
        <button class="insert-btn">Insert</button>
    `;
    div.querySelector('textarea').addEventListener('input', debouncedSaveData);
    div.querySelector('.copy-btn').addEventListener('click', () => copyText(index));
    div.querySelector('.insert-btn').addEventListener('click', () => insertText(index));
    return div;
}

// 新規アイテムの追加
function addNewItem() {
    chrome.storage.sync.get(`tab${currentTab}`, (result) => {
        const data = result[`tab${currentTab}`] || [];
        if (data.length < MAX_ITEMS) {
            data.push('');
            chrome.storage.sync.set({ [`tab${currentTab}`]: data }, loadData);
        }
    });
}

// データの保存
function saveData() {
    const textareas = document.querySelectorAll('.input-group textarea');
    const data = Array.from(textareas).map(textarea => textarea.value);
    chrome.storage.sync.set({ [`tab${currentTab}`]: data }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error during saveData:", chrome.runtime.lastError);
        }
    });
}

// デバウンスされた保存関数
const debouncedSaveData = debounce(saveData, 500);

// テキストのコピー
function copyText(index) {
    const textarea = document.querySelectorAll('.input-group textarea')[index];
    textarea.select();
    document.execCommand('copy');
}

// テキストの挿入
function insertText(index) {
    const textarea = document.querySelectorAll('.input-group textarea')[index];
    const textToInsert = textarea.value;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
            console.error("Error querying tabs:", chrome.runtime.lastError);
            return;
        }
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "pasteText", text: textToInsert }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message:", chrome.runtime.lastError);
                } else {
                    console.log("Message sent successfully");
                }
            });
        } else {
            console.error("No active tab found");
        }
    });
}