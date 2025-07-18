document.addEventListener('DOMContentLoaded', () => {
    // This must match the URL in your main script.js
    const DEPLOY_SERVER_URL = 'https://codeweaver-ai-app.onrender.com/deploy';

    const statusContainer = document.getElementById('deployment-status');
    const loadingState = statusContainer.querySelector('.loading-state');
    const successState = document.getElementById('success-state');
    const errorState = document.getElementById('error-state');
    const deployLink = document.getElementById('deploy-link');
    const errorMessage = document.getElementById('error-message');

    // This function will run immediately when the page loads
    async function initiateDeployment() {
        // Retrieve the code from the browser's temporary session storage
        const codeToDeploy = sessionStorage.getItem('codeToDeploy');

        if (!codeToDeploy) {
            loadingState.classList.add('hidden');
            errorMessage.textContent = 'No code was found to deploy. Please go back to the editor and try again.';
            errorState.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch(DEPLOY_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToDeploy })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'An unknown error occurred during deployment.');
            }

            // --- Handle Success ---
            loadingState.classList.add('hidden');
            deployLink.href = data.url;
            deployLink.textContent = data.url;
            successState.classList.remove('hidden');

        } catch (error) {
            // --- Handle Error ---
            loadingState.classList.add('hidden');
            errorMessage.textContent = error.message;
            errorState.classList.remove('hidden');
        } finally {
            // Clean up the stored code so it's not reused
            sessionStorage.removeItem('codeToDeploy');
        }
    }

    // Start the process as soon as the page is ready
    initiateDeployment();
});