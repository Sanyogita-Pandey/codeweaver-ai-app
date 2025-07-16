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
    const deployNetlifyBtn = document.getElementById('deploy-netlify-btn');


    const netlifyModalOverlay = document.getElementById('netlify-modal-overlay');
    const netlifyTokenInput = document.getElementById('netlify-token-input');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSaveDeployBtn = document.getElementById('modal-save-deploy-btn');
    
    // --- NEW: Mobile View Switcher Elements ---
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
    downloadBtn.addEventListener('click', downloadCode);
    fullscreenBtns.forEach(btn => {
        btn.addEventListener('click', () => toggleFullscreen(btn.getAttribute('data-target')));
    });
    toggleSplitViewBtn.addEventListener('click', toggleSplitView);
     deployNetlifyBtn.addEventListener('click', handleNetlifyDeployClick);
    modalCancelBtn.addEventListener('click', hideNetlifyModal);
    modalSaveDeployBtn.addEventListener('click', saveTokenAndDeploy);
    netlifyModalOverlay.addEventListener('click', (e) => {
        if (e.target === netlifyModalOverlay) {
            hideNetlifyModal();
        }
    }); 

    // --- NEW: Mobile View Switcher Event Listeners ---
    showChatBtn.addEventListener('click', () => setMobileView('chat'));
    showEditorBtn.addEventListener('click', () => setMobileView('editor'));

    // --- Main Functions ---

     function handleNetlifyDeployClick() {
        const token = localStorage.getItem('netlify_token');
        if (token) {
            deployToNetlify(token);
        } else {
            showNetlifyModal();
        }
    }

    function showNetlifyModal() {
        netlifyModalOverlay.classList.remove('hidden');
    }

    function hideNetlifyModal() {
        netlifyModalOverlay.classList.add('hidden');
    }

    function saveTokenAndDeploy() {
        const token = netlifyTokenInput.value.trim();
        if (!token) {
            alert('Please enter a valid Netlify token.');
            return;
        }
        localStorage.setItem('netlify_token', token);
        hideNetlifyModal();
        deployToNetlify(token);
    }
    
    async function deployToNetlify(token) {
        const originalButtonText = deployNetlifyBtn.innerHTML;
        deployNetlifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deploying...';
        deployNetlifyBtn.disabled = true;

        try {
            // 1. Create a zip file in memory
            const zip = new JSZip();
            zip.file("index.html", codeEditor.value);
            const zipBlob = await zip.generateAsync({ type: "blob" });

            // 2. Create a new site on Netlify
            const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({}) // Create a site with a random name
            });

            if (!createSiteResponse.ok) {
                if (createSiteResponse.status === 401) throw new Error('Netlify token is invalid or expired. Please provide a new one.');
                throw new Error(`Netlify API Error (Site Creation): ${createSiteResponse.statusText}`);
            }
            const siteData = await createSiteResponse.json();
            const siteId = siteData.id;

            // 3. Deploy the zip file to the new site
            const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/zip',
                    'Authorization': `Bearer ${token}`
                },
                body: zipBlob
            });

            if (!deployResponse.ok) {
                throw new Error(`Netlify API Error (Deploy): ${deployResponse.statusText}`);
            }
            const deployData = await deployResponse.json();
            
            // Success!
            const liveUrl = deployData.ssl_url || deployData.url;
            deployNetlifyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Deployed!';
            alert(`✅ Success! Your site is live at:\n${liveUrl}`);
            
            // Open the new site in a new tab for the user
            window.open(liveUrl, '_blank');

        } catch (error) {
            console.error('Netlify deployment failed:', error);
            alert(`❌ Deployment Failed: ${error.message}`);
            deployNetlifyBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Failed';
        } finally {
            // Reset button after a few seconds
            setTimeout(() => {
                deployNetlifyBtn.innerHTML = originalButtonText;
                deployNetlifyBtn.disabled = false;
            }, 4000);
        }
    }
    
    // Your original deployToCodePen function (renamed button)
    function deployToCodePen() {
        //... (this function's content remains the same)
    }
    function showWorkspace() {
        loginPage.classList.add('hidden');
        appWorkspace.classList.remove('hidden');
        codeEditor.value = fullHtmlContent;
        updatePreview(fullHtmlContent);
        setMobileView('chat'); // Default to chat view
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
            
            // Auto-switch to editor view on mobile after generating code
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

    function downloadCode() {
        const blob = new Blob([codeEditor.value], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'codeweaver-site.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
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

    function deployToCodePen() {
        const code = codeEditor.value;
        if (!code || code.trim() === createHtmlBoilerplate('').trim()) {
            alert("There is no code to deploy. Please generate a website first.");
            return;
        }
        const { html, css } = extractHtmlAndCss(code);
        const data = {
            title: "My CodeWeaver AI Website",
            html: html,
            css: css,
            editors: "110",
        };
        const form = document.createElement('form');
        form.action = 'https://codepen.io/pen/define';
        form.method = 'POST';
        form.target = '_blank';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(data);
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    function extractHtmlAndCss(fullCode) {
        let css = '';
        let html = '';
        const styleRegex = /<style>([\s\S]*?)<\/style>/i;
        const styleMatch = fullCode.match(styleRegex);
        if (styleMatch && styleMatch[1]) {
            css = styleMatch[1].trim();
        }
        const bodyRegex = /<body>([\s\S]*)<\/body>/i;
        const bodyMatch = fullCode.match(bodyRegex);
        if (bodyMatch && bodyMatch[1]) {
            html = bodyMatch[1].replace(styleRegex, '').trim();
        }
        return { html, css };
    }

    function createHtmlBoilerplate(bodyContent) {
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated by CodeWeaver AI</title>\n</head>\n<body>\n${bodyContent}\n</body>\n</html>`;
    }

    // --- NEW: Mobile View Switching Function ---
    function setMobileView(view) {
        // This function will only have a visible effect on mobile due to the CSS media query
        if (view === 'chat') {
            appWorkspace.classList.add('view-chat');
            appWorkspace.classList.remove('view-editor');
            showChatBtn.classList.add('active');
            showEditorBtn.classList.remove('active');
        } else { // 'editor'
            appWorkspace.classList.add('view-editor');
            appWorkspace.classList.remove('view-chat');
            showEditorBtn.classList.add('active');
            showChatBtn.classList.remove('active');
        }
    }
});