document.addEventListener('DOMContentLoaded', () => {
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
    // Note: The deploy button ID should be updated in your HTML to 'deploy-btn'
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
    downloadBtn.addEventListener('click', downloadCodeAsHTML); // Renamed for clarity
    fullscreenBtns.forEach(btn => {
        btn.addEventListener('click', () => toggleFullscreen(btn.getAttribute('data-target')));
    });
    toggleSplitViewBtn.addEventListener('click', toggleSplitView);
    deployBtn.addEventListener('click', deployViaNetlifyDrop); // Main change here

    // --- Mobile View Switcher Event Listeners ---
    showChatBtn.addEventListener('click', () => setMobileView('chat'));
    showEditorBtn.addEventListener('click', () => setMobileView('editor'));


    // =============================================
    // ===== CORE APP FUNCTIONS (UNCHANGED) =====
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
        fullHtmlContent = createHtmlBoilerplate(''); 
        
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

    async function generateAiResponse(userPrompt) {
        try {
            const response = await fetch('https://codeweaver-ai-app.onrender.com/api/generate-code', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userPrompt }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching from AI server:', error);
            return {
                message: `An error occurred: ${error.message}. Please check the console.`,
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
        messageEl.innerHTML = `<i class="fa-solid fa-robot icon"></i><div class="text">${text || "An error occurred."}</div>`;
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
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated by CodeWeaver AI</title>\n</head>\n<body>\n${bodyContent}\n</body>\n</html>`;
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

    // =========================================================
    // ===== NEW DEPLOYMENT AND DOWNLOAD FUNCTIONS =====
    // =========================================================

    /**
     * Creates a zip file of the website, downloads it for the user,
     * and opens the Netlify Drop page for instant, no-token deployment.
     */
    async function deployViaNetlifyDrop() {
        const code = codeEditor.value;
        if (!code || code.trim() === createHtmlBoilerplate('').trim()) {
            alert("There is no code to deploy. Please generate a website first.");
            return;
        }

        const originalButtonText = deployBtn.innerHTML;
        deployBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';
        deployBtn.disabled = true;

        try {
            // 1. Create a zip file containing index.html using the JSZip library
            const zip = new JSZip();
            zip.file("index.html", code);
            const zipBlob = await zip.generateAsync({ type: "blob" });

            // 2. Create a temporary link to download the zip file
            const downloadUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'codeweaver-site.zip'; // This is the file the user will drag and drop
            
            // 3. Programmatically click the link to start the download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            // 4. Open Netlify Drop in a new tab for the user
            window.open('https://app.netlify.com/drop', '_blank');

            // 5. Update UI to show success
            deployBtn.innerHTML = '<i class="fa-solid fa-check"></i> Ready to Drop!';
            
        } catch (error) {
            console.error('Failed to prepare for Netlify Drop:', error);
            alert(`An error occurred while preparing the file: ${error.message}`);
            deployBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error';
        } finally {
            // Reset the button after a few seconds
            setTimeout(() => {
                deployBtn.innerHTML = originalButtonText.includes("Netlify") 
                    ? '<i class="fa-solid fa-cloud-arrow-up"></i> Deploy' 
                    : originalButtonText;
                deployBtn.disabled = false;
            }, 5000);
        }
    }

    /**
     * Downloads only the single index.html file.
     */
    function downloadCodeAsHTML() {
        const blob = new Blob([codeEditor.value], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'index.html';
        document.body.appendChild(a);
a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
});