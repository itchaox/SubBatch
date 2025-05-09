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
  const videoTitleElement = document.getElementById('videoTitle');
  const videoInfoContainer = document.getElementById('videoInfoContainer');
  const videoAuthorElement = document.getElementById('videoAuthor');
  const videoViewCountElement = document.getElementById('videoViewCount');
  const videoLikeCountElement = document.getElementById('videoLikeCount');

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

  // 从URL中提取视频ID
  function extractBilibiliVideoId(url) {
    // 匹配常规格式 https://www.bilibili.com/video/BV1xx411c7mD/
    const bvRegex = /bilibili\.com\/video\/(BV\w+)/i;
    const bvMatch = url.match(bvRegex);
    if (bvMatch) return bvMatch[1];

    // 匹配短链接 https://b23.tv/OurLgw6
    const shortRegex = /b23\.tv\/(\w+)/i;
    const shortMatch = url.match(shortRegex);
    if (shortMatch) return shortMatch[1];

    // 匹配旧版av号 https://www.bilibili.com/video/av788057797/
    const avRegex = /bilibili\.com\/video\/av(\d+)/i;
    const avMatch = url.match(avRegex);
    if (avMatch) return `av${avMatch[1]}`;

    return null;
  }

  // 判断是否为B站URL
  function isBilibiliUrl(url) {
    return url.includes('bilibili.com/video') || url.includes('b23.tv') || /bilibili\.com\/video\/av\d+/i.test(url);
  }

  // 格式化数字（添加千位分隔符）
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // 重置视频信息显示
  function resetVideoInfo() {
    videoTitleElement.textContent = '尚未获取视频信息';
    videoInfoContainer.style.display = 'none';
    videoAuthorElement.textContent = '未知';
    videoViewCountElement.textContent = '0';
    videoLikeCountElement.textContent = '0';
  }

  // 显示视频信息
  function displayVideoInfo(videoInfo) {
    if (!videoInfo || !videoInfo.success) {
      resetVideoInfo();
      return;
    }

    videoTitleElement.textContent = videoInfo.title;
    videoAuthorElement.textContent = videoInfo.author;
    videoViewCountElement.textContent = formatNumber(videoInfo.view_count);
    videoLikeCountElement.textContent = formatNumber(videoInfo.like_count);
    videoInfoContainer.style.display = 'block';
  }

  // 获取B站视频信息
  async function fetchBilibiliVideoInfo(url) {
    try {
      videoTitleElement.textContent = '正在获取视频信息...';
      videoInfoContainer.style.display = 'none';

      const videoId = extractBilibiliVideoId(url);
      if (!videoId) {
        videoTitleElement.textContent = '无法识别的B站视频地址';
        showError('无法识别的B站视频地址');
        return null;
      }

      // 通过chrome.runtime.sendMessage调用background脚本获取视频信息，避免CORS限制
      const response = await chrome.runtime.sendMessage({
        action: 'fetchBilibiliInfo',
        videoId: videoId,
      });

      if (response && response.success) {
        displayVideoInfo(response);
        showSuccess('成功获取视频信息');
        return response;
      } else {
        videoTitleElement.textContent = '获取视频信息失败: ' + (response?.message || '未知错误');
        showError('获取视频信息失败');
        return null;
      }
    } catch (error) {
      console.error('获取B站视频信息错误:', error);
      videoTitleElement.textContent = `获取视频信息出错: ${error.message || '未知错误'}`;
      showError('获取视频信息出错，请稍后再试');
      return null;
    }
  }

  // 生成URL
  function generateUrl() {
    const baseUrl = tableUrlInput.value.trim();
    if (!baseUrl) {
      showError('请先填写视频地址！');
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
    resetVideoInfo();
    // 清空后自动聚焦输入框
    tableUrlInput.focus();
  });

  getUrlBtn.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTabUrl' });
      if (response?.url) {
        tableUrlInput.value = response.url;
        previewCopyGroup.classList.remove('show');
        resetVideoInfo();
        showSuccess('已获取当前页面地址');
      }
    } catch (error) {
      console.error('获取URL失败:', error);
      showError('获取地址失败，请重试');
    }
  });

  generateUrlBtn.addEventListener('click', async () => {
    generatedUrl = generateUrl();
    if (generatedUrl) {
      previewCopyGroup.classList.add('show');

      // 如果是B站视频链接，获取视频信息
      if (isBilibiliUrl(generatedUrl)) {
        await fetchBilibiliVideoInfo(generatedUrl);
      } else {
        videoTitleElement.textContent = '不是B站视频链接，无法获取标题';
        videoInfoContainer.style.display = 'none';
        showSuccess('已生成新地址');
      }
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
