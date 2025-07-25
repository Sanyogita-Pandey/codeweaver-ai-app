// --- script.js ---
// This is your FRONTEND file. It runs in the user's browser.

document.addEventListener('DOMContentLoaded', () => {
    // --- Server Endpoints (should point to your Render.com backend) ---
    const AI_SERVER_URL = 'https://codeweaver-ai-app.onrender.com/generate';
    // FIXED: Added the deploy URL endpoint
    const DEPLOY_SERVER_URL = 'https://codeweaver-ai-app.onrender.com/deploy';

    // --- Page Elements ---
    const loginPage = document.getElementById('login-page');
    // ... (all your other element variables are fine) ...
    const appWorkspace = document.getElementById('app-workspace');
    const loginForm = document.getElementById('login-form');
    const guestBtn = document.getElementById('guest-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const magicWandBtn = document.getElementById('magic-wand-btn');
    const suggestions = document.getElementById('suggestions');
    const editorContent = document.querySelector('.editor-content');
    const codeEditor = document.getElementById('code-editor');
    const livePreview = document.getElementById('live-preview');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');
    const toggleSplitViewBtn = document.getElementById('toggle-split-view-btn');
    const deployBtn = document.getElementById('deploy-btn');
    const showChatBtn = document.getElementById('show-chat-btn');
    const showEditorBtn = document.getElementById('show-editor-btn');

    // --- Event Listeners ---
    // ... (all your other event listeners are fine) ...
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
    deployBtn.addEventListener('click', deployViaBackend); // This now calls the corrected function
    showChatBtn.addEventListener('click', () => setMobileView('chat'));
    showEditorBtn.addEventListener('click', () => setMobileView('editor'));


    // --- Core Functions ---
    // ... (All other functions like showWorkspace, handleUserMessage, generateAiResponse are fine) ...
    // Your existing `generateAiResponse` function is already well-written with good error handling.

    // =========================================================================
    // ===== FIXED DEPLOYMENT FUNCTION (THIS IS THE MAJOR CHANGE) ==========
    // =========================================================================
    async function deployViaBackend() {
        const codeToDeploy = codeEditor.value;

        if (!codeToDeploy || !codeToDeploy.trim().toLowerCase().startsWith('<!doctype html>')) {
            alert("The editor does not contain a valid website to deploy. Please generate a website first.");
            return;
        }

        // Provide feedback to the user that deployment is in progress
        const originalButtonText = deployBtn.innerHTML;
        deployBtn.disabled = true;
        deployBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deploying...';

        try {
            // Make a direct API call to your server's /deploy endpoint
            const response = await fetch(DEPLOY_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send the code from the editor in the request body
                body: JSON.stringify({ code: codeToDeploy })
            });

            const result = await response.json();

            if (!response.ok) {
                // If the server returned an error (like 400 or 500)
                throw new Error(result.message || 'An unknown deployment error occurred.');
            }

            // Success! Show the live URL to the user.
            alert(`✅ Deployment successful!\n\nYour site is live at:\n${result.url}`);
            // Optionally, open the new site in a new tab
            window.open(result.url, '_blank');

        } catch (error) {
            console.error("Failed to deploy:", error);
            alert(`❌ Deployment Failed:\n\n${error.message}`);
        } finally {
            // Always restore the button to its original state
            deployBtn.disabled = false;
            deployBtn.innerHTML = originalButtonText;
        }
    }
    // =========================================================================

    // Note: The rest of your helper functions (displayUserMessage, updatePreview, etc.)
    // are correct and do not need to be changed. I am omitting them here for brevity.
    function createHtmlBoilerplate(bodyContent) {
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated by CodeWeaver AI</title>\n</head>\n<body>\n${bodyContent || ''}\n</body>\n</html>`;
    }

    function showWorkspace() {
        loginPage.classList.add('hidden');
        appWorkspace.classList.remove('hidden');
        if (!codeEditor.value) {
            const initialContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
</head>
<body>
    <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
        <h1>Welcome!</h1>
        <p>Your live preview will appear here.</p>
    </div>
</body>
</html>`;
            codeEditor.value = initialContent;
            updatePreview(initialContent);
        }
        setMobileView('chat');
    }

    async function handleUserMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;
        displayUserMessage(messageText);
        chatInput.value = '';
        showTypingIndicator();
        try {
            const aiResponse = await generateAiResponse(messageText);
            if (aiResponse.message.startsWith('❌')) { // Handle errors from generateAiResponse
                 displayAiMessage(aiResponse.message);
            } else {
                 displayAiMessage(aiResponse.message);
                if (aiResponse.code) {
                    const fullHtmlContent = createHtmlBoilerplate(aiResponse.code);
                    codeEditor.value = fullHtmlContent;
                    updatePreview(fullHtmlContent);
                    if (window.innerWidth <= 768) {
                        setMobileView('editor');
                    }
                }
            }
        } catch(e) {
             displayAiMessage("A critical error occurred while contacting the AI.");
        } finally {
            removeTypingIndicator();
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
                // Try to parse error text, but fall back if it's not JSON
                let errorMsg = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message;
                } catch (e) { /* Ignore if response is not json */ }
                throw new Error(errorMsg);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching from AI server:', error);
            return { message: `❌ An error occurred: ${error.message}` };
        }
    }
    
    // All other helper functions...
    function displayUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message';
        messageEl.innerHTML = `<div class="text"></div><i class="fa-solid fa-user icon"></i>`;
        messageEl.querySelector('.text').textContent = text;
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }
    function displayAiMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message ai-message';
        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.textContent = text || "An unknown error occurred.";
        messageEl.innerHTML = `<i class="fa-solid fa-robot icon"></i>`;
        messageEl.appendChild(textDiv);
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }
    function showTypingIndicator() {
        if(document.getElementById('typing-indicator')) return;
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
        appWorkspace.classList.toggle(targetId === 'chat-container' ? 'chat-fullscreen' : 'editor-fullscreen');
    }
    function toggleSplitView() {
        editorContent.classList.toggle('split-view-active');
        const icon = toggleSplitViewBtn.querySelector('i');
        icon.classList.toggle('fa-columns');
        icon.classList.toggle('fa-layer-group');
    }
    function setMobileView(view) {
        appWorkspace.classList.toggle('view-chat', view === 'chat');
        appWorkspace.classList.toggle('view-editor', view !== 'chat');
        showChatBtn.classList.toggle('active', view === 'chat');
        showEditorBtn.classList.toggle('active', view !== 'chat');
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
    }
});