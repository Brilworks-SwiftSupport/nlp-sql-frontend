(function() {
  // Get configuration from the page
  const config = window.nlpSqlBotConfig || {};
  const connectionId = config.connectionId || '';
  const params = config.params || [];
  const fullPage = config.fullPage || false;
  const baseUrl = config.baseUrl || window.location.origin;
  
  // Check if we need to prompt for any parameter values
  const paramsNeedingValues = params.filter(param => param.promptForValue === true);
  
  if (paramsNeedingValues.length > 0) {
    // Create a modal to collect parameter values
    const modal = document.createElement('div');
    modal.id = 'nlpsql-param-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '400px';
    modalContent.style.maxWidth = '90%';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Please provide values for the following parameters:';
    title.style.marginBottom = '20px';
    modalContent.appendChild(title);
    
    // Create form
    const form = document.createElement('form');
    form.id = 'nlpsql-param-form';
    
    // Add input fields for each parameter
    paramsNeedingValues.forEach((param, index) => {
      const formGroup = document.createElement('div');
      formGroup.style.marginBottom = '15px';
      
      const label = document.createElement('label');
      label.textContent = `${param.table}.${param.column}:`;
      label.style.display = 'block';
      label.style.marginBottom = '5px';
      label.style.fontWeight = 'bold';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `param-${index}`;
      input.style.width = '100%';
      input.style.padding = '8px';
      input.style.borderRadius = '4px';
      input.style.border = '1px solid #ccc';
      
      formGroup.appendChild(label);
      formGroup.appendChild(input);
      form.appendChild(formGroup);
    });
    
    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Continue';
    submitButton.style.backgroundColor = '#4f46e5';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.padding = '10px 20px';
    submitButton.style.borderRadius = '4px';
    submitButton.style.cursor = 'pointer';
    submitButton.style.width = '100%';
    
    form.appendChild(submitButton);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Update parameter values
      paramsNeedingValues.forEach((param, index) => {
        const input = document.getElementById(`param-${index}`);
        param.value = input.value;
        param.promptForValue = false; // No longer need to prompt
      });
      
      // Remove modal
      document.body.removeChild(modal);
      
      // Continue with chatbot initialization
      initializeChatbot();
    });
  } else {
    // No parameters need values, initialize chatbot directly
    initializeChatbot();
  }
  
  function initializeChatbot() {
    // Build the URL with parameters - use absolute URL to avoid path issues
    let chatbotUrl = `${baseUrl}/chatbot-widget/${connectionId}`;
    
    // Add query parameters if available
    if (params && params.length > 0) {
      const queryParams = [];
      
      console.log('Building URL with parameters:', params);
      
      params.forEach((param, index) => {
        if (param.table && param.column) {
          // Use index to keep parameter groups together
          queryParams.push(`param_table_${index}=${encodeURIComponent(param.table)}`);
          queryParams.push(`param_column_${index}=${encodeURIComponent(param.column)}`);
          if (param.value !== null && param.value !== undefined) {
            queryParams.push(`param_value_${index}=${encodeURIComponent(param.value)}`);
          }
        }
      });
      
      if (queryParams.length > 0) {
        chatbotUrl += '?' + queryParams.join('&');
      }
    }
    
    console.log("Loading chatbot from URL:", chatbotUrl);
    
    if (fullPage) {
      // Full page mode - replace the entire page content
      window.location.href = chatbotUrl;
    } else {
      // Widget mode - futuristic floating chat widget
      const container = document.createElement('div');
      container.id = 'nlpsql-chatbot-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.width = '380px';
      container.style.height = '550px';
      container.style.border = 'none';
      container.style.borderRadius = '16px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 15px rgba(59, 130, 246, 0.3)';
      container.style.zIndex = '9999';
      container.style.display = 'none'; // Initially hidden
      container.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      // Create iframe to load the chatbot
      const iframe = document.createElement('iframe');
      iframe.src = chatbotUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '16px';

      container.appendChild(iframe);
      document.body.appendChild(container);

      // Add toggle button with futuristic design
      const toggleButton = document.createElement('button');
      toggleButton.style.position = 'fixed';
      toggleButton.style.bottom = '20px';
      toggleButton.style.right = '20px';
      toggleButton.style.width = '60px';
      toggleButton.style.height = '60px';
      toggleButton.style.backgroundColor = '#2563eb';
      toggleButton.style.color = 'white';
      toggleButton.style.border = 'none';
      toggleButton.style.borderRadius = '50%';
      toggleButton.style.cursor = 'pointer';
      toggleButton.style.zIndex = '10000';
      toggleButton.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.4), 0 0 10px rgba(59, 130, 246, 0.3)';
      toggleButton.style.display = 'flex';
      toggleButton.style.alignItems = 'center';
      toggleButton.style.justifyContent = 'center';
      toggleButton.style.transition = 'all 0.3s ease';
      toggleButton.style.overflow = 'hidden';

      // Add AI icon
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
        </svg>
      `;

      document.body.appendChild(toggleButton);

      // Add pulse effect around the button
      const pulseEffect = document.createElement('div');
      pulseEffect.style.position = 'fixed';
      pulseEffect.style.bottom = '20px';
      pulseEffect.style.right = '20px';
      pulseEffect.style.width = '60px';
      pulseEffect.style.height = '60px';
      pulseEffect.style.borderRadius = '50%';
      pulseEffect.style.backgroundColor = 'transparent';
      pulseEffect.style.border = '2px solid rgba(59, 130, 246, 0.5)';
      pulseEffect.style.zIndex = '9999';
      pulseEffect.style.animation = 'pulse 2s infinite';
      pulseEffect.style.pointerEvents = 'none';

      // Add keyframes for pulse animation
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(pulseEffect);

      // Toggle chatbot visibility
      toggleButton.addEventListener('click', function() {
        if (container.style.display === 'none') {
          container.style.display = 'block';
          toggleButton.style.backgroundColor = '#1e40af';
          
          // Change to close icon
          toggleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          `;
          
          // Hide pulse effect
          pulseEffect.style.display = 'none';
          
          // Animation effect
          container.style.transform = 'translateY(20px) scale(0.95)';
          container.style.opacity = '0';
          setTimeout(() => {
            container.style.transform = 'translateY(0) scale(1)';
            container.style.opacity = '1';
          }, 50);
        } else {
          // Animation effect for closing
          container.style.transform = 'translateY(20px) scale(0.95)';
          container.style.opacity = '0';
          setTimeout(() => {
            container.style.display = 'none';
          }, 300);
          
          // Change back to AI icon
          toggleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
            </svg>
          `;
          toggleButton.style.backgroundColor = '#2563eb';
          
          // Show pulse effect again
          pulseEffect.style.display = 'block';
        }
      });

      // Hover effect for button
      toggleButton.addEventListener('mouseover', function() {
        toggleButton.style.transform = 'scale(1.1)';
        toggleButton.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.5), 0 0 15px rgba(59, 130, 246, 0.4)';
      });
      toggleButton.addEventListener('mouseout', function() {
        toggleButton.style.transform = 'scale(1)';
        toggleButton.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.4), 0 0 10px rgba(59, 130, 246, 0.3)';
      });
    }
  }
})();
