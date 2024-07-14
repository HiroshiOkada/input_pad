let currentTab = 1;
const MAX_ITEMS = 10;

// DOMContentLoaded イベントリスナー内に以下を追加
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

function setupEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(parseInt(tab.dataset.tab)));
    });

    document.getElementById('addBtn').addEventListener('click', addNewItem);
}

function switchTab(tabNumber) {
    // 前のタブのデータをクリーンアップ
    cleanupData(currentTab).then(() => {
        currentTab = tabNumber;
        updateActiveTab();
        loadData();
    });
}

function updateActiveTab() {
    // すべてのタブから 'active' クラスを削除
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    // 現在のタブに 'active' クラスを追加
    document.querySelector(`.tab[data-tab="${currentTab}"]`).classList.add('active');
}

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
            chrome.storage.sync.set({ [`tab${tabNumber}`]: data }, resolve);
        });
    });
}

function loadData() {
    chrome.storage.sync.get(`tab${currentTab}`, (result) => {
        const data = result[`tab${currentTab}`] || [];
        renderItems(data);
    });
}

function renderItems(items) {
    const inputArea = document.getElementById('inputArea');
    inputArea.innerHTML = '';
    items.forEach((item, index) => {
        inputArea.appendChild(createInputGroup(item, index));
    });
    document.getElementById('addBtn').style.display = items.length < MAX_ITEMS ? 'block' : 'none';
}

function createInputGroup(text, index) {
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `
        <textarea>${text}</textarea>
        <button class="copy-btn">Copy</button>
        <button class="insert-btn">Insert</button>
    `;
    div.querySelector('textarea').addEventListener('input', () => saveData());
    div.querySelector('.copy-btn').addEventListener('click', () => copyText(index));
    div.querySelector('.insert-btn').addEventListener('click', () => insertText(index));
    return div;
}

function addNewItem() {
    chrome.storage.sync.get(`tab${currentTab}`, (result) => {
        const data = result[`tab${currentTab}`] || [];
        if (data.length < MAX_ITEMS) {
            data.push('');
            chrome.storage.sync.set({ [`tab${currentTab}`]: data }, loadData);
        }
    });
}

function saveData() {
    const textareas = document.querySelectorAll('.input-group textarea');
    const data = Array.from(textareas).map(textarea => textarea.value);
    chrome.storage.sync.set({ [`tab${currentTab}`]: data });
}

function copyText(index) {
    const textarea = document.querySelectorAll('.input-group textarea')[index];
    textarea.select();
    document.execCommand('copy');
}

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