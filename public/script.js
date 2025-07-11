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

    // Login/Guest Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, you'd have auth logic here
        alert('Login functionality is for demonstration. Welcome!');
        showWorkspace();
    });

    guestBtn.addEventListener('click', () => {
        showWorkspace();
    });

    // Chat Logic
    sendBtn.addEventListener('click', handleUserMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    // Magic Wand Suggestions
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

    // Editor/Preview Logic
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
        updatePreview(fullHtmlContent); // Initial empty preview
    }

    function handleUserMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        displayUserMessage(messageText);
        chatInput.value = '';
        
        showTypingIndicator();

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = generateAiResponse(messageText);
            removeTypingIndicator();
            displayAiMessage(aiResponse.message);
            
            if (aiResponse.code) {
                // We'll append the new code to the body of our existing HTML
                const bodyEnd = fullHtmlContent.lastIndexOf('</body>');
                fullHtmlContent = fullHtmlContent.substring(0, bodyEnd) + aiResponse.code + '\n</body>\n</html>';
                
                codeEditor.value = fullHtmlContent;
                updatePreview(fullHtmlContent);
            }
        }, 1500);
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
            <div class="text">${text}</div>
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
            appWorkspace.classList.remove('chat-fullscreen', 'editor-fullscreen'); // Remove any existing
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
        body { font-family: sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 1200px; margin: auto; }
        /* AI will add more specific styles here */
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
    }

//     --- MOCK AI LOGIC ---
//     In a real application, this would be an API call to a service like GPT-4.
//     function generateAiResponse(prompt) {
//         const lowerPrompt = prompt.toLowerCase();

//         if (lowerPrompt.includes('nav') || lowerPrompt.includes('navigation')) {
//             return {
//                 message: "Sure, here's a modern navigation bar. I've added it to your website.",
//                 code: `
// <style>
//     .navbar { background-color: #333; overflow: hidden; }
//     .navbar a { float: left; display: block; color: white; text-align: center; padding: 14px 20px; text-decoration: none; }
//     .navbar a:hover { background-color: #ddd; color: black; }
//     .navbar .logo { font-weight: bold; }
// </style>
// <div class="navbar">
//     <a href="#" class="logo">MyLogo</a>
//     <a href="#">Home</a>
//     <a href="#">About</a>
//     <a href="#">Services</a>
//     <a href="#">Contact</a>
// </div>`
//             };
//         }

//         if (lowerPrompt.includes('hero')) {
//             return {
//                 message: "Excellent choice! A hero section has been created and added below the existing content.",
//                 code: `
// <style>
//     .hero { background-color: #1a1a2e; color: white; padding: 100px 20px; text-align: center; }
//     .hero h1 { font-size: 3.5rem; margin-bottom: 10px; }
//     .hero p { font-size: 1.2rem; margin-bottom: 30px; }
//     .hero .cta-button { background-color: #e94560; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
// </style>
// <div class="hero">
//     <div class="container">
//         <h1>Welcome to Your Website</h1>
//         <p>This is a hero section generated by CodeWeaver AI.</p>
//         <a href="#" class="cta-button">Get Started</a>
//     </div>
// </div>`
//             };
//         }

//         if (lowerPrompt.includes('card')) {
//             return {
//                 message: "Here are three responsive cards. I've included placeholders for images and text.",
//                 code: `
// <style>
//     .card-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; padding: 40px 0; }
//     .card { background: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; width: 300px; text-align: left;}
//     .card img { width: 100%; height: 180px; object-fit: cover; }
//     .card-content { padding: 20px; }
//     .card h3 { margin-top: 0; }
// </style>
// <div class="container">
//     <div class="card-container">
//         <div class="card">
//             <img src="https://via.placeholder.com/300x180.png/1a1a2e/ffffff?text=Feature+1" alt="Placeholder Image">
//             <div class="card-content">
//                 <h3>Feature One</h3>
//                 <p>A brief description of this amazing feature.</p>
//             </div>
//         </div>
//         <div class="card">
//             <img src="https://via.placeholder.com/300x180.png/e94560/ffffff?text=Feature+2" alt="Placeholder Image">
//             <div class="card-content">
//                 <h3>Feature Two</h3>
//                 <p>A brief description of this amazing feature.</p>
//             </div>
//         </div>
//         <div class="card">
//             <img src="https://via.placeholder.com/300x180.png/16213e/ffffff?text=Feature+3" alt="Placeholder Image">
//             <div class="card-content">
//                 <h3>Feature Three</h3>
//                 <p>A brief description of this amazing feature.</p>
//             </div>
//         </div>
//     </div>
// </div>`
//             };
//         }
        
//         return {
//             message: "I'm not sure how to build that yet. Try asking for a 'navigation bar', a 'hero section', or a 'card layout'. My capabilities are expanding every day!",
//             code: null
//         };
//     }
// });
// --- NEW SERVER-BASED AI LOGIC ---
// This function now calls our Node.js backend to get a real AI response.
async function generateAiResponse(userPrompt) {
  try {
    // https://codeweaver-server.onrender.com/api/generate-code
    const response = await fetch('https://codeweaver-ai-app.onrender.com/api/generate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: userPrompt }),
    });

    if (!response.ok) {
      // Handle server errors (e.g., 500 internal server error)
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data; // This will return an object like { message: "...", code: "..." }

  } catch (error) {
    console.error('Error fetching from AI server:', error);
    // Return a user-friendly error message to be displayed in the chat
    return {
      message: `I'm having trouble connecting to my brain right now. Please make sure the server is running and try again. Error: ${error.message}`,
      code: null,
    };
  }
}

// We also need to update the handleUserMessage function to be async
// Find the original `handleUserMessage` function and replace it with this:
async function handleUserMessage() { // Notice the 'async' keyword here
    const messageText = chatInput.value.trim();
    if (!messageText) return;

    displayUserMessage(messageText);
    chatInput.value = '';
    
    showTypingIndicator();

    // Now we 'await' the response from our server
    const aiResponse = await generateAiResponse(messageText);
    
    removeTypingIndicator();
    displayAiMessage(aiResponse.message);
    
    if (aiResponse.code) {
        // The logic for appending code remains the same
        const bodyEnd = fullHtmlContent.lastIndexOf('</body>');
        fullHtmlContent = fullHtmlContent.substring(0, bodyEnd) + aiResponse.code + '\n</body>\n</html>';
        
        codeEditor.value = fullHtmlContent;
        updatePreview(fullHtmlContent);
    }
}
 });