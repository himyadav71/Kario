/* ============================================
   Himanshu AI Chat — Multi-Provider Application
   ============================================ */

// ---- Provider Configurations ----
const PROVIDERS = {
    orbit: {
        name: 'Orbit',
        icon: '🌐',
        color: '#7c3aed',
        baseUrl: 'https://api.orbit-provider.com/v1',
        authToken: 'sk-orbit-e90b5d832142349b74b8b763569b945c',
        useProxy: true,
        apiFormat: 'openai',
        defaultModel: 'gemini-3-flash-preview',
        models: [
            { id: 'gemini-3-pro-preview', label: 'Kairo 3 Pro Preview', desc: 'Flagship (PRO) · 1M ctx', tier: 'opus' },
            { id: 'gemini-3-pro-image-preview', label: 'Kairo 3 Pro Image', desc: 'Flagship (PRO) · 1M ctx', tier: 'opus' },
            { id: 'gemini-3-flash-preview', label: 'Kairo 3 Flash', desc: 'Fast · 1M ctx', tier: 'sonnet' },
            { id: 'gemini-2.5-pro-preview', label: 'Kairo 2.5 Pro', desc: 'Pro · 1M ctx', tier: 'opus' },
            { id: 'gemini-2.5-flash-preview', label: 'Kairo 2.5 Flash', desc: 'Balanced · 1M ctx', tier: 'sonnet' },
            { id: 'gemini-2.5-flash-lite', label: 'Kairo 2.5 Flash Lite', desc: 'Lite · 1M ctx', tier: 'haiku' },
            { id: 'gemini-2.5-computer-use-preview-10-2025', label: 'Kairo 2.5 Computer Use', desc: 'Specialized (PRO)', tier: 'opus' },
            { id: 'claude-opus-4-6-20260205', label: 'Kairo Opus 4.6', desc: 'Flagship (PRO) · 256K ctx', tier: 'opus' },
            { id: 'claude-sonnet-4-6', label: 'Kairo Sonnet 4.6', desc: 'Balanced · 200K ctx', tier: 'sonnet' },
            { id: 'claude-haiku-4-5-20251001', label: 'Kairo Haiku 4.5', desc: 'Fast · 200K ctx', tier: 'haiku' },
            { id: 'gemini-claude-opus-4-6-thinking', label: 'Kairo Opus 4.6 Thinking', desc: 'PRO · IDE mode', tier: 'opus' },
            { id: 'gemini-claude-sonnet-4-6', label: 'Kairo Sonnet 4.6 IDE', desc: 'Balanced · IDE mode', tier: 'sonnet' },
        ]
    },
    openai: {
        name: 'OpenAI',
        icon: '🤖',
        color: '#10a37f',
        baseUrl: 'https://api.openai.com/v1',
        authToken: '',
        useProxy: true,
        apiFormat: 'openai',
        defaultModel: 'gpt-4o',
        models: [
            { id: 'gpt-4o', label: 'GPT-4o', desc: 'Most capable · 128K ctx', tier: 'opus' },
            { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast & affordable · 128K ctx', tier: 'haiku' },
            { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'Previous flagship · 128K ctx', tier: 'sonnet' },
            { id: 'o1', label: 'o1', desc: 'Advanced reasoning · 200K ctx', tier: 'opus' },
            { id: 'o1-mini', label: 'o1 Mini', desc: 'Fast reasoning · 128K ctx', tier: 'sonnet' },
            { id: 'o3-mini', label: 'o3 Mini', desc: 'Newest reasoning · 200K ctx', tier: 'sonnet' },
            { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: 'Legacy fast model · 16K ctx', tier: 'haiku' },
        ]
    },
    'gemini-direct': {
        name: 'Gemini',
        icon: '✨',
        color: '#4285f4',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        authToken: '',
        useProxy: false,
        apiFormat: 'gemini',
        defaultModel: 'gemini-2.5-flash',
        models: [
            { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'Most capable · 1M ctx', tier: 'opus' },
            { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Fast & balanced · 1M ctx', tier: 'sonnet' },
            { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Previous gen fast · 1M ctx', tier: 'sonnet' },
            { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Stable pro · 2M ctx', tier: 'opus' },
            { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Stable fast · 1M ctx', tier: 'haiku' },
        ]
    },
    groq: {
        name: 'Groq',
        icon: '⚡',
        color: '#f97316',
        baseUrl: 'https://api.groq.com/openai/v1',
        authToken: '',
        useProxy: true,
        apiFormat: 'openai',
        defaultModel: 'llama-3.3-70b-versatile',
        models: [
            { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', desc: 'Fast & capable · 8K ctx', tier: 'sonnet' },
            { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', desc: 'Instant · 8K ctx', tier: 'haiku' },
            { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', desc: 'MoE · 32K ctx', tier: 'sonnet' },
            { id: 'gemma-2-9b-it', label: 'Gemma 2 9B', desc: 'Google · 8K ctx', tier: 'haiku' },
        ]
    }
};

// ---- State ----
const savedSettings = JSON.parse(localStorage.getItem('hai_settings') || 'null');
const savedProviderKeys = JSON.parse(localStorage.getItem('hai_provider_keys') || 'null');

const state = {
    provider: 'orbit',
    model: PROVIDERS.orbit.defaultModel,
    conversations: JSON.parse(localStorage.getItem('hai_conversations') || '[]'),
    activeConversationId: null,
    messages: [],
    isGenerating: false,
    abortController: null,
    activeReader: null, // Track active stream reader for proper cancellation
    settings: savedSettings || {
        systemPrompt: 'You are a helpful, knowledgeable, and friendly AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when helpful.',
        stream: true,
        showTokens: true,
    },
    providerKeys: savedProviderKeys || {
        orbit: {
            baseUrl: 'https://api.orbit-provider.com/v1',
            apiKey: PROVIDERS.orbit.authToken,
            enabled: true,
        },
        openai: {
            baseUrl: 'https://api.openai.com/v1',
            apiKey: '',
            enabled: false,
        },
        'gemini-direct': {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            apiKey: '',
            enabled: false,
        },
        groq: {
            baseUrl: 'https://api.groq.com/openai/v1',
            apiKey: '',
            enabled: false,
        }
    }
};

// ---- DOM Elements ----
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const els = {
    sidebar: $('#sidebar'),
    sidebarOverlay: $('#sidebarOverlay'),
    sidebarToggle: $('#sidebarToggle'),
    closeSidebarBtn: $('#closeSidebarBtn'),
    newChatBtn: $('#newChatBtn'),
    providerTabs: $('#providerTabs'),
    modelSelect: $('#modelSelect'),
    selectTrigger: $('#selectTrigger'),
    selectValue: $('#selectValue'),
    selectOptions: $('#selectOptions'),
    chatList: $('#chatList'),
    clearAllBtn: $('#clearAllBtn'),
    settingsBtn: $('#settingsBtn'),
    messagesContainer: $('#messagesContainer'),
    messagesInner: $('#messagesInner'),
    welcomeScreen: $('#welcomeScreen'),
    welcomeProviderCards: $('#welcomeProviderCards'),
    badgeLabel: $('#badgeLabel'),
    tokenCount: $('#tokenCount'),
    tokenCounter: $('#tokenCounter'),
    exportBtn: $('#exportBtn'),
    messageInput: $('#messageInput'),
    charCount: $('#charCount'),
    sendBtn: $('#sendBtn'),
    stopBtn: $('#stopBtn'),
    tempSlider: $('#tempSlider'),
    tempValue: $('#tempValue'),
    maxTokens: $('#maxTokens'),
    settingsModal: $('#settingsModal'),
    closeSettingsBtn: $('#closeSettingsBtn'),
    settingsTabs: $('#settingsTabs'),
    settingSystemPrompt: $('#settingSystemPrompt'),
    settingStream: $('#settingStream'),
    settingTokens: $('#settingTokens'),
    resetSettingsBtn: $('#resetSettingsBtn'),
    saveSettingsBtn: $('#saveSettingsBtn'),
    toastContainer: $('#toastContainer'),
    ambientBg: $('#ambientBg'),
    settingsLockScreen: $('#settingsLockScreen'),
    settingsPasswordInput: $('#settingsPasswordInput'),
    unlockSettingsBtn: $('#unlockSettingsBtn'),
    settingsContent: $('#settingsContent'),
    settingsModalFooter: $('#settingsModalFooter'),
};

// ---- Initialize ----
function init() {
    setupMarked();
    renderProviderTabs();
    renderWelcomeProviderCards();
    setupEventListeners();
    renderModelOptions();
    renderChatList();
    loadSettings();
    applyProviderTheme();
    updateUI();
}

// ---- Markdown Setup ----
function setupMarked() {
    const renderer = new marked.Renderer();

    renderer.code = function (code, language) {
        if (typeof code === 'object') {
            language = code.lang;
            code = code.text;
        }
        const lang = language || 'plaintext';
        let highlighted;
        try {
            if (hljs.getLanguage(lang)) {
                highlighted = hljs.highlight(code, { language: lang }).value;
            } else {
                highlighted = hljs.highlightAuto(code).value;
            }
        } catch {
            highlighted = escapeHtml(code);
        }
        const id = 'code-' + Math.random().toString(36).slice(2, 9);
        return `<pre><div class="code-header"><span>${lang}</span><button class="copy-btn" onclick="copyCode('${id}', this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</button></div><code id="${id}" class="hljs language-${lang}">${highlighted}</code></pre>`;
    };

    marked.setOptions({
        renderer,
        breaks: true,
        gfm: true,
    });
}

// ---- Provider Tab Rendering ----
function renderProviderTabs() {
    const tabsHtml = Object.keys(PROVIDERS).map(key => {
        const p = PROVIDERS[key];
        const isEnabled = state.providerKeys[key]?.enabled;
        if (!isEnabled) return '';
        return `
            <button class="provider-tab ${key === state.provider ? 'active' : ''}" data-provider="${key}">
                <span class="tab-dot"></span>
                <span class="tab-label">${p.name}</span>
            </button>
        `;
    }).join('');

    els.providerTabs.innerHTML = tabsHtml;

    els.providerTabs.querySelectorAll('.provider-tab').forEach(tab => {
        tab.addEventListener('click', () => switchProvider(tab.dataset.provider));
    });
}

function renderWelcomeProviderCards() {
    const cardsHtml = Object.keys(PROVIDERS).map(key => {
        const p = PROVIDERS[key];
        const isEnabled = state.providerKeys[key]?.enabled;
        const statusClass = isEnabled ? 'active' : 'disabled';
        const statusText = isEnabled ? 'Active' : 'Not configured';
        const cardClass = key === 'orbit' ? 'orbit-card' : key === 'openai' ? 'openai-card' : 'gemini-card';
        return `
            <div class="provider-card ${cardClass}">
                <span class="pc-dot"></span>
                <span>${p.name}</span>
                <span class="pc-status">${statusText}</span>
            </div>
        `;
    }).join('');

    els.welcomeProviderCards.innerHTML = cardsHtml;
}

// ---- Event Listeners ----
function setupEventListeners() {
    // Sidebar toggle
    els.sidebarToggle.addEventListener('click', () => {
        els.sidebar.classList.toggle('open');
        els.sidebar.classList.toggle('closed');
        if (window.innerWidth <= 768) {
            els.sidebarOverlay.classList.toggle('show');
        }
    });

    els.sidebarOverlay.addEventListener('click', () => {
        els.sidebar.classList.remove('open');
        els.sidebarOverlay.classList.remove('show');
        els.sidebar.classList.add('closed');
    });

    if (els.closeSidebarBtn) {
        els.closeSidebarBtn.addEventListener('click', () => {
            els.sidebar.classList.remove('open');
            els.sidebarOverlay.classList.remove('show');
            els.sidebar.classList.add('closed');
        });
    }

    // New chat
    els.newChatBtn.addEventListener('click', newChat);

    // Model select
    els.selectTrigger.addEventListener('click', () => {
        els.modelSelect.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!els.modelSelect.contains(e.target)) {
            els.modelSelect.classList.remove('open');
        }
    });

    // Clear all
    els.clearAllBtn.addEventListener('click', clearAllConversations);

    // Settings
    els.settingsBtn.addEventListener('click', openSettings);
    els.closeSettingsBtn.addEventListener('click', closeSettings);
    els.settingsModal.addEventListener('click', (e) => {
        if (e.target === els.settingsModal) closeSettings();
    });
    els.saveSettingsBtn.addEventListener('click', saveSettings);
    els.resetSettingsBtn.addEventListener('click', resetSettings);

    // Password Unlock
    els.unlockSettingsBtn.addEventListener('click', validateSettingsPassword);
    els.settingsPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') validateSettingsPassword();
    });

    // Settings tabs
    els.settingsTabs.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            els.settingsTabs.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            $$('.settings-panel').forEach(p => p.classList.remove('active'));
            $(`#panel-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Toggle visibility buttons
    $$('.toggle-vis-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = $(`#${btn.dataset.target}`);
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
            }
        });
    });

    // Input
    els.messageInput.addEventListener('input', handleInputChange);
    els.messageInput.addEventListener('keydown', handleKeydown);
    els.sendBtn.addEventListener('click', sendMessage);
    els.stopBtn.addEventListener('click', stopGeneration);

    // Temperature
    els.tempSlider.addEventListener('input', () => {
        els.tempValue.textContent = (els.tempSlider.value / 100).toFixed(1);
    });

    // Export
    els.exportBtn.addEventListener('click', exportChat);

    // Quick prompts
    $$('.quick-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
            els.messageInput.value = btn.dataset.prompt;
            handleInputChange();
            sendMessage();
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettings();
            els.modelSelect.classList.remove('open');
        }
    });
}

// ---- Provider & Model Management ----
function switchProvider(provider) {
    if (!PROVIDERS[provider]) return;
    state.provider = provider;
    state.model = PROVIDERS[provider].defaultModel;

    renderProviderTabs();
    renderModelOptions();
    applyProviderTheme();
    updateUI();
}

function applyProviderTheme() {
    document.body.setAttribute('data-provider', state.provider);
    const p = PROVIDERS[state.provider];
    els.badgeLabel.textContent = p.name;
}

function renderModelOptions() {
    const models = PROVIDERS[state.provider].models;

    // Group by tier
    const groups = { opus: [], sonnet: [], haiku: [] };
    models.forEach(m => {
        if (groups[m.tier]) groups[m.tier].push(m);
    });

    const tierNames = { opus: 'Flagship', sonnet: 'Balanced', haiku: 'Fast & Light' };

    let html = '';
    for (const tier of ['opus', 'sonnet', 'haiku']) {
        if (groups[tier].length === 0) continue;
        html += `<div class="select-group-label">${tierNames[tier]}</div>`;
        html += groups[tier].map(m => `
            <div class="select-option ${m.id === state.model ? 'active' : ''}" data-model="${m.id}">
                <div class="option-info">
                    <span class="option-label">${m.label}</span>
                    <span class="option-desc">${m.desc}</span>
                </div>
                <span class="option-tier ${m.tier}">${m.tier === 'opus' ? 'PRO' : m.tier === 'sonnet' ? 'STD' : 'LITE'}</span>
            </div>
        `).join('');
    }

    els.selectOptions.innerHTML = html;

    els.selectOptions.querySelectorAll('.select-option').forEach(opt => {
        opt.addEventListener('click', () => {
            state.model = opt.dataset.model;
            els.selectOptions.querySelectorAll('.select-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            els.modelSelect.classList.remove('open');
            updateUI();
        });
    });

    updateUI();
}

function updateUI() {
    const model = PROVIDERS[state.provider].models.find(m => m.id === state.model);
    els.selectValue.textContent = model ? model.label : state.model;
    els.tokenCounter.style.display = state.settings.showTokens ? 'flex' : 'none';
}

// ---- Conversation Management ----
function newChat() {
    state.activeConversationId = null;
    state.messages = [];
    els.messagesInner.innerHTML = '';

    // Clone and re-insert welcome screen
    const welcomeClone = els.welcomeScreen.cloneNode(true);
    els.messagesInner.appendChild(welcomeClone);

    const welcome = els.messagesInner.querySelector('.welcome-screen');
    if (welcome) {
        welcome.style.display = 'flex';
        // Re-render provider cards
        const cardsContainer = welcome.querySelector('#welcomeProviderCards') || welcome.querySelector('.provider-cards');
        if (cardsContainer) {
            const cardsHtml = Object.keys(PROVIDERS).map(key => {
                const p = PROVIDERS[key];
                const isEnabled = state.providerKeys[key]?.enabled;
                const statusText = isEnabled ? 'Active' : 'Not configured';
                const cardClass = key === 'orbit' ? 'orbit-card' : key === 'openai' ? 'openai-card' : 'gemini-card';
                return `
                    <div class="provider-card ${cardClass}">
                        <span class="pc-dot"></span>
                        <span>${p.name}</span>
                        <span class="pc-status">${statusText}</span>
                    </div>
                `;
            }).join('');
            cardsContainer.innerHTML = cardsHtml;
        }

        welcome.querySelectorAll('.quick-prompt').forEach(btn => {
            btn.addEventListener('click', () => {
                els.messageInput.value = btn.dataset.prompt;
                handleInputChange();
                sendMessage();
            });
        });
    }

    renderChatList();
    updateUI();
    els.messageInput.focus();
    els.sidebar.classList.remove('open');
    els.sidebarOverlay.classList.remove('show');
}

function createConversation(firstMessage) {
    const id = 'conv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + '...' : firstMessage;
    const conv = {
        id,
        title,
        provider: state.provider,
        model: state.model,
        createdAt: new Date().toISOString(),
        messages: [],
    };
    state.conversations.unshift(conv);
    state.activeConversationId = id;
    saveConversations();
    renderChatList();
    updateUI();
    return conv;
}

function loadConversation(id) {
    const conv = state.conversations.find(c => c.id === id);
    if (!conv) return;

    state.activeConversationId = id;
    state.messages = [...conv.messages];

    // Switch provider/model to match conversation
    if (PROVIDERS[conv.provider]) {
        state.provider = conv.provider;
        state.model = conv.model;
        renderProviderTabs();
        renderModelOptions();
        applyProviderTheme();
    }

    renderMessages();
    renderChatList();
    updateUI();
    els.sidebar.classList.remove('open');
    els.sidebarOverlay.classList.remove('show');
    scrollToBottom();
}

function deleteConversation(id) {
    state.conversations = state.conversations.filter(c => c.id !== id);
    saveConversations();

    if (state.activeConversationId === id) {
        newChat();
    } else {
        renderChatList();
    }
    showToast('Conversation deleted', 'info');
}

function clearAllConversations() {
    if (state.conversations.length === 0) return;
    state.conversations = [];
    saveConversations();
    newChat();
    showToast('All conversations cleared', 'info');
}

function saveConversations() {
    localStorage.setItem('hai_conversations', JSON.stringify(state.conversations));
}

function saveCurrentConversation() {
    const conv = state.conversations.find(c => c.id === state.activeConversationId);
    if (conv) {
        conv.messages = [...state.messages];
        saveConversations();
    }
}

function getProviderDotColor(providerKey) {
    const colors = {
        'orbit': '#7c3aed',
        'openai': '#10a37f',
        'gemini-direct': '#4285f4',
    };
    return colors[providerKey] || '#7c3aed';
}

function renderChatList() {
    if (state.conversations.length === 0) {
        els.chatList.innerHTML = '<div class="chat-empty">No conversations yet</div>';
        return;
    }

    els.chatList.innerHTML = state.conversations.map(c => `
        <div class="chat-item ${c.id === state.activeConversationId ? 'active' : ''}" data-id="${c.id}">
            <span class="chat-item-provider-dot" style="background:${getProviderDotColor(c.provider)}"></span>
            <span class="chat-item-text">${escapeHtml(c.title)}</span>
            <button class="chat-item-delete" data-delete="${c.id}" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `).join('');

    els.chatList.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.chat-item-delete')) return;
            loadConversation(item.dataset.id);
        });
    });

    els.chatList.querySelectorAll('.chat-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(btn.dataset.delete);
        });
    });
}

// ---- Message Rendering ----
function renderMessages() {
    els.messagesInner.innerHTML = '';
    state.messages.forEach(msg => {
        appendMessageToDOM(msg);
    });
    updateTokenCount();
}

function appendMessageToDOM(msg) {
    const welcome = els.messagesInner.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.classList.add('message', msg.role);
    div.id = msg.id || '';

    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const modelTag = msg.model ? `<span class="message-model-tag">${msg.model}</span>` : '';

    div.innerHTML = `
        <div class="message-avatar">${msg.role === 'user' ? 'U' : 'AI'}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-role">${msg.role === 'user' ? 'You' : 'Himanshu AI'}</span>
                ${modelTag}
                <span class="message-time">${time}</span>
            </div>
            <div class="message-body">${msg.role === 'user' ? escapeHtml(msg.content).replace(/\n/g, '<br>') : renderMarkdown(msg.content)}</div>
            <div class="message-actions">
                <button class="msg-action-btn" onclick="copyMessageContent(this)" data-content="${escapeAttr(msg.content)}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg> Copy
                </button>
            </div>
        </div>
    `;

    els.messagesInner.appendChild(div);
    return div;
}

function renderMarkdown(text) {
    if (!text) return '';
    try {
        let html = marked.parse(text);
        // Render inline images from markdown ![alt](url)
        // marked handles this, but ensure base64 data URIs work
        return html;
    } catch {
        return escapeHtml(text).replace(/\n/g, '<br>');
    }
}

// Render image content (base64 or URL)
function renderImageContent(imageData, mimeType) {
    if (imageData.startsWith('http')) {
        return `<div class="ai-image-container"><img src="${escapeAttr(imageData)}" alt="AI Generated Image" class="ai-generated-image" loading="lazy" onclick="window.open(this.src, '_blank')" /><span class="image-caption">Click to open full size</span></div>`;
    } else {
        // Base64
        const src = `data:${mimeType || 'image/png'};base64,${imageData}`;
        return `<div class="ai-image-container"><img src="${src}" alt="AI Generated Image" class="ai-generated-image" onclick="window.open(this.src, '_blank')" /><span class="image-caption">Click to open full size</span></div>`;
    }
}

// Check if a model is a reasoning model that needs special params
function isReasoningModel(modelId) {
    const reasoningModels = ['o1', 'o1-mini', 'o1-preview', 'o3', 'o3-mini', 'o3-mini-high'];
    return reasoningModels.includes(modelId);
}

function isThinkingModel(modelId) {
    return modelId.includes('thinking');
}

// ---- Input Handling ----
function handleInputChange() {
    const val = els.messageInput.value;
    els.charCount.textContent = val.length;
    els.sendBtn.disabled = val.trim().length === 0 || state.isGenerating;

    // Auto resize
    els.messageInput.style.height = 'auto';
    els.messageInput.style.height = Math.min(els.messageInput.scrollHeight, 200) + 'px';
}

function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!els.sendBtn.disabled) {
            sendMessage();
        }
    }
}

// ---- API Call & Streaming ----
async function sendMessage() {
    const content = els.messageInput.value.trim();
    if (!content || state.isGenerating) return;

    // Validate provider has API key
    const providerKeys = state.providerKeys[state.provider];
    if (!providerKeys || !providerKeys.enabled) {
        showToast(`${PROVIDERS[state.provider].name} is not enabled. Configure it in Settings.`, 'error');
        return;
    }
    if (!providerKeys.apiKey) {
        showToast(`No API key configured for ${PROVIDERS[state.provider].name}. Add one in Settings.`, 'error');
        return;
    }

    // Create conversation if new
    if (!state.activeConversationId) {
        createConversation(content);
    }

    // Add user message
    const userMsg = {
        id: 'msg-' + Date.now(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
    };
    state.messages.push(userMsg);
    appendMessageToDOM(userMsg);

    // Clear input
    els.messageInput.value = '';
    handleInputChange();
    scrollToBottom();

    // Start generation
    state.isGenerating = true;
    els.sendBtn.classList.add('hidden');
    els.stopBtn.classList.remove('hidden');

    // Create assistant message placeholder
    const assistantMsg = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: '',
        model: state.model,
        timestamp: new Date().toISOString(),
    };

    const msgDiv = appendMessageToDOM(assistantMsg);
    const bodyEl = msgDiv.querySelector('.message-body');

    // Show typing indicator
    bodyEl.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    scrollToBottom();

    try {
        const provider = PROVIDERS[state.provider];
        const keys = state.providerKeys[state.provider];
        let baseUrl = (keys.baseUrl || provider.baseUrl).replace(/\/$/, "");
        const authToken = keys.apiKey;

        const systemPrompt = state.settings.systemPrompt;
        const temperature = parseFloat(els.tempSlider.value) / 100;
        const maxTokens = parseInt(els.maxTokens.value) || 4096;

        state.abortController = new AbortController();
        state.activeReader = null;

        if (provider.apiFormat === 'gemini') {
            // Google Gemini native API format
            await callGeminiAPI(baseUrl, authToken, systemPrompt, temperature, maxTokens, bodyEl, assistantMsg);
        } else {
            // OpenAI-compatible format (Orbit, OpenAI)
            await callOpenAICompatibleAPI(baseUrl, authToken, systemPrompt, temperature, maxTokens, provider.useProxy, bodyEl, assistantMsg);
        }

    } catch (err) {
        if (err.name === 'AbortError') {
            // Preserve any partial content already rendered
            const partial = assistantMsg.content;
            if (partial) {
                bodyEl.innerHTML = renderMarkdown(partial) + `<div class="error-message" style="margin-top:12px">⏹ Generation stopped by user</div>`;
            } else {
                bodyEl.innerHTML = `<div class="error-message">⏹ Generation stopped by user</div>`;
            }
        } else {
            console.error('API Error:', err);
            let errorDetail = err.message;
            if (err.message === 'Failed to fetch') {
                errorDetail = 'Network error: The API endpoint may be unreachable. Make sure the proxy server is running (node server.js).';
            }
            // Parse API error for better messaging
            try {
                const parsed = JSON.parse(err.message.replace(/^API \d+: /, ''));
                if (parsed.error?.message) errorDetail = parsed.error.message;
            } catch { }
            bodyEl.innerHTML = `<div class="error-message">
                <strong>Error:</strong> ${escapeHtml(errorDetail)}
                <small style="opacity:0.7;margin-top:4px;display:block;">Check Browser Console (F12) for details.</small>
            </div>`;
            showToast('Request failed', 'error');
        }
    } finally {
        state.isGenerating = false;
        state.abortController = null;
        state.activeReader = null;
        els.sendBtn.classList.remove('hidden');
        els.stopBtn.classList.add('hidden');
        els.sendBtn.disabled = els.messageInput.value.trim().length === 0;

        if (assistantMsg.content) {
            state.messages.push(assistantMsg);
        }
        saveCurrentConversation();
        updateTokenCount();
    }
}

// ---- OpenAI-Compatible API (Orbit + OpenAI) ----
async function callOpenAICompatibleAPI(baseUrl, authToken, systemPrompt, temperature, maxTokens, useProxy, bodyEl, assistantMsg) {
    const apiMessages = [];
    const reasoning = isReasoningModel(state.model);
    const thinking = isThinkingModel(state.model);

    // Reasoning models (o1, o3) don't support system messages — prepend as user context
    if (systemPrompt && !reasoning) {
        apiMessages.push({ role: 'system', content: systemPrompt });
    } else if (systemPrompt && reasoning) {
        apiMessages.push({ role: 'user', content: `[System Instructions]: ${systemPrompt}` });
    }

    state.messages.forEach(m => {
        apiMessages.push({ role: m.role, content: m.content });
    });

    const endpoint = `${baseUrl}/chat/completions`;

    // Build request body based on model type
    const requestBody = {
        model: state.model,
        messages: apiMessages,
    };

    if (reasoning) {
        // Reasoning models: no temperature, no stream, use max_completion_tokens
        requestBody.max_completion_tokens = maxTokens;
        requestBody.stream = false;
    } else if (thinking) {
        // Thinking models: limited params, may not support streaming well
        requestBody.max_tokens = maxTokens;
        requestBody.stream = state.settings.stream;
    } else {
        // Standard models: full param support
        requestBody.max_tokens = maxTokens;
        requestBody.temperature = temperature;
        requestBody.stream = state.settings.stream;
    }

    let response;

    if (useProxy) {
        const proxyUrl = '/proxy';
        response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: requestBody
            }),
            signal: state.abortController.signal,
        });
    } else {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestBody),
            signal: state.abortController.signal,
        });
    }

    if (!response.ok) {
        const errBody = await response.text();
        console.error('Response error:', errBody);
        throw new Error(`API ${response.status}: ${errBody || response.statusText}`);
    }

    // Reasoning models or non-stream: parse JSON response
    const shouldStream = requestBody.stream;

    if (shouldStream) {
        await handleStreamResponse(response, bodyEl, assistantMsg);
    } else {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
        assistantMsg.content = text;
        bodyEl.innerHTML = renderMarkdown(text);
    }
}

// ---- Google Gemini Native API ----
async function callGeminiAPI(baseUrl, authToken, systemPrompt, temperature, maxTokens, bodyEl, assistantMsg) {
    const contents = [];

    // Add conversation history (texts only, skip image parts for history)
    state.messages.forEach(m => {
        if (m.content) {
            contents.push({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            });
        }
    });

    const requestBody = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
        }
    };

    if (systemPrompt) {
        requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const endpoint = state.settings.stream
        ? `${baseUrl}/models/${state.model}:streamGenerateContent?alt=sse&key=${authToken}`
        : `${baseUrl}/models/${state.model}:generateContent?key=${authToken}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: state.abortController.signal,
    });

    if (!response.ok) {
        const errBody = await response.text();
        console.error('Gemini error:', errBody);
        // Try to extract useful error message
        let errMsg = `Gemini API ${response.status}`;
        try {
            const errJson = JSON.parse(errBody);
            if (errJson.error?.message) errMsg = errJson.error.message;
        } catch { errMsg += ': ' + (errBody || response.statusText); }
        throw new Error(errMsg);
    }

    if (state.settings.stream) {
        await handleGeminiStream(response, bodyEl, assistantMsg);
    } else {
        const data = await response.json();
        let resultHtml = '';
        let textContent = '';
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.text) {
                textContent += part.text;
            } else if (part.inlineData) {
                // Handle image responses
                resultHtml += renderImageContent(part.inlineData.data, part.inlineData.mimeType);
            }
        }
        assistantMsg.content = textContent;
        bodyEl.innerHTML = renderMarkdown(textContent) + resultHtml;
    }
}

// ---- Stream Handler (OpenAI format) ----
async function handleStreamResponse(response, bodyEl, assistantMsg) {
    const reader = response.body.getReader();
    state.activeReader = reader; // Track for cancellation
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let renderTimer = null;
    let needsRender = false;

    bodyEl.innerHTML = '';

    // Throttled render: batch DOM updates for performance
    function scheduleRender() {
        needsRender = true;
        if (!renderTimer) {
            renderTimer = requestAnimationFrame(() => {
                if (needsRender) {
                    bodyEl.innerHTML = renderMarkdown(fullText);
                    scrollToBottom();
                    needsRender = false;
                }
                renderTimer = null;
            });
        }
    }

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);

                        if (parsed.choices) {
                            const delta = parsed.choices[0]?.delta;
                            if (delta?.content) {
                                fullText += delta.content;
                            }
                        } else if (parsed.type === 'content_block_delta') {
                            fullText += parsed.delta?.text || '';
                        } else if (parsed.delta?.text) {
                            fullText += parsed.delta.text;
                        }

                        assistantMsg.content = fullText;
                        scheduleRender();
                    } catch {
                        // Skip non-JSON lines
                    }
                }
            }
        }
    } catch (err) {
        if (err.name !== 'AbortError') throw err;
    } finally {
        if (renderTimer) cancelAnimationFrame(renderTimer);
        state.activeReader = null;
    }

    // Final render with full content
    if (fullText) {
        bodyEl.innerHTML = renderMarkdown(fullText);
        scrollToBottom();
    }
}

// ---- Stream Handler (Gemini SSE format) ----
async function handleGeminiStream(response, bodyEl, assistantMsg) {
    const reader = response.body.getReader();
    state.activeReader = reader; // Track for cancellation
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let imageHtml = '';
    let renderTimer = null;
    let needsRender = false;

    bodyEl.innerHTML = '';

    function scheduleRender() {
        needsRender = true;
        if (!renderTimer) {
            renderTimer = requestAnimationFrame(() => {
                if (needsRender) {
                    bodyEl.innerHTML = renderMarkdown(fullText) + imageHtml;
                    scrollToBottom();
                    needsRender = false;
                }
                renderTimer = null;
            });
        }
    }

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (!data) continue;

                    try {
                        const parsed = JSON.parse(data);
                        const parts = parsed.candidates?.[0]?.content?.parts;
                        if (parts) {
                            parts.forEach(p => {
                                if (p.text) {
                                    fullText += p.text;
                                } else if (p.inlineData) {
                                    // Image chunk from Gemini
                                    imageHtml += renderImageContent(p.inlineData.data, p.inlineData.mimeType);
                                }
                            });
                        }

                        assistantMsg.content = fullText;
                        scheduleRender();
                    } catch {
                        // Skip
                    }
                }
            }
        }
    } catch (err) {
        if (err.name !== 'AbortError') throw err;
    } finally {
        if (renderTimer) cancelAnimationFrame(renderTimer);
        state.activeReader = null;
    }

    if (fullText || imageHtml) {
        bodyEl.innerHTML = renderMarkdown(fullText) + imageHtml;
        scrollToBottom();
    }
}

function stopGeneration() {
    // Cancel the active stream reader first for immediate stop
    if (state.activeReader) {
        try { state.activeReader.cancel(); } catch { }
        state.activeReader = null;
    }
    // Then abort the fetch
    if (state.abortController) {
        state.abortController.abort();
    }
}

// ---- Token Counter ----
function updateTokenCount(additionalTokens) {
    const totalChars = state.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    const estimated = Math.ceil(totalChars / 4) + (additionalTokens || 0);
    els.tokenCount.textContent = `~${estimated.toLocaleString()} tokens`;
}

// ---- Settings ----
function loadSettings() {
    els.settingSystemPrompt.value = state.settings.systemPrompt || '';
    els.settingStream.checked = state.settings.stream;
    els.settingTokens.checked = state.settings.showTokens;

    // Load provider keys
    const orbitKeys = state.providerKeys.orbit;
    $('#settingOrbitBaseUrl').value = orbitKeys.baseUrl || '';
    $('#settingOrbitKey').value = orbitKeys.apiKey || '';
    $('#settingOrbitEnabled').checked = orbitKeys.enabled;

    const openaiKeys = state.providerKeys.openai;
    $('#settingOpenAIBaseUrl').value = openaiKeys.baseUrl || '';
    $('#settingOpenAIKey').value = openaiKeys.apiKey || '';
    $('#settingOpenAIEnabled').checked = openaiKeys.enabled;

    const geminiKeys = state.providerKeys['gemini-direct'];
    $('#settingGeminiBaseUrl').value = geminiKeys.baseUrl || '';
    $('#settingGeminiKey').value = geminiKeys.apiKey || '';
    $('#settingGeminiEnabled').checked = geminiKeys.enabled;

    const groqKeys = state.providerKeys.groq || { enabled: false, baseUrl: '', apiKey: '' };
    $('#settingGroqBaseUrl').value = groqKeys.baseUrl || '';
    $('#settingGroqKey').value = groqKeys.apiKey || '';
    $('#settingGroqEnabled').checked = groqKeys.enabled;
}

function openSettings() {
    loadSettings();
    // Reset to lock screen
    els.settingsLockScreen.classList.remove('hidden');
    els.settingsContent.classList.add('hidden');
    els.settingsModalFooter.classList.add('hidden');
    els.settingsPasswordInput.value = '';
    els.settingsModal.classList.remove('hidden');
    setTimeout(() => els.settingsPasswordInput.focus(), 100);
}

function validateSettingsPassword() {
    const password = els.settingsPasswordInput.value;
    if (password === '8492') {
        els.settingsLockScreen.classList.add('hidden');
        els.settingsContent.classList.remove('hidden');
        els.settingsModalFooter.classList.remove('hidden');
        showToast('Settings unlocked', 'success');
    } else {
        showToast('Invalid password', 'error');
        els.settingsPasswordInput.value = '';
        els.settingsPasswordInput.focus();
    }
}

function closeSettings() {
    els.settingsModal.classList.add('hidden');
}

function saveSettings() {
    // General
    state.settings.systemPrompt = els.settingSystemPrompt.value.trim();
    state.settings.stream = els.settingStream.checked;
    state.settings.showTokens = els.settingTokens.checked;

    // Orbit
    state.providerKeys.orbit = {
        baseUrl: $('#settingOrbitBaseUrl').value.trim() || 'https://api.orbit-provider.com/v1',
        apiKey: $('#settingOrbitKey').value.trim(),
        enabled: $('#settingOrbitEnabled').checked,
    };

    // OpenAI
    state.providerKeys.openai = {
        baseUrl: $('#settingOpenAIBaseUrl').value.trim() || 'https://api.openai.com/v1',
        apiKey: $('#settingOpenAIKey').value.trim(),
        enabled: $('#settingOpenAIEnabled').checked,
    };

    // Gemini Direct
    state.providerKeys['gemini-direct'] = {
        baseUrl: $('#settingGeminiBaseUrl').value.trim() || 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: $('#settingGeminiKey').value.trim(),
        enabled: $('#settingGeminiEnabled').checked,
    };

    // Groq
    state.providerKeys.groq = {
        baseUrl: $('#settingGroqBaseUrl').value.trim() || 'https://api.groq.com/openai/v1',
        apiKey: $('#settingGroqKey').value.trim(),
        enabled: $('#settingGroqEnabled').checked,
    };

    // Persist
    localStorage.setItem('hai_settings', JSON.stringify(state.settings));
    localStorage.setItem('hai_provider_keys', JSON.stringify(state.providerKeys));

    // Ensure current provider is still enabled
    if (!state.providerKeys[state.provider]?.enabled) {
        // Switch to first enabled provider
        const firstEnabled = Object.keys(PROVIDERS).find(k => state.providerKeys[k]?.enabled);
        if (firstEnabled) {
            switchProvider(firstEnabled);
        }
    }

    renderProviderTabs();
    renderWelcomeProviderCards();
    applyProviderTheme();
    updateUI();
    closeSettings();
    showToast('Settings saved!', 'success');
}

function resetSettings() {
    state.settings = {
        systemPrompt: 'You are a helpful, knowledgeable, and friendly AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when helpful.',
        stream: true,
        showTokens: true,
    };
    state.providerKeys = {
        orbit: {
            baseUrl: 'https://api.orbit-provider.com/v1',
            apiKey: PROVIDERS.orbit.authToken,
            enabled: true,
        },
        openai: {
            baseUrl: 'https://api.openai.com/v1',
            apiKey: '',
            enabled: false,
        },
        'gemini-direct': {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            apiKey: '',
            enabled: false,
        },
        groq: {
            baseUrl: 'https://api.groq.com/openai/v1',
            apiKey: '',
            enabled: false,
        }
    };
    loadSettings();
    showToast('Settings reset to defaults', 'info');
}

// ---- Export ----
function exportChat() {
    if (state.messages.length === 0) {
        showToast('No messages to export', 'info');
        return;
    }

    const conv = state.conversations.find(c => c.id === state.activeConversationId);
    const title = conv ? conv.title : 'chat';

    let md = `# ${title}\n\n`;
    md += `**Provider:** ${PROVIDERS[state.provider].name}\n`;
    md += `**Model:** ${state.model}\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;

    state.messages.forEach(m => {
        md += `### ${m.role === 'user' ? '👤 You' : '🤖 AI'}\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat exported!', 'success');
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success' ? '<path d="M20 6L9 17l-5-5"/>' :
            type === 'error' ? '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>' :
                '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'}
        </svg>
        <span>${message}</span>
    `;

    els.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 300ms ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ---- Utilities ----
function scrollToBottom() {
    requestAnimationFrame(() => {
        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---- Global Functions (called from HTML) ----
window.copyCode = function (id, btn) {
    const code = document.getElementById(id);
    if (!code) return;
    navigator.clipboard.writeText(code.textContent).then(() => {
        btn.classList.add('copied');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied!`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
        }, 2000);
    });
};

window.copyMessageContent = function (btn) {
    const content = btn.dataset.content;
    navigator.clipboard.writeText(content).then(() => {
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied!`;
        setTimeout(() => {
            btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
        }, 2000);
    });
};

// ---- Start ----
document.addEventListener('DOMContentLoaded', init);
