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
    const codeEditor = document.getElementById('code-editor');
    const livePreview = document.getElementById('live-preview');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');

    // --- State ---
    let fullHtmlContent = createHtmlBoilerplate('');

    // --- Event Listeners ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Login functionality is for demonstration. Welcome!');
        showWorkspace();
    });

    guestBtn.addEventListener('click', () => {
        showWorkspace();
    });

    sendBtn.addEventListener('click', handleUserMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserMessage();
        }
    });

    magicWandBtn.addEventListener('click', () => {
        suggestions.classList.toggle('hidden');
    });

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
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            toggleFullscreen(targetId);
        });
    });

    // --- Functions ---
    function showWorkspace() {
        loginPage.classList.add('hidden');
        appWorkspace.classList.remove('hidden');
        updatePreview(fullHtmlContent);
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
            const bodyEnd = fullHtmlContent.lastIndexOf('</body>');
            fullHtmlContent = fullHtmlContent.substring(0, bodyEnd) + aiResponse.code + '\n</body>\n</html>';
            
            codeEditor.value = formatHtml(fullHtmlContent);
            updatePreview(fullHtmlContent);
        }
    }

    // --- THE CORRECTED FETCH FUNCTION ---
    async function generateAiResponse(userPrompt) {
        try {
            // Use a relative path for the single-server setup.
            const response = await fetch('https://codeweaver-ai-app.onrender.com/api/generate-code', {
                // Explicitly use the POST method.
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userPrompt }),
            });

            // Improved error handling.
            if (!response.ok) {
                const errorText = await response.text(); 
                throw new Error(`Server responded with status: ${response.status}. Body: ${errorText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error fetching from AI server:', error);
            return {
                message: `An error occurred. Please check the browser console for details. Error: ${error.message}`,
                code: null,
            };
        }
    }

    function displayUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message user-message';
        messageEl.innerHTML = `
            <div class="text">${text}</div>
            <i class="fa-solid fa-user icon"></i>
        `;
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }

    function displayAiMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message ai-message';
        messageEl.innerHTML = `
            <i class="fa-solid fa-robot icon"></i>
            <div class="text">${text || "I'm sorry, I couldn't generate a response. Please check the console for errors."}</div>
        `;
        chatMessages.appendChild(messageEl);
        scrollToBottom();
    }
    
    function showTypingIndicator() {
        const typingEl = document.createElement('div');
        typingEl.className = 'message ai-message typing-indicator-container';
        typingEl.innerHTML = `
            <i class="fa-solid fa-robot icon"></i>
            <div class="text typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatMessages.appendChild(typingEl);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator-container');
        if (indicator) {
            indicator.remove();
        }
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
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    }

    function downloadCode() {
        const blob = new Blob([codeEditor.value], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'index.html';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function toggleFullscreen(targetId) {
        const isChat = targetId === 'chat-container';
        const className = isChat ? 'chat-fullscreen' : 'editor-fullscreen';
        
        if (appWorkspace.classList.contains(className)) {
            appWorkspace.classList.remove(className);
        } else {
            appWorkspace.classList.remove('chat-fullscreen', 'editor-fullscreen');
            appWorkspace.classList.add(className);
        }
    }

    function createHtmlBoilerplate(bodyContent) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; margin: 0; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
    }

    // A simple function to make the HTML in the editor more readable
    function formatHtml(html) {
        const tab = '  ';
        let result = '';
        let indent = '';

        html.split(/>\s*</).forEach(function(element) {
            if (element.match( /^\/\w/ )) {
                indent = indent.substring(tab.length);
            }
            result += indent + '<' + element + '>\r\n';
            if (element.match( /^<?\w[^>]*[^\/]$/ ) && !element.startsWith("input") && !element.startsWith("meta") && !element.startsWith("link")) { 
                indent += tab;
            }
        });

        return result.substring(1, result.length-3);
    }
});