document.addEventListener('DOMContentLoaded', () => {
    // --- Server Endpoints ---
    const AI_SERVER_URL = 'https://codeweaver-ai-app.onrender.com/generate';
    const DEPLOY_SERVER_URL = 'https://codeweaver-ai-app.onrender.com/deploy';

    // --- Page Elements ---
    const loginPage = document.getElementById('login-page');
    const appWorkspace = document.getElementById('app-workspace');
    const loginForm = document.getElementById('login-form');
    const guestBtn = document.getElementById('guest-btn');

    // --- Chat Elements ---
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const magicWandBtn = document.getElementById('magic-wand-btn');
    const suggestions = document.getElementById('suggestions');

    // --- Editor/Preview Elements ---
    const editorContent = document.querySelector('.editor-content');
    const codeEditor = document.getElementById('code-editor');
    const livePreview = document.getElementById('live-preview');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');
    const toggleSplitViewBtn = document.getElementById('toggle-split-view-btn');
    const deployBtn = document.getElementById('deploy-btn') || document.getElementById('deploy-netlify-btn');

    // --- Mobile View Switcher Elements ---
    const showChatBtn = document.getElementById('show-chat-btn');
    const showEditorBtn = document.getElementById('show-editor-btn');

    // --- State ---
    let fullHtmlContent = createHtmlBoilerplate('');

    // --- Event Listeners ---
    loginForm.addEventListener('submit', (e) => { e.preventDefault(); showWorkspace(); });
    guestBtn.addEventListener('click', showWorkspace);
    sendBtn.addEventListener('click', handleUserMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserMessage(); }
    });
    magicWandBtn.addEventListener('click', () => suggestions.classList.toggle('hidden'));
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            chatInput.value = item.getAttribute('data-prompt');
            suggestions.classList.add('hidden');
            chatInput.focus();
        });
    });
    copyBtn.addEventListener('click', copyCode);
    downloadBtn.addEventListener('click', downloadCodeAsHTML);
    fullscreenBtns.forEach(btn => {
        btn.addEventListener('click', () => toggleFullscreen(btn.getAttribute('data-target')));
    });
    toggleSplitViewBtn.addEventListener('click', toggleSplitView);
    deployBtn.addEventListener('click', deployViaBackend);

    // --- Mobile View Switcher Event Listeners ---
    showChatBtn.addEventListener('click', () => setMobileView('chat'));
    showEditorBtn.addEventListener('click', () => setMobileView('editor'));


    // =============================================
    // ===== CORE APP FUNCTIONS =====
    // =============================================

    function showWorkspace() {
        loginPage.classList.add('hidden');
        appWorkspace.classList.remove('hidden');
        codeEditor.value = fullHtmlContent;
        updatePreview(fullHtmlContent);
        setMobileView('chat');
    }

    async function handleUserMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        displayUserMessage(messageText);
        chatInput.value = '';
        showTypingIndicator();
        
        const aiResponse = await generateAiResponse(messageText);

        removeTypingIndicator();
        displayAiMessage(aiResponse.message);

        if (aiResponse.code) {
            fullHtmlContent = createHtmlBoilerplate(aiResponse.code);
            codeEditor.value = fullHtmlContent;
            updatePreview(fullHtmlContent);

            if (window.innerWidth <= 768) {
                setMobileView('editor');
            }
        }
    }

    async function generateAiResponse(prompt) {
        try {
            const response = await fetch(AI_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Ignore if response body isn't JSON
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();

        } catch (error) {
            console.error('Error fetching from AI server:', error);
            return {
                message: `❌ An error occurred: ${error.message}. Please check the server logs.`,
                code: `<!-- Error: ${error.message} -->`,
            };
        }
    }

    function displayUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message';
        messageEl.innerHTML = `<div class="text">${text}</div><i class="fa-solid fa-user icon"></i>`;
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }

    function displayAiMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message ai-message';
        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.textContent = text || "An error occurred.";
        messageEl.innerHTML = `<i class="fa-solid fa-robot icon"></i>`;
        messageEl.appendChild(textDiv);
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }
    
    function showTypingIndicator() {
        const typingEl = document.createElement('div');
        typingEl.id = 'typing-indicator';
        typingEl.className = 'message ai-message';
        typingEl.innerHTML = `<i class="fa-solid fa-robot icon"></i><div class="text typing-indicator"><span></span><span></span><span></span></div>`;
        chatMessages.appendChild(typingEl);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updatePreview(code) {
        livePreview.srcdoc = code;
    }

    function copyCode() {
        navigator.clipboard.writeText(codeEditor.value).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy'; }, 2000);
        });
    }

    function toggleFullscreen(targetId) {
        const className = targetId === 'chat-container' ? 'chat-fullscreen' : 'editor-fullscreen';
        appWorkspace.classList.toggle(className);
    }
    
    function toggleSplitView() {
        editorContent.classList.toggle('split-view-active');
        const icon = toggleSplitViewBtn.querySelector('i');
        if (editorContent.classList.contains('split-view-active')) {
            icon.classList.remove('fa-columns');
            icon.classList.add('fa-layer-group');
            toggleSplitViewBtn.title = 'Toggle Stacked View';
        } else {
            icon.classList.remove('fa-layer-group');
            icon.classList.add('fa-columns');
            toggleSplitViewBtn.title = 'Toggle Split View';
        }
    }

    function createHtmlBoilerplate(bodyContent) {
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated by CodeWeaver AI</title>\n</head>\n<body>\n${bodyContent || ''}\n</body>\n</html>`;
    }

    function setMobileView(view) {
        if (view === 'chat') {
            appWorkspace.classList.add('view-chat');
            appWorkspace.classList.remove('view-editor');
            showChatBtn.classList.add('active');
            showEditorBtn.classList.remove('active');
        } else {
            appWorkspace.classList.add('view-editor');
            appWorkspace.classList.remove('view-chat');
            showEditorBtn.classList.add('active');
            showChatBtn.classList.remove('active');
        }
    }

    // ===== THE FINAL, CORRECTED DEPLOYMENT FUNCTION =====
    async function deployViaBackend() {
        console.log("Deploy button clicked. Preparing for deployment...");

        const codeEditor = document.getElementById('code-editor');
        if (!codeEditor) {
            console.error("Fatal Error: Could not find the 'code-editor' element.");
            alert("A critical error occurred: The code editor is missing.");
            return;
        }

        const currentEditorText = codeEditor.value;

        // --- THIS IS THE FIX ---
        // Instead of sending the editor's content directly, we will extract just the
        // body content and re-wrap it in the full HTML boilerplate.
        // This guarantees we always deploy a complete, renderable website.

        const bodyStartIndex = currentEditorText.indexOf('<body>') + 6;
        const bodyEndIndex = currentEditorText.lastIndexOf('</body>');

        if (bodyStartIndex < 6 || bodyEndIndex === -1 || bodyEndIndex < bodyStartIndex) {
            alert("Could not find valid <body> tags in the code. Please try generating the code again before deploying.");
            return;
        }

        // Extract only the code that's inside the body
        const bodyContent = currentEditorText.substring(bodyStartIndex, bodyEndIndex).trim();

        // Create a fresh, complete HTML document with that content
        const fullHtmlToDeploy = createHtmlBoilerplate(bodyContent);

        try {
            // Save the *complete and correct* HTML to the browser's session storage
            sessionStorage.setItem('codeToDeploy', fullHtmlToDeploy);
            console.log("Full HTML code saved to sessionStorage. Redirecting to deploy.html...");
            
            // Redirect the user to the new deployment page
            window.location.href = 'deploy.html';
            
        } catch (error) {
            console.error("Failed to save code for deployment:", error);
            alert("An error occurred while preparing for deployment. Please ensure cookies and site data are enabled for this page.");
        }
    }

    function downloadCodeAsHTML() {
        const blob = new Blob([codeEditor.value], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});