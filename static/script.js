document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatBody = document.getElementById('chat-body');
    const modelSelect = document.getElementById('model-select');

    if (sendButton && userInput && chatBody && modelSelect) {
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    } else {
        console.error('One or more required elements are missing from the DOM');
    }

    let currentChatId = null;
    let chats = {};
    let isWaitingForResponse = false;

    function startNewChat() {
        currentChatId = `chat-${Date.now()}`;
        chats[currentChatId] = [];
        updateChatList();
        clearChatBody();
    }

    function updateChatList() {
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        for (const chatId in chats) {
            const chatItem = document.createElement('div');
            chatItem.classList.add('sidebar-item');
            chatItem.textContent = chatId;
            chatItem.onclick = () => loadChat(chatId);
            chatList.appendChild(chatItem);
        }
    }

    function loadChat(chatId) {
        currentChatId = chatId;
        clearChatBody();
        const chatBody = document.getElementById('chat-body');
        chats[chatId].forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message', message.role);
            messageElement.innerHTML = marked.parse(message.content);
            chatBody.appendChild(messageElement);
        });
    }

    function clearChatBody() {
        const chatBody = document.getElementById('chat-body');
        chatBody.innerHTML = '';
    }

    function sendMessage() {
        if (isWaitingForResponse) return;

        const message = userInput.value.trim();
        const model = modelSelect.value;

        if (message === '' || model === '') {
            alert('Please select a model and type a message.');
            return;
        }

        if (!currentChatId) {
            startNewChat();
        }

        addMessageToHistory('user', message);
        userInput.value = '';
        isWaitingForResponse = true;

        // Show typing indicator
        showTypingIndicator();

        // Send the message to the backend
        fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message, chat_id: currentChatId, model: model }),
        })
        .then(response => response.json())
        .then(data => {
            hideTypingIndicator();
            addMessageToHistory('assistant', data.response, true);
            isWaitingForResponse = false;
        })
        .catch(error => {
            console.error('Error:', error);
            hideTypingIndicator();
            isWaitingForResponse = false;
        });
    }

    function addMessageToHistory(role, message, animate = false) {
        const chatBody = document.getElementById('chat-body');
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', role);
        chatBody.appendChild(messageElement);

        if (animate) {
            let index = 0;
            const interval = setInterval(() => {
                messageElement.innerHTML = marked.parse(message.slice(0, index + 1));
                index++;
                if (index === message.length) {
                    clearInterval(interval);
                }
            }, 10);
        } else {
            messageElement.innerHTML = marked.parse(message);
        }

        chatBody.scrollTop = chatBody.scrollHeight;

        if (currentChatId) {
            chats[currentChatId].push({ role, content: message });
        }
    }

    function showTypingIndicator() {
        const chatBody = document.getElementById('chat-body');
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        typingIndicator.id = 'typing-indicator';
        chatBody.appendChild(typingIndicator);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Expose startNewChat to global scope
    window.startNewChat = startNewChat;
});