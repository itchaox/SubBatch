document.addEventListener('DOMContentLoaded', function () {
  const getUrlBtn = document.querySelector('.get-url-btn');
  const tableUrlInput = document.getElementById('tableUrl');
  const clearBtn = document.querySelector('.clear-btn');
  const errorToast = document.getElementById('errorToast');
  const successToast = document.getElementById('successToast');
  const generateUrlBtn = document.getElementById('generateUrlBtn');
  const previewBtn = document.getElementById('previewBtn');
  const copyBtn = document.getElementById('copyBtn');
  const previewCopyGroup = document.querySelector('.preview-copy-group');
  const sponsorBtn = document.getElementById('sponsorBtn');
  const followBtn = document.getElementById('followBtn');

  let generatedUrl = '';

  // 显示错误提示
  function showError(message) {
    const messageElement = errorToast.querySelector('.error-toast-message');
    const closeButton = errorToast.querySelector('.error-toast-close');

    messageElement.textContent = message;
    errorToast.classList.add('show');

    // 点击关闭按钮关闭提示
    const closeToast = () => {
      errorToast.classList.remove('show');
      closeButton.removeEventListener('click', closeToast);
    };

    closeButton.addEventListener('click', closeToast);

    // 2秒后自动关闭
    setTimeout(closeToast, 2000);
  }

  // 显示成功提示
  function showSuccess(message) {
    const messageElement = successToast.querySelector('.success-toast-message');
    const closeButton = successToast.querySelector('.success-toast-close');

    messageElement.textContent = message;
    successToast.classList.add('show');

    // 点击关闭按钮关闭提示
    const closeToast = () => {
      successToast.classList.remove('show');
      closeButton.removeEventListener('click', closeToast);
    };

    closeButton.addEventListener('click', closeToast);

    // 2秒后自动关闭
    setTimeout(closeToast, 2000);
  }

  // 生成URL
  function generateUrl() {
    const baseUrl = tableUrlInput.value.trim();
    if (!baseUrl) {
      showError('请先填写多维表格地址！');
      return '';
    }

    return baseUrl;
  }

  // 复制文本到剪贴板
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('已复制到剪贴板');
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        已复制
      `;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          复制地址
        `;
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      showError('复制失败，请重试');
    }
  }

  // 事件监听器
  clearBtn.addEventListener('click', () => {
    tableUrlInput.value = '';
    previewCopyGroup.classList.remove('show');
    // 清空后自动聚焦输入框
    tableUrlInput.focus();
  });

  getUrlBtn.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTabUrl' });
      if (response?.url) {
        tableUrlInput.value = response.url;
        previewCopyGroup.classList.remove('show');
        showSuccess('已获取当前页面地址');
      }
    } catch (error) {
      console.error('获取URL失败:', error);
      showError('获取地址失败，请重试');
    }
  });

  generateUrlBtn.addEventListener('click', () => {
    generatedUrl = generateUrl();
    if (generatedUrl) {
      previewCopyGroup.classList.add('show');
      showSuccess('已生成新表格地址');
    }
  });

  previewBtn.addEventListener('click', () => {
    if (generatedUrl) {
      chrome.tabs.create({ url: generatedUrl });
    }
  });

  copyBtn.addEventListener('click', () => {
    if (generatedUrl) {
      copyToClipboard(generatedUrl);
    }
  });

  tableUrlInput.addEventListener('input', () => {
    previewCopyGroup.classList.remove('show');
  });

  sponsorBtn.addEventListener('click', () => {
    showSuccess('非常感谢您的赞助支持！💗');
    chrome.tabs.create({ url: 'https://afdian.com/a/wangchao02' });
  });

  followBtn.addEventListener('click', () => {
    showSuccess('非常感谢您的关注！🎉');
    chrome.tabs.create({ url: 'https://space.bilibili.com/521041866' });
  });
});
