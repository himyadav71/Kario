/* ============================================
   Orbit AI Chat — Application Logic
   ============================================ */

// ---- Provider Configurations ----
const PROVIDERS = {
    gemini: {
        name: 'Gemini',
        baseUrl: 'https://api.orbit-provider.com/v1',
        authToken: 'sk-orbit-e90b5d832142349b74b8b763569b945c',
        defaultModel: 'gemini-3-flash-preview',
        models: [
            { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview', desc: 'Most capable Gemini model', tier: 'opus' },
            { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview', desc: 'Fast & balanced', tier: 'sonnet' },
            { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', desc: 'Fastest responses, lightweight', tier: 'haiku' },
        ]
    },
    claude: {
        name: 'Claude',
        baseUrl: 'https://api.orbit-provider.com/v1',
        authToken: 'sk-orbit-e90b5d832142349b74b8b763569b945c',
        defaultModel: 'gemini-claude-sonnet-4-5-thinking',
        models: [
            { id: 'gemini-claude-opus-4-6-thinking', label: 'Claude Opus 4.6 Thinking', desc: 'Most powerful reasoning', tier: 'opus' },
            { id: 'gemini-claude-sonnet-4-5-thinking', label: 'Claude Sonnet 4.5 Thinking', desc: 'Balanced with deep thinking', tier: 'sonnet' },
            { id: 'gemini-claude-sonnet-4-5', label: 'Claude Sonnet 4.5', desc: 'Fast & efficient', tier: 'haiku' },
        ]
    }
};

// ---- State ----
const savedSettings = JSON.parse(localStorage.getItem('orbit_settings') || 'null');
if (savedSettings && typeof savedSettings.authToken === 'string' && savedSettings.authToken.includes('***')) {
    savedSettings.authToken = PROVIDERS.gemini.authToken;
}

const state = {
    provider: 'gemini',
    model: PROVIDERS.gemini.defaultModel,
    conversations: JSON.parse(localStorage.getItem('orbit_conversations') || '[]'),
    activeConversationId: null,
    messages: [],
    isGenerating: false,
    abortController: null,
    settings: savedSettings || {
        baseUrl: PROVIDERS.gemini.baseUrl,
        authToken: PROVIDERS.gemini.authToken,
        systemPrompt: 'You are a helpful, knowledgeable, and friendly AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when helpful.',
        stream: true,
        showTokens: true,
    },
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
    providerGemini: $('#providerGemini'),
    providerClaude: $('#providerClaude'),
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
    settingBaseUrl: $('#settingBaseUrl'),
    settingAuthToken: $('#settingAuthToken'),
    toggleTokenVisibility: $('#toggleTokenVisibility'),
    settingSystemPrompt: $('#settingSystemPrompt'),
    settingStream: $('#settingStream'),
    settingTokens: $('#settingTokens'),
    resetSettingsBtn: $('#resetSettingsBtn'),
    saveSettingsBtn: $('#saveSettingsBtn'),
    toastContainer: $('#toastContainer'),
};

// ---- Initialize ----
function init() {
    setupMarked();
    setupEventListeners();
    renderModelOptions();
    renderChatList();
    loadSettings();
    updateUI();
}

// ---- Markdown Setup ----
function setupMarked() {
    const renderer = new marked.Renderer();

    renderer.code = function (code, language) {
        // Handle the case where code might be an object (marked v12+)
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

// ---- Event Listeners ----
function setupEventListeners() {
    // Sidebar toggle
    els.sidebarToggle.addEventListener('click', () => {
        const isOpening = els.sidebar.classList.contains('closed') || !els.sidebar.classList.contains('open');

        els.sidebar.classList.toggle('open');
        els.sidebar.classList.toggle('closed');

        if (window.innerWidth <= 768) {
            els.sidebarOverlay.classList.toggle('show');
        }
    });

    els.sidebarOverlay.addEventListener('click', () => {
        els.sidebar.classList.remove('open');
        els.sidebarOverlay.classList.remove('show');
        els.sidebar.classList.add('closed'); // Ensure it closes on desktop too if toggled
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

    // Provider switch
    els.providerGemini.addEventListener('click', () => switchProvider('gemini'));
    els.providerClaude.addEventListener('click', () => switchProvider('claude'));

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
    els.toggleTokenVisibility.addEventListener('click', () => {
        const input = els.settingAuthToken;
        input.type = input.type === 'password' ? 'text' : 'password';
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
    state.provider = provider;
    state.model = PROVIDERS[provider].defaultModel;

    $$('.provider-btn').forEach(b => b.classList.remove('active'));
    $(`[data-provider="${provider}"]`).classList.add('active');

    renderModelOptions();
    updateUI();
}

function renderModelOptions() {
    const models = PROVIDERS[state.provider].models;
    els.selectOptions.innerHTML = models.map(m => `
        <div class="select-option ${m.id === state.model ? 'active' : ''}" data-model="${m.id}">
            <span class="option-label">${m.label}</span>
            <span class="option-desc">${m.desc}</span>
        </div>
    `).join('');

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
    // els.headerModel.textContent = state.model;
    const conv = state.conversations.find(c => c.id === state.activeConversationId);
    // els.headerTitle.textContent = conv ? conv.title : 'New Chat';

    els.tokenCounter.style.display = state.settings.showTokens ? 'flex' : 'none';
}

// ---- Conversation Management ----
function newChat() {
    state.activeConversationId = null;
    state.messages = [];
    els.messagesInner.innerHTML = '';
    els.messagesInner.appendChild(els.welcomeScreen.cloneNode(true));

    // Re-attach quick prompt listeners
    const welcome = els.messagesInner.querySelector('.welcome-screen');
    if (welcome) {
        welcome.style.display = 'flex';
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
        $$('.provider-btn').forEach(b => b.classList.remove('active'));
        $(`[data-provider="${state.provider}"]`).classList.add('active');
        renderModelOptions();
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
    localStorage.setItem('orbit_conversations', JSON.stringify(state.conversations));
}

function saveCurrentConversation() {
    const conv = state.conversations.find(c => c.id === state.activeConversationId);
    if (conv) {
        conv.messages = [...state.messages];
        saveConversations();
    }
}

function renderChatList() {
    if (state.conversations.length === 0) {
        els.chatList.innerHTML = '<div class="chat-empty">No conversations yet</div>';
        return;
    }

    els.chatList.innerHTML = state.conversations.map(c => `
        <div class="chat-item ${c.id === state.activeConversationId ? 'active' : ''}" data-id="${c.id}">
            <span class="chat-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
            </span>
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

    div.innerHTML = `
        <div class="message-avatar">${msg.role === 'user' ? 'U' : 'AI'}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-role">${msg.role === 'user' ? 'You' : 'Himanshu AI'}</span>
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
        return marked.parse(text);
    } catch {
        return escapeHtml(text).replace(/\n/g, '<br>');
    }
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
        timestamp: new Date().toISOString(),
    };

    const msgDiv = appendMessageToDOM(assistantMsg);
    const bodyEl = msgDiv.querySelector('.message-body');

    // Show typing indicator
    bodyEl.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    scrollToBottom();

    try {
        const provider = PROVIDERS[state.provider];
        let baseUrl = (state.settings.baseUrl || provider.baseUrl).replace(/\/$/, "");
        const authToken = state.settings.authToken || provider.authToken;

        if (!authToken || authToken.includes('***')) {
            throw new Error('Please configure a valid API key in Settings (remove the *** placeholder).');
        }

        const systemPrompt = state.settings.systemPrompt;
        const apiMessages = [];

        // OpenAI format puts system prompt in messages array
        if (systemPrompt) {
            apiMessages.push({ role: 'system', content: systemPrompt });
        }

        state.messages.forEach(m => {
            apiMessages.push({ role: m.role, content: m.content });
        });

        const temperature = parseFloat(els.tempSlider.value) / 100;
        const maxTokens = parseInt(els.maxTokens.value) || 4096;

        state.abortController = new AbortController();

        // Convert base URL to standard OpenAI v1 compatibility if outdated
        if (baseUrl.includes('/cliproxy-api/api/provider/agy')) {
            baseUrl = 'https://api.orbit-provider.com/v1';
        }

        const endpoint = `${baseUrl}/chat/completions`;

        // Routing through LOCAL or VERCEL PROXY
        const proxyUrl = '/proxy';

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: {
                    model: state.model,
                    max_tokens: maxTokens,
                    temperature,
                    messages: apiMessages,
                    stream: state.settings.stream,
                }
            }),
            signal: state.abortController.signal,
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Response error body:', errBody);
            throw new Error(`API ${response.status}: ${errBody || response.statusText}`);
        }

        if (state.settings.stream) {
            await handleStreamResponse(response, bodyEl, assistantMsg);
        } else {
            const data = await response.json();
            const text = data.content?.[0]?.text || data.completion || data.choices?.[0]?.message?.content || '';
            assistantMsg.content = text;
            bodyEl.innerHTML = renderMarkdown(text);
        }

    } catch (err) {
        if (err.name === 'AbortError') {
            bodyEl.innerHTML += `<div class="error-message">⏹ Generation stopped by user</div>`;
        } else {
            console.error('Detailed Catch Error:', err);

            let errorDetail = err.message;
            if (err.message === 'Failed to fetch') {
                errorDetail = 'Failed to fetch: This is likely a CORS issue or the API endpoint is unreachable. Please check if the API supports browser requests or if you need to bypass CORS.';
            }

            bodyEl.innerHTML = `<div class="error-message">
                <strong>Error:</strong> ${escapeHtml(errorDetail)}
                <br><small style="opacity: 0.7; margin-top: 5px; display: block;">Check Browser Console (F12) for more details.</small>
            </div>`;
            showToast('Connection failed', 'error');
        }
    } finally {
        state.isGenerating = false;
        state.abortController = null;
        els.sendBtn.classList.remove('hidden');
        els.stopBtn.classList.add('hidden');
        els.sendBtn.disabled = els.messageInput.value.trim().length === 0;

        // Save
        if (assistantMsg.content) {
            state.messages.push(assistantMsg);
        }
        saveCurrentConversation();
        updateTokenCount();
    }
}

async function handleStreamResponse(response, bodyEl, assistantMsg) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    bodyEl.innerHTML = '';

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

                    // Handle different SSE event types
                    if (parsed.type === 'content_block_delta') {
                        const text = parsed.delta?.text || '';
                        fullText += text;
                        assistantMsg.content = fullText;
                        bodyEl.innerHTML = renderMarkdown(fullText);
                        scrollToBottom();
                    } else if (parsed.type === 'message_delta') {
                        // End of message, could contain usage info
                        if (parsed.usage) {
                            updateTokenCount(parsed.usage.output_tokens);
                        }
                    } else if (parsed.delta?.text) {
                        // Fallback for simpler SSE formats
                        fullText += parsed.delta.text;
                        assistantMsg.content = fullText;
                        bodyEl.innerHTML = renderMarkdown(fullText);
                        scrollToBottom();
                    } else if (parsed.choices) {
                        // OpenAI-compatible format
                        const text = parsed.choices[0]?.delta?.content || '';
                        fullText += text;
                        assistantMsg.content = fullText;
                        bodyEl.innerHTML = renderMarkdown(fullText);
                        scrollToBottom();
                    }
                } catch {
                    // Skip non-JSON lines
                }
            }
        }
    }

    // Final render
    if (fullText) {
        bodyEl.innerHTML = renderMarkdown(fullText);
    }
}

function stopGeneration() {
    if (state.abortController) {
        state.abortController.abort();
    }
}

// ---- Token Counter ----
function updateTokenCount(additionalTokens) {
    // Rough estimation: ~4 chars per token
    const totalChars = state.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    const estimated = Math.ceil(totalChars / 4) + (additionalTokens || 0);
    els.tokenCount.textContent = `~${estimated.toLocaleString()} tokens`;
}

// ---- Settings ----
function loadSettings() {
    els.settingBaseUrl.value = state.settings.baseUrl;
    els.settingAuthToken.value = state.settings.authToken;
    els.settingSystemPrompt.value = state.settings.systemPrompt;
    els.settingStream.checked = state.settings.stream;
    els.settingTokens.checked = state.settings.showTokens;
}

function openSettings() {
    loadSettings();
    els.settingsModal.classList.remove('hidden');
}

function closeSettings() {
    els.settingsModal.classList.add('hidden');
}

function saveSettings() {
    state.settings.baseUrl = els.settingBaseUrl.value.trim();
    state.settings.authToken = els.settingAuthToken.value.trim();
    state.settings.systemPrompt = els.settingSystemPrompt.value.trim();
    state.settings.stream = els.settingStream.checked;
    state.settings.showTokens = els.settingTokens.checked;

    localStorage.setItem('orbit_settings', JSON.stringify(state.settings));
    updateUI();
    closeSettings();
    showToast('Settings saved!', 'success');
}

function resetSettings() {
    const defaults = {
        baseUrl: PROVIDERS[state.provider].baseUrl,
        authToken: PROVIDERS[state.provider].authToken,
        systemPrompt: 'You are a helpful, knowledgeable, and friendly AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when helpful.',
        stream: true,
        showTokens: true,
    };
    state.settings = defaults;
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
    }, 3000);
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
