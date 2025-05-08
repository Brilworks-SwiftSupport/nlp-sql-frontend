(function() {
  // Get configuration from the page
  const config = window.nlpSqlBotConfig || {};
  const connectionId = config.connectionId || '';
  const params = config.params || [];
  const fullPage = config.fullPage || false;
  
  // Build the URL with parameters - use absolute URL to avoid path issues
  const baseUrl = config.baseUrl || window.location.origin;
  let chatbotUrl = `${baseUrl}/chatbot-widget/${connectionId}`;
  
  // Add query parameters if available
  if (params && params.length > 0) {
    chatbotUrl += '?';
    params.forEach((param, index) => {
      if (param.table && param.column && param.value) {
        if (index > 0) chatbotUrl += '&';
        chatbotUrl += `param_table=${encodeURIComponent(param.table)}&param_column=${encodeURIComponent(param.column)}&param_value=${encodeURIComponent(param.value)}`;
      }
    });
  }
  
  console.log("Loading chatbot from URL:", chatbotUrl);
  
  if (fullPage) {
    // Full page mode - replace the entire page content
    window.location.href = chatbotUrl;
  } else {
    // Widget mode - floating chat widget
    // Create container for the chatbot
    const container = document.createElement('div');
    container.id = 'nlpsql-chatbot-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.width = '350px';
    container.style.height = '500px';
    container.style.border = '1px solid #e2e8f0';
    container.style.borderRadius = '8px';
    container.style.overflow = 'hidden';
    container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    container.style.zIndex = '9999';
    container.style.display = 'none'; // Initially hidden
    
    // Create iframe to load the chatbot
    const iframe = document.createElement('iframe');
    iframe.src = chatbotUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    container.appendChild(iframe);
    document.body.appendChild(container);
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Chat';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '20px';
    toggleButton.style.right = '20px';
    toggleButton.style.padding = '10px 20px';
    toggleButton.style.backgroundColor = '#4f46e5';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '8px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.zIndex = '10000';
    
    document.body.appendChild(toggleButton);
    
    // Toggle chatbot visibility
    toggleButton.addEventListener('click', function() {
      if (container.style.display === 'none') {
        container.style.display = 'block';
        toggleButton.textContent = 'Close';
      } else {
        container.style.display = 'none';
        toggleButton.textContent = 'Chat';
      }
    });
    
    // Add close button to chatbot
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '10001';
    
    container.appendChild(closeButton);
    
    closeButton.addEventListener('click', function() {
      container.style.display = 'none';
      toggleButton.style.display = 'block';
      toggleButton.textContent = 'Chat';
    });
  }
})();
