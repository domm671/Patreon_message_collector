// 当页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const messageList = document.getElementById('messageList');
  const searchBox = document.getElementById('searchBox');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');
  const exportDialog = document.getElementById('exportDialog');
  const backdrop = document.getElementById('backdrop');
  const cancelExport = document.getElementById('cancelExport');
  const exportJson = document.getElementById('exportJson');
  const exportTxt = document.getElementById('exportTxt');
  const exportMd = document.getElementById('exportMd');
  const exportHtml = document.getElementById('exportHtml');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const selectedCountSpan = document.getElementById('selectedCount');
  
  // 保存当前展示的消息和选中状态
  let currentMessages = [];
  let selectedMessageIds = new Set();
  
  // 加载保存的消息
  loadSavedMessages();
  
  // 事件监听器
  searchBox.addEventListener('input', filterMessages);
  clearBtn.addEventListener('click', clearSearch);
  exportBtn.addEventListener('click', showExportDialog);
  backdrop.addEventListener('click', hideExportDialog);
  cancelExport.addEventListener('click', hideExportDialog);
  exportJson.addEventListener('click', () => exportMessages('json'));
  exportTxt.addEventListener('click', () => exportMessages('txt'));
  exportMd.addEventListener('click', () => exportMessages('md'));
  exportHtml.addEventListener('click', () => exportMessages('html'));
  selectAllCheckbox.addEventListener('change', toggleSelectAll);
  
  // 全选/取消全选
  function toggleSelectAll() {
    if (selectAllCheckbox.checked) {
      // 选中所有消息
      currentMessages.forEach(message => {
        selectedMessageIds.add(message.id);
      });
      // 更新所有复选框状态
      document.querySelectorAll('.message-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      });
    } else {
      // 取消选中所有消息
      selectedMessageIds.clear();
      // 更新所有复选框状态
      document.querySelectorAll('.message-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
    }
    updateSelectedCount();
  }
  
  // 更新选中消息计数
  function updateSelectedCount() {
    selectedCountSpan.textContent = `Selected: ${selectedMessageIds.size}`;
    
    // 如果没有选中的消息，禁用导出按钮
    exportBtn.disabled = selectedMessageIds.size === 0;
    exportBtn.style.opacity = selectedMessageIds.size === 0 ? '0.5' : '1';
  }
  
  // 处理消息勾选
  function handleMessageCheckboxChange(event) {
    const checkbox = event.target;
    const messageId = checkbox.dataset.messageId;
    
    if (checkbox.checked) {
      selectedMessageIds.add(messageId);
    } else {
      selectedMessageIds.delete(messageId);
      // 取消某个消息的选中时，也要取消"全选"的勾选状态
      selectAllCheckbox.checked = false;
    }
    
    // 检查是否所有消息都被选中
    const allChecked = currentMessages.every(message => 
      selectedMessageIds.has(message.id)
    );
    selectAllCheckbox.checked = allChecked && currentMessages.length > 0;
    
    updateSelectedCount();
  }
  
  // 加载保存的消息
  function loadSavedMessages() {
    chrome.storage.local.get(['savedPatreonMessages'], result => {
      const savedMessages = result.savedPatreonMessages || [];
      currentMessages = savedMessages;
      renderMessages(savedMessages);
      updateSelectedCount();
    });
  }
  
  // 呈现消息列表
  function renderMessages(messages) {
    // 清空消息列表
    messageList.innerHTML = '';
    currentMessages = messages;
    
    if (messages.length === 0) {
      // 显示"暂无消息"提示
      const noMessages = document.createElement('div');
      noMessages.className = 'no-messages';
      noMessages.textContent = 'No saved messages';
      messageList.appendChild(noMessages);
      
      // 禁用全选复选框
      selectAllCheckbox.disabled = true;
      selectAllCheckbox.checked = false;
      return;
    }
    
    // 启用全选复选框
    selectAllCheckbox.disabled = false;
    
    // 不再对消息进行排序，保持存储中的顺序
    // 这样移动操作才能生效
    
    // 创建消息元素
    messages.forEach((message, index) => {
      const messageItem = document.createElement('div');
      messageItem.className = 'message-item';
      // 如果是回复，添加回复样式
      if (message.type === 'reply') {
        messageItem.classList.add('reply-item');
      }
      messageItem.dataset.id = message.id;
      messageItem.dataset.index = index;
      
      // 添加消息复选框
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'message-checkbox';
      checkbox.dataset.messageId = message.id;
      checkbox.checked = selectedMessageIds.has(message.id);
      checkbox.addEventListener('change', handleMessageCheckboxChange);
      
      messageItem.appendChild(checkbox);
      
      // 消息内容包装器
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'message-content-wrapper';
      
      // 消息头部（作者和时间）
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const messageAuthor = document.createElement('div');
      messageAuthor.className = 'message-author';
      messageAuthor.textContent = message.author;
      
      const messageTime = document.createElement('div');
      messageTime.className = 'message-time';
      messageTime.textContent = message.time;
      
      // 如果是回复，添加标识
      if (message.type === 'reply') {
        const replyBadge = document.createElement('span');
        replyBadge.className = 'reply-badge';
        replyBadge.textContent = 'reply';
        messageHeader.appendChild(replyBadge);
      }
      
      messageHeader.appendChild(messageAuthor);
      messageHeader.appendChild(messageTime);
      
      // 消息内容
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = message.content;
      
      // 添加图片展示
      if (message.images && message.images.length > 0) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'message-images';
        
        message.images.forEach(imageUrl => {
          const imgWrapper = document.createElement('div');
          imgWrapper.className = 'image-wrapper';
          
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = '消息图片';
          img.className = 'message-image';
          
          // 添加点击图片放大功能
          img.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            
            const modalImg = document.createElement('img');
            modalImg.src = imageUrl;
            modalImg.className = 'modal-content';
            
            modal.appendChild(modalImg);
            document.body.appendChild(modal);
            
            // 点击模态框关闭
            modal.addEventListener('click', () => {
              document.body.removeChild(modal);
            });
          });
          
          imgWrapper.appendChild(img);
          imageContainer.appendChild(imgWrapper);
        });
        
        messageContent.appendChild(imageContainer);
      }
      
      // 消息操作
      const messageActions = document.createElement('div');
      messageActions.className = 'message-actions';
      
      // 添加上下移动按钮
      const moveUpBtn = document.createElement('button');
      moveUpBtn.className = 'move-btn move-up-btn';
      moveUpBtn.innerHTML = '&#9650;'; // 上箭头Unicode字符
      moveUpBtn.title = '向上移动';
      moveUpBtn.dataset.messageId = message.id;
      moveUpBtn.dataset.direction = 'up';
      moveUpBtn.dataset.index = index;
      moveUpBtn.addEventListener('click', handleMoveButtonClick);
      
      const moveDownBtn = document.createElement('button');
      moveDownBtn.className = 'move-btn move-down-btn';
      moveDownBtn.innerHTML = '&#9660;'; // 下箭头Unicode字符
      moveDownBtn.title = '向下移动';
      moveDownBtn.dataset.messageId = message.id;
      moveDownBtn.dataset.direction = 'down';
      moveDownBtn.dataset.index = index;
      moveDownBtn.addEventListener('click', handleMoveButtonClick);
      
      // 禁用第一个消息的向上箭头和最后一个消息的向下箭头
      if (index === 0) {
        moveUpBtn.disabled = true;
        moveUpBtn.classList.add('disabled');
      }
      if (index === messages.length - 1) {
        moveDownBtn.disabled = true;
        moveDownBtn.classList.add('disabled');
      }
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'delete';
      deleteBtn.addEventListener('click', () => deleteMessage(message.id));
      
      messageActions.appendChild(moveUpBtn);
      messageActions.appendChild(moveDownBtn);
      messageActions.appendChild(deleteBtn);
      
      // 将所有元素添加到消息内容包装器
      contentWrapper.appendChild(messageHeader);
      contentWrapper.appendChild(messageContent);
      contentWrapper.appendChild(messageActions);
      
      // 将内容包装器添加到消息项
      messageItem.appendChild(contentWrapper);
      
      // 将消息项添加到消息列表
      messageList.appendChild(messageItem);
    });
    
    // 更新全选复选框状态
    const allMessagesSelected = messages.length > 0 && 
      messages.every(message => selectedMessageIds.has(message.id));
    selectAllCheckbox.checked = allMessagesSelected;
    
    updateSelectedCount();
  }
  
  // 添加消息位置移动功能
  function moveMessage(index, direction, messageId) {
    chrome.storage.local.get(['savedPatreonMessages'], result => {
      let savedMessages = result.savedPatreonMessages || [];
      
      // 使用传入的messageId找到实际的当前索引位置
      const currentIndex = savedMessages.findIndex(message => message.id === messageId);
      if (currentIndex === -1) return; // 消息未找到
      
      // 计算目标位置
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // 检查是否可以移动
      if (newIndex < 0 || newIndex >= savedMessages.length) {
        return;
      }
      
      // 获取要移动的消息
      const messageToMove = savedMessages[currentIndex];
      
      // 创建新的数组，不使用数组解构赋值
      const newMessages = [...savedMessages];
      
      // 从数组中移除消息
      newMessages.splice(currentIndex, 1);
      
      // 在新位置插入消息
      newMessages.splice(newIndex, 0, messageToMove);
      
      // 保存更新后的消息顺序
      chrome.storage.local.set({ savedPatreonMessages: newMessages }, () => {
        // 重新获取最新数据并渲染（确保渲染的是最新保存的数据）
        chrome.storage.local.get(['savedPatreonMessages'], freshResult => {
          renderMessages(freshResult.savedPatreonMessages || []);
        });
      });
    });
  }
  
  // 过滤消息
  function filterMessages() {
    const searchTerm = searchBox.value.toLowerCase();
    
    chrome.storage.local.get(['savedPatreonMessages'], result => {
      const savedMessages = result.savedPatreonMessages || [];
      
      if (!searchTerm) {
        renderMessages(savedMessages);
        return;
      }
      
      // 过滤匹配搜索词的消息
      const filteredMessages = savedMessages.filter(message => {
        return (
          message.content.toLowerCase().includes(searchTerm) ||
          message.author.toLowerCase().includes(searchTerm)
        );
      });
      
      // 注意：这里不需要额外调整排序，renderMessages函数会处理排序
      renderMessages(filteredMessages);
    });
  }
  
  // 清除搜索
  function clearSearch() {
    searchBox.value = '';
    loadSavedMessages();
  }
  
  // 删除消息
  function deleteMessage(messageId) {
    chrome.storage.local.get(['savedPatreonMessages'], result => {
      let savedMessages = result.savedPatreonMessages || [];
      
      // 过滤掉要删除的消息
      savedMessages = savedMessages.filter(message => message.id !== messageId);
      
      // 如果消息被选中，从选中集合中移除
      if (selectedMessageIds.has(messageId)) {
        selectedMessageIds.delete(messageId);
      }
      
      // 保存更新后的消息，触发storage.onChanged事件
      chrome.storage.local.set({ savedPatreonMessages: savedMessages }, () => {
        // 重新渲染消息列表
        renderMessages(savedMessages);
      });
    });
  }
  
  // 显示导出对话框
  function showExportDialog() {
    // 如果没有选中的消息，显示提示并返回
    if (selectedMessageIds.size === 0) {
      alert('Please select at least one message');
      return;
    }
    
    exportDialog.classList.add('show');
    backdrop.classList.add('show');
  }
  
  // 隐藏导出对话框
  function hideExportDialog() {
    exportDialog.classList.remove('show');
    backdrop.classList.remove('show');
  }
  
  // 导出消息
  function exportMessages(format) {
    chrome.storage.local.get(['savedPatreonMessages'], result => {
      let savedMessages = result.savedPatreonMessages || [];
      
      // 只导出被选中的消息
      const messagesToExport = savedMessages.filter(message => 
        selectedMessageIds.has(message.id)
      );
      
      if (messagesToExport.length === 0) {
        alert('Please select at least one message to export');
        return;
      }
      
      // 不对消息进行排序，保持存储中的顺序一致
      
      let content = '';
      let filename = `patreon_messages_${new Date().toISOString().split('T')[0]}`;
      let type = '';
      
      if (format === 'json') {
        content = JSON.stringify(messagesToExport, null, 2);
        filename += '.json';
        type = 'application/json';
      } 
      else if (format === 'txt') {
        messagesToExport.forEach(message => {
          content += `Author: ${message.author}\n`;
          
          // 使用UTC时间格式化为本地时间
          if (message.utcTime) {
            const dateObj = new Date(message.utcTime);
            content += `Time: ${dateObj.toLocaleString()} (UTC: ${message.utcTime})\n`;
          } else {
            content += `Time: ${message.time}\n`;
          }
          
          content += `Content: ${message.content}\n`;
          
          // 添加图片链接
          if (message.images && message.images.length > 0) {
            content += `Img src:\n`;
            message.images.forEach((imgUrl, index) => {
              content += `${index + 1}. ${imgUrl}\n`;
            });
          }
          
          content += '----------------------------\n\n';
        });
        filename += '.txt';
        type = 'text/plain';
      }
      else if (format === 'md') {
        // Markdown格式导出
        content = `# Patreon Saved Messages\n\n`;
        content += `> Export Time: ${new Date().toLocaleString()}\n`;
        content += `> Total Messages: ${messagesToExport.length}\n\n`;
        
        messagesToExport.forEach((message, index) => {
          // 添加序号
          content += `## ${index + 1}. ${message.author}'s ${message.type === 'reply' ? 'Reply' : 'Message'}\n\n`;
          
          // 显示本地化时间，如果有utcTime则添加详细信息
          if (message.utcTime) {
            // 格式化UTC时间，显示为本地时间
            const dateObj = new Date(message.utcTime);
            const localTimeStr = dateObj.toLocaleString();
            content += `**Time**: ${localTimeStr} (Original UTC: ${message.utcTime})\n\n`;
          } else {
            content += `**Time**: ${message.time}\n\n`;
          }
          
          // 使用Markdown引用样式包装内容
          content += `${message.content.split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
          
          // 添加图片
          if (message.images && message.images.length > 0) {
            content += `**Images**:\n\n`;
            message.images.forEach(imgUrl => {
              content += `![Image](${imgUrl})\n\n`;
            });
          }
          
          content += `---\n\n`;
        });
        
        filename += '.md';
        type = 'text/markdown';
      }
      else if (format === 'html') {
        content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Patreon Saved Messages</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 5px; }
    .reply { border-left: 3px solid #e85b46; background-color: #fffaf9; }
    .author { font-weight: bold; }
    .time { color: #666; font-size: 0.9em; }
    .type { display: inline-block; background: #e85b46; color: white; font-size: 10px; padding: 2px 5px; border-radius: 3px; margin-right: 5px; }
    .content { margin: 10px 0; }
    .message-images { margin-top: 10px; }
    .message-images img { max-width: 100%; height: auto; margin: 5px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Patreon Saved Messages</h1>
  <p>Export Time: ${new Date().toLocaleString()}</p>
  <p>Total Messages: ${messagesToExport.length}</p>
`;

        messagesToExport.forEach(message => {
          // 准备时间显示
          let timeDisplay = message.time;
          if (message.utcTime) {
            // 格式化UTC时间，显示为本地时间
            const dateObj = new Date(message.utcTime);
            timeDisplay = dateObj.toLocaleString();
          }

          content += `  <div class="message ${message.type === 'reply' ? 'reply' : ''}">
    ${message.type === 'reply' ? '<span class="type">Reply</span>' : ''}
    <div class="author">${message.author}</div>
    <div class="time">${timeDisplay}</div>
    <div class="content">${message.content}</div>`;

          // 添加图片
          if (message.images && message.images.length > 0) {
            content += `    <div class="message-images">`;
            message.images.forEach(imgUrl => {
              content += `\n      <img src="${imgUrl}" alt="Message image">`;
            });
            content += `\n    </div>`;
          }

          content += `\n  </div>\n`;
        });

        content += `</body>
</html>`;
        filename += '.html';
        type = 'text/html';
      }
      
      // 创建下载链接并点击
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      // 释放URL对象
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      // 隐藏导出对话框
      hideExportDialog();
    });
  }
  
  // 处理移动按钮点击
  function handleMoveButtonClick(event) {
    const button = event.currentTarget;
    const direction = button.dataset.direction;
    const messageId = button.dataset.messageId;
    const index = parseInt(button.dataset.index);
    
    // 调用移动函数
    moveMessage(index, direction, messageId);
  }
}); 