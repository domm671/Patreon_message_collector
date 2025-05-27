// 全局变量存储已收藏的消息
let savedMessages = [];

// 初始化函数
function init() {
  // 从存储中加载已保存的消息
  chrome.storage.local.get(['savedPatreonMessages'], result => {
    if (result.savedPatreonMessages) {
      savedMessages = result.savedPatreonMessages;
    }
    // 初始处理页面上的消息和回复
    processChatMessages();
    processChatReplies();
    
    // 设置MutationObserver监听页面变化
    setupObserver();
  });
  
  // 添加存储变化监听器，当存储中的数据变化时更新页面
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.savedPatreonMessages) {
      // 更新本地缓存
      savedMessages = changes.savedPatreonMessages.newValue || [];
      
      // 更新页面上所有收藏按钮的状态
      updateAllButtonsStatus();
    }
  });
}

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM已经加载完成，立即执行
  init();
}

// 设置MutationObserver监听页面变化
function setupObserver() {
  const observer = new MutationObserver(mutations => {
    let shouldProcess = false;
    
    mutations.forEach(mutation => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 如果添加的是元素节点，检查是否是聊天消息、回复或包含它们
            if (node.getAttribute('data-tag') === 'chat-message' || 
                node.getAttribute('data-tag') === 'chat-reply' ||
                node.querySelector('[data-tag="chat-message"]') ||
                node.querySelector('[data-tag="chat-reply"]')) {
              shouldProcess = true;
              break;
            }
          }
        }
      }
    });
    
    if (shouldProcess) {
      processChatMessages();
      processChatReplies();
    }
  });
  
  // 开始监听页面变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 处理页面上的聊天消息
function processChatMessages() {
  // 查找所有聊天消息
  const chatMessages = document.querySelectorAll('[data-tag="chat-message"]');
  
  chatMessages.forEach(message => {
    // 如果消息已经处理过，跳过
    if (message.dataset.collectionProcessed === 'true') {
      return;
    }
    
    // 检查是否为已删除消息
    const deletedMsg = message.querySelector('p');
    if (deletedMsg && deletedMsg.textContent === 'Message deleted') {
      // 标记为已处理但不添加按钮
      message.dataset.collectionProcessed = 'true';
      return;
    }
    
    // 标记消息已处理
    message.dataset.collectionProcessed = 'true';
    
    // 创建收藏按钮
    const collectButton = document.createElement('button');
    collectButton.className = 'patron-collect-button';
    collectButton.innerHTML = '⭐ Save';
    collectButton.title = 'Save this message';
    
    // 检查消息是否已收藏
    const messageId = getMessageId(message);
    if (isMessageSaved(messageId)) {
      collectButton.classList.add('collected');
      collectButton.innerHTML = '★ Saved';
    }
    
    // 添加点击事件
    collectButton.addEventListener('click', () => {
      toggleSaveMessage(message, collectButton);
    });
    
    // 尝试多种方法寻找合适的位置插入收藏按钮
    let inserted = false;
    
    // 1. 尝试在消息文本内容后面添加
    if (!inserted) {
      const textContent = message.querySelector('[data-tag="chat-message-text-content"]');
      if (textContent) {
        // 创建一个容器来放置按钮，使其与文本分开
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'patron-button-container';
        buttonContainer.appendChild(collectButton);
        
        // 在文本内容后插入按钮容器
        if (textContent.nextSibling) {
          textContent.parentNode.insertBefore(buttonContainer, textContent.nextSibling);
        } else {
          textContent.parentNode.appendChild(buttonContainer);
        }
        inserted = true;
      }
    }
    
    // 2. 如果以上方法都失败，直接添加到消息元素末尾
    if (!inserted) {
      message.appendChild(collectButton);
    }
  });
}

// 新增：处理页面上的聊天回复消息
function processChatReplies() {
  // 查找所有聊天回复
  const chatReplies = document.querySelectorAll('[data-tag="chat-reply"]');
  
  chatReplies.forEach(reply => {
    // 如果回复已经处理过，跳过
    if (reply.dataset.collectionProcessed === 'true') {
      return;
    }
    
    // 检查是否为已删除消息
    const deletedMsg = reply.querySelector('p');
    if (deletedMsg && deletedMsg.textContent === 'Message deleted') {
      // 标记为已处理但不添加按钮
      reply.dataset.collectionProcessed = 'true';
      return;
    }
    
    // 标记回复已处理
    reply.dataset.collectionProcessed = 'true';
    
    // 创建收藏按钮
    const collectButton = document.createElement('button');
    collectButton.className = 'patron-collect-button';
    collectButton.innerHTML = '⭐ Save';
    collectButton.title = 'Save this reply';
    
    // 检查回复是否已收藏
    const replyId = getMessageId(reply);
    if (isMessageSaved(replyId)) {
      collectButton.classList.add('collected');
      collectButton.innerHTML = '★ Saved';
    }
    
    // 添加点击事件
    collectButton.addEventListener('click', () => {
      toggleSaveMessage(reply, collectButton);
    });
    
    // 尝试多种方法寻找合适的位置插入收藏按钮
    let inserted = false;
    
    // 1. 首先尝试在回复操作区域添加
    const replyActions = reply.querySelector('.message-actions, .reply-actions');
    if (replyActions) {
      replyActions.appendChild(collectButton);
      inserted = true;
    }
    
    // 2. 尝试在回复文本内容后面添加
    if (!inserted) {
      const textContent = reply.querySelector('[data-tag="chat-message-text-content"]') || 
                          reply.querySelector('[data-tag="reply-text-content"]') ||
                          reply.querySelector('.reply-content');
                          
      if (textContent) {
        // 创建一个容器来放置按钮，使其与文本分开
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'patron-button-container';
        buttonContainer.appendChild(collectButton);
        
        // 在文本内容后插入按钮容器
        if (textContent.nextSibling) {
          textContent.parentNode.insertBefore(buttonContainer, textContent.nextSibling);
        } else {
          textContent.parentNode.appendChild(buttonContainer);
        }
        inserted = true;
      }
    }
    
    // 3. 如果以上方法都失败，直接添加到回复元素末尾
    if (!inserted) {
      reply.appendChild(collectButton);
    }
  });
}

// 获取作者名称的函数，尝试多种选择器
function getAuthorName(messageElement) {
  // 1. 首先尝试用户提供的选择器
  const authorByClass = messageElement.querySelector('p.sc-furwcr.dOesVX.sc-c5d7585-9.XXxhx > strong');
  if (authorByClass && authorByClass.textContent.trim()) {
    return authorByClass.textContent.trim();
  }
  
  // 2. 尝试在父元素中查找
  const parentAuthor = messageElement.closest('div')?.querySelector('p.sc-furwcr.dOesVX.sc-c5d7585-9.XXxhx > strong');
  if (parentAuthor && parentAuthor.textContent.trim()) {
    return parentAuthor.textContent.trim();
  }
  
  // 3. 检查是否为回复消息，尝试查找回复特有的作者元素
  if (messageElement.getAttribute('data-tag') === 'chat-reply') {
    // 尝试查找回复消息中的用户名/作者名
    const replyAuthor = messageElement.querySelector('.reply-author, .reply-username, .username');
    if (replyAuthor && replyAuthor.textContent.trim()) {
      return replyAuthor.textContent.trim();
    }
    
    // 查找回复消息附近的作者元素
    const nearbyAuthor = messageElement.closest('.reply-container, .thread-reply')?.querySelector('strong, .username, .author');
    if (nearbyAuthor && nearbyAuthor.textContent.trim()) {
      return nearbyAuthor.textContent.trim();
    }
  }
  
  // 4. 尝试查找任何类似的结构 (p标签内的strong)
  const anyStrongInP = messageElement.closest('div')?.querySelector('p > strong');
  if (anyStrongInP && anyStrongInP.textContent.trim()) {
    return anyStrongInP.textContent.trim();
  }
  
  // 5. 尝试查找任何可能是作者的class名
  const authorByAnyClass = messageElement.querySelector('.author-name, .author, .username, .user-name');
  if (authorByAnyClass && authorByAnyClass.textContent.trim()) {
    return authorByAnyClass.textContent.trim();
  }
  
  // 6. 检查更多可能的元素
  const parentElement = messageElement.parentElement || messageElement;
  const possibleAuthors = parentElement.querySelectorAll('strong, b, .bold, [class*="author"], [class*="user"]');
  for (const el of possibleAuthors) {
    const text = el.textContent.trim();
    if (text && text.length < 30) { // 用户名通常不会太长
      return text;
    }
  }
  
  // 7. 最后尝试查找任何包含"author"或"user"的属性
  const elements = messageElement.closest('div')?.querySelectorAll('*');
  if (elements) {
    for (let el of elements) {
      for (let attr of el.attributes) {
        if ((attr.name.toLowerCase().includes('author') || attr.name.toLowerCase().includes('user')) && 
            el.textContent.trim()) {
          return el.textContent.trim();
        }
      }
    }
  }
  
  return '';
}

// 获取消息的唯一ID (修改以支持回复)
function getMessageId(messageElement) {
  // 尝试获取消息的唯一标识符
  
  // 获取时间戳 - 优先使用datetime属性
  let timestamp;
  const timeElement = messageElement.querySelector('time');
  if (timeElement && timeElement.hasAttribute('datetime')) {
    timestamp = timeElement.getAttribute('datetime');
  } else {
    timestamp = "";
  }
  
  // 尝试不同的内容选择器，以支持回复
  const content = messageElement.querySelector('[data-tag="chat-message-text-content"]')?.textContent || 
                  messageElement.querySelector('[data-tag="reply-text-content"]')?.textContent ||
                  messageElement.querySelector('.reply-content')?.textContent || '';
  
  // 使用获取作者的函数
  const author = getAuthorName(messageElement);
  
  // 添加一个类型标识，区分普通消息和回复
  const type = messageElement.getAttribute('data-tag') === 'chat-reply' ? 'reply' : 'message';
  
  return `${type}-${author}-${timestamp}-${content.substring(0, 50)}`;
}

// 检查消息是否已保存
function isMessageSaved(messageId) {
  return savedMessages.some(msg => msg.id === messageId);
}

// 切换消息的收藏状态 (修改以支持回复)
function toggleSaveMessage(messageElement, button) {
  const messageId = getMessageId(messageElement);
  
  // 确定元素类型
  const isReply = messageElement.getAttribute('data-tag') === 'chat-reply';
  
  // 找到消息内容 (针对不同类型选择不同选择器)
  const contentElement = messageElement.querySelector('[data-tag="chat-message-text-content"]') || 
                         messageElement.querySelector('[data-tag="reply-text-content"]') ||
                         messageElement.querySelector('.reply-content');
                         
  if (!contentElement) return;
  
  // 获取文本内容
  const content = contentElement.textContent;
  
  // 获取图片内容
  let images = [];
  const pictureElement = contentElement.parentElement.querySelector('picture');
  if (pictureElement) {
    const imgElements = pictureElement.querySelectorAll('img');
    imgElements.forEach(img => {
      if (img.src) {
        images.push(img.src);
      }
    });
  }
  
  // 使用获取作者的函数
  const author = getAuthorName(messageElement);
  
  // 获取时间 - 改进版，使用time标签的datetime属性
  let time;
  const timeElement = messageElement.querySelector('time');
  if (timeElement && timeElement.hasAttribute('datetime')) {
    // 获取datetime属性值（UTC时间）
    const utcTimeStr = timeElement.getAttribute('datetime');
    try {
      // 创建Date对象（会自动根据用户当前时区进行调整）
      const dateObj = new Date(utcTimeStr);
      // 格式化为本地时间字符串
      time = dateObj.toLocaleString();
    } catch (e) {
      // 如果解析失败，时间置为空
      time = '';
    }
  } else {
    // 如果找不到time元素或datetime属性，时间置为空
    time = '';
  }
  
  // 保存原始UTC时间字符串（如果存在）
  const utcTime = timeElement && timeElement.hasAttribute('datetime') ? 
                 timeElement.getAttribute('datetime') : '';
  
  // 检查消息是否已保存
  const messageIndex = savedMessages.findIndex(msg => msg.id === messageId);
  
  if (messageIndex === -1) {
    // 保存消息
    const messageData = {
      id: messageId,
      author,
      content,
      images,         // 添加图片数组
      time,            // 本地化的时间字符串（显示用）
      utcTime,         // 原始UTC时间（存储用）
      savedAt: new Date().toISOString(),
      type: isReply ? 'reply' : 'message'
    };
    
    // 将新消息添加到数组末尾，这样新消息会显示在最下面
    savedMessages.push(messageData);
    button.innerHTML = '★ Saved';
    button.classList.add('collected');
    
    // 显示提示
    showNotification(`${isReply ? 'Reply' : 'Message'} saved!`);
  } else {
    // 取消收藏
    savedMessages.splice(messageIndex, 1);
    button.innerHTML = '⭐ Save';
    button.classList.remove('collected');
    
    // 显示提示
    showNotification('Unsaved');
  }
  
  // 保存到存储
  chrome.storage.local.set({ savedPatreonMessages: savedMessages });
}

// 显示通知提示
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'patron-collection-notification';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // 2秒后移除通知
  setTimeout(() => {
    notification.classList.add('fadeout');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

// 更新所有收藏按钮的状态
function updateAllButtonsStatus() {
  // 更新主消息按钮
  document.querySelectorAll('[data-tag="chat-message"]').forEach(message => {
    updateButtonStatus(message);
  });
  
  // 更新回复消息按钮
  document.querySelectorAll('[data-tag="chat-reply"]').forEach(reply => {
    updateButtonStatus(reply);
  });
}

// 更新单个元素的按钮状态
function updateButtonStatus(element) {
  if (!element || !element.dataset.collectionProcessed) return;
  
  const messageId = getMessageId(element);
  const button = element.querySelector('.patron-collect-button');
  
  if (button) {
    if (isMessageSaved(messageId)) {
      button.classList.add('collected');
      button.innerHTML = '★ Saved';
    } else {
      button.classList.remove('collected');
      button.innerHTML = '⭐ Save';
    }
  }
} 