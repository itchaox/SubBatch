document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM加载完成，初始化脚本...');

  const getUrlBtn = document.querySelector('.get-url-btn');
  const getCollectBtn = document.querySelector('.get-collect-btn');

  const tableUrlInput = document.getElementById('tableUrlInput');
  const clearBtn = document.querySelector('.clear-btn');
  const bilibiliCookieInput = document.getElementById('bilibiliCookie');
  const cookieClearBtn = document.querySelector('.cookie-clear-btn');
  const errorToast = document.getElementById('errorToast');
  const successToast = document.getElementById('successToast');
  const generateUrlBtn = document.getElementById('generateUrlBtn');
  const previewBtn = document.getElementById('previewBtn');
  const copyBtn = document.getElementById('copyBtn');
  const sponsorBtn = document.getElementById('sponsorBtn');
  const followBtn = document.getElementById('followBtn');

  // 表格相关元素
  const videoTableBody = document.getElementById('videoTableBody');
  const exportTableBtn = document.getElementById('exportTableBtn');
  const clearTableBtn = document.getElementById('clearTableBtn');
  const batchGetSubtitleBtn = document.getElementById('batchGetSubtitleBtn');

  // 进度条相关元素
  const progressContainer = document.getElementById('progressContainer');
  const progressCircleValue = document.getElementById('progressCircleValue');
  const progressText = document.getElementById('progressText');
  const progressSubText = document.getElementById('progressSubText');

  // 显示和更新进度条函数
  function showProgress(show = true) {
    if (show) {
      progressContainer.classList.add('show');
    } else {
      progressContainer.classList.remove('show');
    }
  }

  function updateProgress(percent, text = '获取字幕中...') {
    // 确保百分比为整数和限制范围在0-100
    percent = Math.max(0, Math.min(100, Math.floor(percent)));

    // 更新进度文字
    progressText.textContent = `${percent}%`;
    progressSubText.textContent = text;

    // 获取进度圆环SVG元素
    const circle = document.getElementById('progressCircleValue');

    // 计算圆周长
    const radius = circle.getAttribute('r');
    const circumference = 2 * Math.PI * radius;

    // 根据百分比计算stroke-dashoffset
    const offset = circumference - (percent / 100) * circumference;

    // 设置stroke-dashoffset
    circle.style.strokeDashoffset = offset;

    // 根据进度情况设置颜色
    if (percent === 100) {
      // 完成时显示绿色
      circle.style.stroke = '#52C41A';
      progressText.style.color = '#52C41A';
      // 如果有成功文本显示，添加绿色背景
      if (text.includes('完成') || text.includes('成功')) {
        progressSubText.style.color = '#52C41A';
      }
    } else if (text.includes('失败') || text.includes('错误')) {
      // 失败时显示黄色警告
      circle.style.stroke = '#FAAD14';
      progressText.style.color = '#FAAD14';
      progressSubText.style.color = '#FAAD14';
    } else {
      // 处理中显示紫色（保持原有颜色）
      circle.style.stroke = '#52C41A';
      progressText.style.color = '#333';
      progressSubText.style.color = '#666';
    }
  }

  // 检查批量获取字幕按钮是否存在
  if (batchGetSubtitleBtn) {
    console.log('批量获取字幕按钮已找到，绑定事件');
  } else {
    console.error('找不到批量获取字幕按钮元素');
  }

  // 获取表头和表体容器，用于同步滚动
  const tableHeaderContainer = document.getElementById('tableHeaderContainer');
  const tableBodyContainer = document.getElementById('tableBodyContainer');

  // 设置表格同步滚动
  if (tableBodyContainer && tableHeaderContainer) {
    tableBodyContainer.addEventListener('scroll', function () {
      // 当表体水平滚动时，同步表头的水平滚动位置
      tableHeaderContainer.scrollLeft = tableBodyContainer.scrollLeft;
    });
  } else {
    console.error('找不到表格容器元素，无法设置同步滚动');
  }

  let generatedUrl = '';
  let currentVideoInfo = null;
  let currentSubtitleData = null;
  // 视频列表数组，用于存储添加到表格的视频
  let videoList = [];

  // 显示错误提示
  function showError(message) {
    const messageElement = errorToast.querySelector('.error-toast-message');
    const closeButton = errorToast.querySelector('.error-toast-close');
    const iconElement = errorToast.querySelector('.error-toast-icon');

    // 修改图标为黄色感叹号
    iconElement.innerHTML = `
      <svg viewBox="0 0 24 24" fill="#FAAD14">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z" />
      </svg>
    `;

    messageElement.textContent = message;
    errorToast.classList.add('show');

    // 修改为黄色背景样式
    errorToast.style.backgroundColor = '#FFF9E6';
    errorToast.style.borderLeft = '4px solid #FAAD14';
    errorToast.querySelector('.error-toast-icon').style.color = '#FAAD14';

    // 点击关闭按钮关闭提示
    const closeToast = () => {
      errorToast.classList.remove('show');
      closeButton.removeEventListener('click', closeToast);
    };

    closeButton.addEventListener('click', closeToast);

    // 3秒后自动关闭
    setTimeout(closeToast, 3000);
  }

  // 显示成功提示
  function showSuccess(message) {
    const messageElement = successToast.querySelector('.success-toast-message');
    const closeButton = successToast.querySelector('.success-toast-close');
    const iconElement = successToast.querySelector('.success-toast-icon');

    // 修改图标为绿色勾勾
    iconElement.innerHTML = `
      <svg viewBox="0 0 24 24" fill="#52C41A">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    `;

    messageElement.textContent = message;
    successToast.classList.add('show');

    // 修改为绿色背景样式
    successToast.style.backgroundColor = '#F6FFED';
    successToast.style.borderLeft = '4px solid #52C41A';
    successToast.querySelector('.success-toast-icon').style.color = '#52C41A';

    // 点击关闭按钮关闭提示
    const closeToast = () => {
      successToast.classList.remove('show');
      closeButton.removeEventListener('click', closeToast);
    };

    closeButton.addEventListener('click', closeToast);

    // 3秒后自动关闭
    setTimeout(closeToast, 3000);
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
    currentVideoInfo = null;
    currentSubtitleData = null;
  }

  // 显示视频信息
  function displayVideoInfo(videoInfo) {
    if (!videoInfo || !videoInfo.success) {
      resetVideoInfo();
      return;
    }
  }

  // 获取B站视频信息
  async function fetchBilibiliVideoInfo(url) {
    try {
      console.log('正在获取视频信息...');

      const videoId = extractBilibiliVideoId(url);
      if (!videoId) {
        showError('无法识别的B站视频地址');
        return null;
      }

      // 通过chrome.runtime.sendMessage调用background脚本获取视频信息，避免CORS限制
      const response = await chrome.runtime.sendMessage({
        action: 'fetchBilibiliInfo',
        videoId: videoId,
      });

      if (response && response.success) {
        // 确保保存了完整的视频信息，特别是cid和bvid
        currentVideoInfo = response;
        console.log('获取到视频信息:', currentVideoInfo);

        // 检查是否有cid
        if (!currentVideoInfo.cid) {
          console.warn('视频信息中缺少cid参数，可能无法获取字幕');
        } else {
          console.log('成功获取cid:', currentVideoInfo.cid);
        }

        displayVideoInfo(response);
        showSuccess('成功获取视频信息');
        return {
          ...response,
          mid: response?.full_data?.owner?.mid || 0,
        };
      } else {
        showError('获取视频信息失败');
        return null;
      }
    } catch (error) {
      console.error('获取B站视频信息错误:', error);
      showError('获取视频信息出错，请稍后再试');
      return null;
    }
  }

  // 获取B站视频字幕
  async function fetchBilibiliSubtitle(isBatchMode = false) {
    try {
      // 只有在非批量模式下才操作UI
      if (!isBatchMode) {
        // 隐藏无字幕选项
        // noSubtitleOptions.style.display = 'none';
      }

      // 检查currentVideoInfo是否包含必要的信息
      if (!currentVideoInfo) {
        if (!isBatchMode) showError('请先获取视频信息');
        console.error('fetchBilibiliSubtitle: currentVideoInfo 为空');
        return { success: false, message: '请先获取视频信息' };
      }

      // 打印调试信息
      console.log('当前视频信息:', currentVideoInfo);

      if (!currentVideoInfo.cid) {
        if (!isBatchMode) {
          // subtitleContainer.style.display = 'block';
          // subtitleStatusElement.textContent = '(无法获取)';
          // subtitleContentElement.textContent = '无法获取字幕：视频信息中缺少cid参数';
          showError('视频信息中没有cid，无法获取字幕');
          // 显示无字幕选项
          // noSubtitleOptions.style.display = 'block';
        }
        console.error('fetchBilibiliSubtitle: 视频信息中没有cid');
        return { success: false, message: '视频信息中没有cid，无法获取字幕' };
      }

      if (!currentVideoInfo.bvid) {
        if (!isBatchMode) {
          // subtitleContainer.style.display = 'block';
          // subtitleStatusElement.textContent = '(无法获取)';
          // subtitleContentElement.textContent = '无法获取字幕：视频信息中缺少bvid参数';
          showError('视频信息中没有bvid，无法获取字幕');
          // 显示无字幕选项
          // noSubtitleOptions.style.display = 'block';
        }
        console.error('fetchBilibiliSubtitle: 视频信息中没有bvid');
        return { success: false, message: '视频信息中没有bvid，无法获取字幕' };
      }

      if (!isBatchMode) {
        // subtitleStatusElement.textContent = '获取中...';
        // subtitleContentElement.textContent = '正在获取字幕数据...';
        // subtitleContainer.style.display = 'block';
        console.log('正在获取字幕数据...');
      }

      // 增加详细日志
      console.log(
        `正在请求字幕数据，cid: ${currentVideoInfo.cid}, bvid: ${currentVideoInfo.bvid}, aid: ${
          currentVideoInfo.aid || '未知'
        }`,
      );

      const response = await chrome.runtime.sendMessage({
        action: 'fetchBilibiliSubtitle',
        cid: currentVideoInfo.cid,
        bvid: currentVideoInfo.bvid,
        aid: currentVideoInfo.aid, // 添加aid参数，帮助后台更好地获取字幕
      });

      console.log('获取字幕响应:', response);

      if (response && response.success) {
        if (!isBatchMode) {
          currentSubtitleData = response;
        }

        if (response.subtitleText && response.subtitleText.trim() !== '') {
          if (!isBatchMode) {
            // subtitleContentElement.textContent = response.subtitleText;
            // subtitleStatusElement.textContent = response.metadata?.lan_doc ? `(${response.metadata.lan_doc})` : '';
            showSuccess('成功获取字幕');

            // 添加测试WBI接口按钮
            addTestApiButton();
          }

          return response;
        } else {
          if (!isBatchMode) {
            // subtitleContentElement.textContent = '获取到的字幕内容为空';
            // subtitleStatusElement.textContent = '(内容为空)';
            showError('获取到的字幕内容为空');
            // 显示无字幕选项
            // noSubtitleOptions.style.display = 'block';
          }
          console.warn('fetchBilibiliSubtitle: 获取到的字幕内容为空');
          return { ...response, success: false, message: '获取到的字幕内容为空' };
        }
      } else {
        // 字幕获取失败，显示错误信息
        const errorMessage = response?.message || '未知错误';
        console.error('字幕获取失败原因:', errorMessage);

        if (!isBatchMode) {
          // subtitleContentElement.textContent = '获取字幕失败: ' + errorMessage;
          // subtitleStatusElement.textContent = '(获取失败)';
          showError('获取字幕失败: ' + errorMessage);

          // 如果是因为视频没有字幕，则显示无字幕选项
          if (
            response &&
            response.message &&
            (response.message.includes('没有字幕') ||
              response.message.includes('字幕数据为空') ||
              response.message.includes('没有可用字幕') ||
              response.message.includes('解析字幕内容失败'))
          ) {
            // noSubtitleOptions.style.display = 'block';
          }
        }

        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('获取字幕错误:', error);

      if (!isBatchMode) {
        // 即使出错也显示错误信息
        // subtitleContainer.style.display = 'block';
        // subtitleContentElement.textContent = `获取字幕出错: ${error.message || '未知错误'}`;
        // subtitleStatusElement.textContent = '(获取出错)';
        showError('获取字幕出错，请稍后再试');

        // 显示无字幕选项
        // noSubtitleOptions.style.display = 'block';
      }

      return { success: false, message: error.message || '未知错误' };
    }
  }

  // 修复SRT格式时间戳函数
  function formatTimeForSRT(seconds) {
    const pad = (num) => (num < 10 ? '0' + num : num);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    // 注意这里使用逗号而不是点号
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
  }

  // 导出字幕为TXT文件
  async function exportSubtitleToTxt() {
    console.log('导出字幕数据:', currentSubtitleData);

    // 首先检查是否有字幕文本内容
    if (!currentSubtitleData || !currentSubtitleData.subtitleText) {
      showError('没有可导出的字幕文本数据');
      return;
    }

    try {
      let subtitleText = currentSubtitleData.subtitleText;

      // 如果有字幕URL，尝试获取最新内容
      if (currentSubtitleData.metadata && currentSubtitleData.metadata.subtitle_url) {
        try {
          const subtitleUrl = currentSubtitleData.metadata.subtitle_url;

          // 显示请求进度反馈
          showSuccess('正在请求最新字幕内容...');
          console.log('请求字幕内容URL:', subtitleUrl);

          // 获取字幕内容
          const subtitleHeaders = {
            Referer: 'https://www.bilibili.com/video/' + (currentVideoInfo?.bvid || ''),
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            Origin: 'https://www.bilibili.com',
          };

          const response = await fetch(subtitleUrl, {
            headers: subtitleHeaders,
            credentials: 'include', // 确保发送Cookie
          });

          if (response.ok) {
            const subtitleData = await response.json();
            console.log('成功获取最新字幕内容:', subtitleData);

            // 处理字幕内容格式
            if (subtitleData && subtitleData.body && subtitleData.body.length > 0) {
              subtitleText = subtitleData.body
                .map((item) => {
                  const startTime = formatTimeForSRT(item.from);
                  const endTime = formatTimeForSRT(item.to);
                  return `${startTime} --> ${endTime}\n${item.content}\n`;
                })
                .join('\n');
              console.log('成功格式化最新字幕内容');
            }
          }
        } catch (fetchError) {
          console.error('获取最新字幕内容失败，将使用缓存的字幕数据:', fetchError);
          // 出错时继续使用缓存的字幕数据
        }
      }

      // 创建Blob对象
      const blob = new Blob([subtitleText], { type: 'text/plain;charset=utf-8' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);

      // 创建一个临时的<a>元素用于下载
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${currentVideoInfo?.title || 'subtitle'}.txt`;

      // 将链接添加到文档中并点击
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // 清理
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      showSuccess('字幕导出成功');
    } catch (error) {
      console.error('导出字幕错误:', error);
      showError('导出字幕失败: ' + (error.message || '未知错误'));
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
    resetVideoInfo();
    // 清空后自动聚焦输入框
    tableUrlInput.focus();
  });

  // 为视频地址输入框的清除按钮添加事件监听
  document.querySelector('#tableUrlInput + .clear-btn').addEventListener('click', () => {
    tableUrlInput.value = '';
    resetVideoInfo();
    // 清空后自动聚焦输入框
    tableUrlInput.focus();
  });

  // 为收藏夹地址输入框的清除按钮添加事件监听
  document.querySelector('#favoriteUrlInput + .clear-btn').addEventListener('click', () => {
    favoriteUrlInput.value = '';
    // 清空后自动聚焦输入框
    favoriteUrlInput.focus();
    console.log('已清空收藏夹地址输入框');
  });

  getUrlBtn.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTabUrl' });
      if (response?.url) {
        tableUrlInput.value = response.url;
        resetVideoInfo();
        showSuccess('已获取当前页面地址');
      }
    } catch (error) {
      console.error('获取URL失败:', error);
      showError('获取地址失败，请重试');
    }
  });

  getCollectBtn.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTabUrl' });
      if (response?.url) {
        favoriteUrlInput.value = response.url;
        resetVideoInfo();
        showSuccess('已获取当前页面地址');
      }
    } catch (error) {
      console.error('获取URL失败:', error);
      showError('获取地址失败，请重试');
    }
  });

  // Cookie 处理函数
  function setCookie() {
    const cookie = bilibiliCookieInput.value.trim();
    console.log('设置Cookie (部分显示):', cookie ? cookie.substring(0, 20) + '...' : '空');

    // 即使Cookie为空也发送设置请求，这样可以清除Cookie
    chrome.runtime.sendMessage(
      {
        action: 'setCookie',
        cookie: cookie,
      },
      (response) => {
        if (response && response.success) {
          console.log('Cookie设置成功');
        } else {
          showError('Cookie设置失败');
          console.error('Cookie设置失败:', response?.message || '未知错误');
        }
      },
    );
  }

  // 清除Cookie按钮事件
  cookieClearBtn.addEventListener('click', () => {
    bilibiliCookieInput.value = '';
    setCookie(); // 清除后发送空Cookie
    bilibiliCookieInput.focus();
  });

  // 为Cookie输入框添加input事件监听器，当用户输入内容时自动保存
  bilibiliCookieInput.addEventListener('input', setCookie);

  // 为Cookie输入框添加blur事件，当用户输入完成离开输入框时设置Cookie
  bilibiliCookieInput.addEventListener('blur', setCookie);

  // 为Cookie输入框添加键盘事件，当用户按下回车键时设置Cookie
  bilibiliCookieInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setCookie();
    }
  });

  // 添加获取Cookie按钮的事件监听
  const getCookieBtn = document.getElementById('getCookieBtn');
  if (getCookieBtn) {
    getCookieBtn.addEventListener('click', async () => {
      try {
        // 显示处理中状态
        getCookieBtn.disabled = true;
        getCookieBtn.innerHTML = `
          <svg viewBox="0 0 24 24" style="animation: spin 1.5s linear infinite;">
            <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
          </svg>
          获取中...
        `;

        // 先检查当前是否在B站页面
        const tabResponse = await chrome.runtime.sendMessage({ action: 'getTabUrl' });
        const currentUrl = tabResponse?.url || '';

        if (!currentUrl.includes('bilibili.com')) {
          // 如果不在B站页面，提示用户并尝试打开B站页面
          showError('请先前往B站页面，正在为您跳转...');

          // 尝试在新标签页打开B站
          chrome.tabs.create({ url: 'https://www.bilibili.com/' }, (tab) => {
            showSuccess('请在B站页面登录后再次点击获取Cookie按钮');
          });

          // 恢复按钮状态
          getCookieBtn.disabled = false;
          getCookieBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
            </svg>
            获取Cookie
          `;
          return;
        }

        // 在B站页面，尝试获取Cookie
        console.log('正在获取Cookie，请稍候...');
        showSuccess('正在获取Cookie，请稍候...');

        const response = await chrome.runtime.sendMessage({ action: 'getCookie' });
        console.log('获取Cookie响应:', response);

        // 恢复按钮状态
        getCookieBtn.disabled = false;
        getCookieBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
          </svg>
          获取Cookie
        `;

        if (response && response.success && response.cookie) {
          bilibiliCookieInput.value = response.cookie;
          setCookie();

          // 显示自定义消息或默认成功消息
          if (response.message) {
            showSuccess(response.message);
          } else {
            showSuccess('已成功获取B站Cookie');
          }
        } else {
          // 处理错误情况，确保即使response没有message属性也不会报错
          const errorMsg = response && response.message ? response.message : '获取Cookie失败，请确保已登录B站';
          showError(errorMsg);
        }
      } catch (error) {
        console.error('获取Cookie出错:', error);
        showError('获取Cookie失败: ' + (error?.message || '未知错误'));

        // 确保按钮状态恢复
        getCookieBtn.disabled = false;
        getCookieBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
          </svg>
          获取Cookie
        `;
      }
    });
  }

  // 修改获取视频信息按钮的事件监听
  generateUrlBtn.addEventListener('click', async () => {
    // Cookie已通过input事件自动设置，无需在此处再调用setCookie

    // 继续原有逻辑
    generatedUrl = generateUrl();
    if (generatedUrl) {
      // 重置当前视频信息和字幕数据
      currentVideoInfo = null;
      currentSubtitleData = null;

      // 如果是B站视频链接，获取视频信息
      if (isBilibiliUrl(generatedUrl)) {
        const videoInfo = await fetchBilibiliVideoInfo(generatedUrl);
        if (videoInfo && videoInfo.success) {
          // 添加到表格
          addVideoToTable(videoInfo);
        }
      } else {
        showError('不是B站视频链接，无法添加');
      }
    }
  });

  // 添加函数来测试WBI接口
  async function testWbiApi() {
    try {
      if (!currentVideoInfo || !currentVideoInfo.aid || !currentVideoInfo.cid) {
        showError('请先获取视频信息');
        return;
      }

      showSuccess('正在测试WBI接口，请查看控制台日志');
      console.log('开始测试WBI接口:', currentVideoInfo.aid, currentVideoInfo.cid);

      // Cookie已通过input事件自动设置，无需在此处再调用setCookie

      // 发送测试请求
      const response = await chrome.runtime.sendMessage({
        action: 'testWbiApi',
        aid: currentVideoInfo.aid,
        cid: currentVideoInfo.cid,
      });

      console.log('WBI接口测试结果:', response);

      if (response && response.success) {
        showSuccess('WBI接口测试成功，请查看控制台日志');
      } else {
        showError('WBI接口测试失败: ' + (response?.message || '未知错误'));
      }
    } catch (error) {
      console.error('测试WBI接口时出错:', error);
      showError('测试WBI接口时出错: ' + (error.message || '未知错误'));
    }
  }

  // 添加一个函数来创建和添加测试按钮
  function addTestApiButton() {
    // 由于DOM元素已移除，此函数不再需要执行实际操作
    console.log('addTestApiButton函数被调用');
  }

  // 赞助和关注按钮的事件监听器
  sponsorBtn.addEventListener('click', () => {
    showSuccess('非常感谢您的赞助支持！💗');
    chrome.tabs.create({ url: 'https://afdian.com/a/wangchao02' });
  });

  followBtn.addEventListener('click', () => {
    showSuccess('非常感谢您的关注！🎉');
    chrome.tabs.create({ url: 'https://space.bilibili.com/521041866' });
  });

  // 获取收藏夹地址输入框和解析按钮
  const favoriteUrlInput = document.getElementById('favoriteUrlInput');
  const parseFavoriteUrlBtn = document.getElementById('getFavoriteBtn');

  // 为解析收藏夹地址按钮添加事件监听
  if (parseFavoriteUrlBtn && favoriteUrlInput) {
    parseFavoriteUrlBtn.addEventListener('click', async () => {
      const favoriteUrl = favoriteUrlInput.value.trim();
      if (!favoriteUrl) {
        showError('请输入B站收藏夹地址');
        favoriteUrlInput.focus();
        return;
      }

      // 从URL中提取fid参数
      const fidRegex = /[?&]fid=(\d+)/;
      const fidMatch = favoriteUrl.match(fidRegex);

      if (!fidMatch || !fidMatch[1]) {
        showError('无法从URL中提取收藏夹ID (fid参数)');
        return;
      }

      const fid = fidMatch[1];
      console.log('从URL中提取的收藏夹ID:', fid);

      // 禁用按钮并显示加载状态
      parseFavoriteUrlBtn.disabled = true;
      parseFavoriteUrlBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="spin">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
        获取中
      `;

      // 显示正在处理的提示
      showSuccess('正在获取收藏夹内容，请稍候...');

      try {
        // 分页获取收藏夹内容
        let allVideos = [];
        let hasMore = true;
        let currentPage = 1;
        const pageSize = 20; // B站API每页最大20条

        while (hasMore) {
          showSuccess(`正在获取第${currentPage}页收藏夹内容...`);
          console.log(`获取收藏夹第${currentPage}页，每页${pageSize}条`);

          // 使用Promise包装chrome.runtime.sendMessage调用
          const response = await new Promise((resolve, reject) => {
            // 设置超时处理
            const timeoutId = setTimeout(() => {
              reject(new Error('请求超时，background.js没有及时响应'));
            }, 15000); // 15秒超时

            chrome.runtime.sendMessage(
              {
                action: 'fetchFavoriteList',
                mediaId: fid,
                page: currentPage,
                pageSize: pageSize,
              },
              (response) => {
                clearTimeout(timeoutId); // 清除超时计时器

                // 检查是否有错误
                const error = chrome.runtime.lastError;
                if (error) {
                  console.error('发送消息时出错:', error);
                  reject(error);
                  return;
                }

                resolve(response);
              },
            );
          });

          // 处理响应
          if (response && response.success && response.data) {
            console.log(`第${currentPage}页收藏夹数据:`, response.data);

            // 添加当前页的视频到总列表
            if (response.data.medias && response.data.medias.length > 0) {
              allVideos = allVideos.concat(response.data.medias);
              console.log(`当前已获取${allVideos.length}个视频`);

              // 每页获取完后显示进度
              showSuccess(`已获取${allVideos.length}个视频 (第${currentPage}页)`);
            }

            // 检查是否有更多页
            hasMore = response.data.has_more === true;
            console.log(`是否有下一页: ${hasMore}`);

            if (hasMore) {
              currentPage++;
              // 添加短暂延迟避免请求过快
              await new Promise((resolve) => setTimeout(resolve, 300));
            } else {
              console.log('已到达最后一页，停止获取');
            }
          } else {
            const errorMsg = response?.message || '获取收藏夹内容失败';
            showError(errorMsg);
            console.error('获取收藏夹失败:', response);
            break; // 出错时停止循环
          }
        }

        // 所有页获取完成后的处理
        if (allVideos.length > 0) {
          showSuccess(`成功获取收藏夹内容，共${allVideos.length}个视频`);
          console.log('完整收藏夹内容:', allVideos);

          // 获取表格相关元素
          const videoTableBody = document.getElementById('videoTableBody');
          const addedCount = processAndAddVideosToTable(allVideos);

          if (addedCount > 0) {
            showSuccess(`成功添加${addedCount}个视频到表格`);
          } else {
            showError('没有找到可添加的视频');
          }
        } else {
          showError('收藏夹中没有视频');
        }
      } catch (error) {
        console.error('获取收藏夹出错:', error);
        showError('获取收藏夹内容失败: ' + (error.message || '未知错误'));
      } finally {
        // 恢复按钮状态
        parseFavoriteUrlBtn.disabled = false;
        parseFavoriteUrlBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          获取收藏夹的视频
        `;
      }
    });
  }

  // 处理收藏夹视频并添加到表格
  function processAndAddVideosToTable(videos) {
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      console.error('无效的视频数据');
      return 0;
    }

    let addedCount = 0;

    // 遍历收藏夹中的视频
    videos.forEach((video) => {
      // 只处理类型为2的条目（视频）
      if (video.type === 2) {
        // 检查是否已存在相同的视频（根据bvid或aid）
        const existingVideo = videoList.find(
          (v) => (video.bvid && v.bvid === video.bvid) || (video.id && v.aid === video.id),
        );

        if (!existingVideo) {
          // 转换视频数据为表格需要的格式
          const formattedVideo = {
            id: video.id || video.bvid || Date.now().toString(),
            bvid: video.bvid,
            aid: video.id,
            cid: video.ugc?.first_cid,
            title: video.title,
            author: video.upper?.name || '未知作者',
            subtitleStatus: '未获取',
            subtitleText: null,
            view_count: video.stat?.view || 0,
            like_count: video.stat?.like || 0,
            mid: video.upper?.mid || 0,
          };

          // 添加到表格
          addVideoToTable(formattedVideo);
          addedCount++;
        } else {
          console.log(`视频已存在，跳过: ${video.title}`);
        }
      } else {
        console.log(`跳过非视频内容: ${video.title}, 类型: ${video.type}`);
      }
    });

    return addedCount;
  }

  // 添加视频到表格
  function addVideoToTable(videoInfo) {
    console.log('🚀 videoInfo:', videoInfo);
    if (!videoInfo || !videoInfo.title) {
      showError('视频信息不完整，无法添加到表格');
      return;
    }

    // 检查是否已经存在相同bvid的视频
    const existingVideo = videoList.find((v) => v.bvid === videoInfo.bvid);
    if (existingVideo) {
      showError('该视频已在表格中');
      return;
    }

    // 创建一个包含所需信息的视频对象
    const video = {
      id: videoInfo.bvid || videoInfo.aid || Date.now().toString(),
      bvid: videoInfo.bvid,
      aid: videoInfo.aid,
      cid: videoInfo.cid,
      title: videoInfo.title,
      author: videoInfo.author,
      subtitleStatus: '未获取',
      subtitleText: null,
      view_count: videoInfo.view_count,
      like_count: videoInfo.like_count,
      mid: videoInfo.mid,
    };

    // 添加到视频列表
    videoList.push(video);

    // 更新表格UI
    updateVideoTable();

    showSuccess('已添加到表格');
  }

  // 更新视频表格
  function updateVideoTable() {
    // 清空表格内容
    videoTableBody.innerHTML = '';

    // 如果没有视频，显示空状态
    if (videoList.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px;">暂无视频，请添加视频</td>`;
      videoTableBody.appendChild(emptyRow);

      // 更新计数器显示
      document.getElementById('totalVideoCount').textContent = '0';
      document.getElementById('completedSubtitleCount').textContent = '0';
      return;
    }

    // 有视频时显示计数信息
    document.getElementById('videoCountInfo').style.display = 'inline';
    // 计算已获取字幕的视频数量
    const completedCount = videoList.filter((video) => video.subtitleStatus === '获取成功').length;

    // 更新计数器显示
    document.getElementById('totalVideoCount').textContent = videoList.length.toString();
    document.getElementById('completedSubtitleCount').textContent = completedCount.toString();

    // 遍历视频列表，为每个视频创建表格行
    videoList.forEach((video, index) => {
      const row = document.createElement('tr');

      // 根据字幕状态设置样式
      let subtitleStatusHtml = '';
      if (video.subtitleStatus === '获取成功') {
        // 已获取状态显示为绿色并添加✅图标
        subtitleStatusHtml = `<span style="color: #52c41a; font-weight: 500;">✅ 获取成功</span>`;
      } else if (video.subtitleStatus === '获取中') {
        // 获取中状态显示为蓝色带动画
        subtitleStatusHtml = `<span style="color: #1890ff; display: flex; align-items: center;">
          <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; margin-right: 4px; animation: spin 1.5s linear infinite;">
            <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" fill="currentColor"/>
          </svg>获取中</span>`;
      } else if (video.subtitleStatus === '未获取') {
        // 未获取状态显示为灰色
        subtitleStatusHtml = `<span style="color: #666;">${video.subtitleStatus}</span>`;
      } else if (
        video.subtitleStatus &&
        (video.subtitleStatus.includes('无字幕文件') || video.subtitleStatus.includes('错误'))
      ) {
        // 失败状态显示为红色
        subtitleStatusHtml = `<span style="color: #ff4d4f;">${video.subtitleStatus}</span>`;
      } else {
        // 其他状态保持默认
        subtitleStatusHtml = video.subtitleStatus;
      }

      row.innerHTML = `
        <td>${index + 1}</td>
        <td><a href="https://www.bilibili.com/video/${video.bvid}" target="_blank" title="${video.title}">${
        video.title
      }</a></td>
        <td><a href="https://space.bilibili.com/${video.mid}" target="_blank" title="${video.author}">${
        video.author
      }</a></td>
        <td>${subtitleStatusHtml}</td>
        <td>
          <button class="table-action-btn remove-row-btn" data-index="${index}">
            ❌
          </button>
        </td>
      `;
      videoTableBody.appendChild(row);
    });

    // 为表格中的按钮添加事件监听
    addTableButtonListeners();
  }

  // 为表格中的按钮添加事件监听
  function addTableButtonListeners() {
    // 为移除按钮添加事件监听
    document.querySelectorAll('.remove-row-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-index'));
        if (isNaN(index) || index < 0 || index >= videoList.length) {
          showError('无效的视频索引');
          return;
        }

        // 移除视频
        videoList.splice(index, 1);

        // 更新表格
        updateVideoTable();
        showSuccess('已从表格中移除');
      });
    });
  }

  // 批量获取字幕函数
  async function batchGetSubtitles() {
    console.log('开始执行批量获取字幕函数');
    if (videoList.length === 0) {
      showError('表格为空，无法获取字幕');
      return;
    }

    // 获取并禁用批量获取字幕按钮
    const batchGetSubtitleBtn = document.getElementById('batchGetSubtitleBtn');
    if (batchGetSubtitleBtn) {
      console.log('设置批量获取字幕按钮为禁用状态');
      batchGetSubtitleBtn.disabled = true;
      batchGetSubtitleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="spin">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
        处理中...
      `;
      // 添加旋转动画样式
      const style = document.createElement('style');
      style.innerHTML = `
        .spin {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    } else {
      console.error('找不到批量获取字幕按钮元素');
    }

    // 显示进度条并初始化为0%
    showProgress(true);
    updateProgress(0, '准备获取字幕...');

    let successCount = 0;
    let failCount = 0;
    const totalVideos = videoList.length;
    const needProcessVideos = videoList.filter((v) => v.subtitleStatus !== '获取成功').length;

    showSuccess('开始批量获取字幕，请稍候...');

    // 依次处理每个视频
    for (let i = 0; i < videoList.length; i++) {
      const video = videoList[i];
      console.log(`处理第 ${i + 1}/${videoList.length} 个视频: ${video.title}`);

      // 计算当前进度百分比
      const currentPercent = Math.floor((i / totalVideos) * 100);
      updateProgress(currentPercent, `处理第 ${i + 1}/${totalVideos} 个视频...`);

      // 如果已经成功获取过字幕，跳过
      if (video.subtitleStatus === '获取成功' && video.subtitleText) {
        console.log(`视频 ${video.title} 已有字幕，跳过`);
        continue;
      }

      // 更新当前状态
      videoList[i].subtitleStatus = '获取中';
      updateVideoTable();

      try {
        // 检查视频信息是否完整
        if (!video.bvid || !video.cid) {
          console.error(`视频 ${video.title} 信息不完整，无法获取字幕`, video);
          videoList[i].subtitleStatus = '信息不完整';
          failCount++;
          updateVideoTable();
          continue;
        }

        // 设置当前视频信息，以便获取字幕
        console.log(`设置当前视频信息:`, video);
        currentVideoInfo = {
          bvid: video.bvid,
          aid: video.aid,
          cid: video.cid,
          title: video.title,
        };

        // 获取字幕，使用批量模式参数
        console.log(`正在获取第 ${i + 1}/${videoList.length} 个视频的字幕: ${video.title}`);
        updateProgress(currentPercent, `获取字幕中...`);

        // 调用chrome.runtime.sendMessage直接获取字幕，而不是通过fetchBilibiliSubtitle函数
        const response = await chrome.runtime.sendMessage({
          action: 'fetchBilibiliSubtitle',
          cid: video.cid,
          bvid: video.bvid,
          aid: video.aid, // 添加aid参数，帮助后台更好地获取字幕
        });

        console.log(`获取字幕结果:`, response);

        if (response && response.success) {
          // 更新字幕状态和内容
          videoList[i].subtitleStatus = '获取成功';
          videoList[i].subtitleText = response.subtitleText;
          successCount++;
          console.log(`视频 ${video.title} 字幕获取成功`);
        } else {
          // 获取失败
          const errorMessage = response?.message || '未知原因';
          // videoList[i].subtitleStatus = `获取失败: ${errorMessage}`;
          videoList[i].subtitleStatus = `无字幕文件`;
          failCount++;
          console.log(`视频 ${video.title} 字幕获取失败: ${errorMessage}`);
        }

        // 每次获取完后更新表格，用户可以看到实时进度
        updateVideoTable();

        // 添加延时，避免过快请求导致被限制
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`获取视频 ${video.title} 的字幕时出错:`, error);
        videoList[i].subtitleStatus = `获取出错: ${error.message || '未知错误'}`;
        failCount++;
        updateVideoTable();
      }
    }

    // 完成所有处理后，显示100%
    updateProgress(100, '处理完成!');

    // 短暂延迟后隐藏进度条
    setTimeout(() => {
      showProgress(false);
    }, 1500);

    // 恢复按钮状态
    if (batchGetSubtitleBtn) {
      console.log('恢复批量获取字幕按钮状态');
      batchGetSubtitleBtn.disabled = false;
      batchGetSubtitleBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
        </svg>
        获取字幕
      `;
    }

    // 显示结果
    if (successCount > 0 && failCount === 0) {
      showSuccess(`所有字幕获取成功 (${successCount}/${videoList.length})`);
    } else if (successCount > 0 && failCount > 0) {
      showSuccess(`部分字幕获取成功 (成功: ${successCount}, 失败: ${failCount})`);
    } else if (successCount === 0 && failCount > 0) {
      showError(`所有字幕获取失败 (${failCount}/${videoList.length})`);
    } else {
      showSuccess('没有需要获取字幕的视频');
    }
  }

  // 为批量获取字幕按钮添加事件监听
  if (batchGetSubtitleBtn) {
    console.log('添加批量获取字幕按钮事件监听');
    batchGetSubtitleBtn.addEventListener('click', function () {
      console.log('批量获取字幕按钮被点击');
      batchGetSubtitles();
    });
  }

  // 批量导出字幕为独立的TXT文件
  async function batchExportSubtitles() {
    try {
      console.log('开始批量导出字幕');

      // 检查是否有JSZip对象
      if (typeof JSZip === 'undefined') {
        console.error('JSZip库未加载，无法执行批量导出');
        showError('JSZip库未加载，无法执行批量导出。请确保jszip.min.js文件已正确加载');
        return;
      }

      if (videoList.length === 0) {
        showError('表格为空，无法导出');
        return;
      }

      // 筛选出已获取字幕的视频
      const videosWithSubtitle = videoList.filter(
        (video) => video.subtitleStatus === '获取成功' && video.subtitleText && video.subtitleText.trim() !== '',
      );

      if (videosWithSubtitle.length === 0) {
        showError('没有可导出的字幕，请先获取字幕');
        return;
      }

      // 创建格式选择弹窗
      showFormatSelectionDialog((selectedFormat) => {
        if (!selectedFormat) {
          return; // 用户取消了选择
        }

        console.log(`选择了导出格式: ${selectedFormat}`);

        // 继续执行导出流程，并传入所选格式
        executeExport(videosWithSubtitle, selectedFormat);
      });
    } catch (error) {
      console.error('批量导出字幕外层错误:', error);
      showError('批量导出字幕失败: ' + (error.message || '未知错误'));
      showProgress(false);
    }
  }

  // 显示格式选择弹窗
  function showFormatSelectionDialog(callback) {
    // 创建弹窗背景
    const dialogOverlay = document.createElement('div');
    dialogOverlay.style.position = 'fixed';
    dialogOverlay.style.top = '0';
    dialogOverlay.style.left = '0';
    dialogOverlay.style.width = '100%';
    dialogOverlay.style.height = '100%';
    dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    dialogOverlay.style.display = 'flex';
    dialogOverlay.style.justifyContent = 'center';
    dialogOverlay.style.alignItems = 'center';
    dialogOverlay.style.zIndex = '2000';
    dialogOverlay.style.backdropFilter = 'blur(3px)';

    // 创建弹窗内容
    const dialogContent = document.createElement('div');
    dialogContent.style.backgroundColor = 'white';
    dialogContent.style.borderRadius = '12px';
    dialogContent.style.padding = '20px';
    dialogContent.style.width = '360px';
    dialogContent.style.maxWidth = '90%';
    dialogContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
    dialogContent.style.textAlign = 'center';

    // 标题
    const title = document.createElement('h3');
    title.textContent = '选择字幕导出格式';
    title.style.margin = '0 0 16px 0';
    title.style.color = '#333';
    title.style.fontSize = '18px';

    // 格式对比表
    const formatTable = document.createElement('div');
    formatTable.style.margin = '0 0 20px 0';
    formatTable.style.border = '1px solid #eee';
    formatTable.style.borderRadius = '8px';
    formatTable.style.overflow = 'hidden';
    formatTable.style.fontSize = '13px';
    formatTable.style.textAlign = 'left';

    formatTable.innerHTML = `
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <tr style="background-color:#f8f9fa">
          <th style="padding:8px 12px; border-bottom:1px solid #eee;">格式</th>
          <th style="padding:8px 12px; border-bottom:1px solid #eee;">特点</th>
        </tr>
        <tr>
          <td style="padding:8px 12px; border-bottom:1px solid #eee;"><b>SRT</b></td>
          <td style="padding:8px 12px; border-bottom:1px solid #eee;">包含时间戳，支持播放器同步显示</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;"><b>TXT</b></td>
          <td style="padding:8px 12px;">纯文本内容，适合阅读和 AI 知识库</td>
        </tr>
      </table>
    `;

    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '16px';
    buttonContainer.style.marginTop = '8px';

    // SRT按钮
    const srtButton = document.createElement('button');
    srtButton.textContent = '导出 SRT 格式';
    srtButton.style.padding = '10px 16px';
    srtButton.style.backgroundColor = '#3370ff';
    srtButton.style.color = 'white';
    srtButton.style.border = 'none';
    srtButton.style.borderRadius = '6px';
    srtButton.style.cursor = 'pointer';
    srtButton.style.fontWeight = '500';
    srtButton.style.flex = '1';
    srtButton.style.maxWidth = '140px';
    srtButton.style.transition = 'all 0.3s ease';

    // TXT按钮
    const txtButton = document.createElement('button');
    txtButton.textContent = '导出 TXT 格式';
    txtButton.style.padding = '10px 16px';
    txtButton.style.backgroundColor = '#f0f2f5';
    txtButton.style.color = '#333';
    txtButton.style.border = 'none';
    txtButton.style.borderRadius = '6px';
    txtButton.style.cursor = 'pointer';
    txtButton.style.fontWeight = '500';
    txtButton.style.flex = '1';
    txtButton.style.maxWidth = '140px';
    txtButton.style.transition = 'all 0.3s ease';

    // 按钮悬停效果
    srtButton.onmouseover = function () {
      this.style.backgroundColor = '#2860e1';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 12px rgba(51, 112, 255, 0.3)';
    };
    srtButton.onmouseout = function () {
      this.style.backgroundColor = '#3370ff';
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    };

    txtButton.onmouseover = function () {
      this.style.backgroundColor = '#e4e6e8';
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    };
    txtButton.onmouseout = function () {
      this.style.backgroundColor = '#f0f2f5';
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    };

    // 取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.marginTop = '16px';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = 'transparent';
    cancelButton.style.color = '#666';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontSize = '13px';

    cancelButton.onmouseover = function () {
      this.style.backgroundColor = '#f0f2f5';
    };
    cancelButton.onmouseout = function () {
      this.style.backgroundColor = 'transparent';
    };

    // 添加事件监听
    srtButton.addEventListener('click', () => {
      document.body.removeChild(dialogOverlay);
      callback('srt');
    });

    txtButton.addEventListener('click', () => {
      document.body.removeChild(dialogOverlay);
      callback('txt');
    });

    cancelButton.addEventListener('click', () => {
      document.body.removeChild(dialogOverlay);
      callback(null);
    });

    // 组装弹窗
    buttonContainer.appendChild(srtButton);
    buttonContainer.appendChild(txtButton);
    dialogContent.appendChild(title);
    dialogContent.appendChild(formatTable);
    dialogContent.appendChild(buttonContainer);
    dialogContent.appendChild(cancelButton);
    dialogOverlay.appendChild(dialogContent);

    // 显示弹窗
    document.body.appendChild(dialogOverlay);
  }

  // 执行导出流程
  async function executeExport(videosWithSubtitle, format) {
    try {
      // 获取并禁用导出按钮，显示处理状态
      const exportTableBtn = document.getElementById('exportTableBtn');
      if (exportTableBtn) {
        exportTableBtn.disabled = true;
        exportTableBtn.innerHTML = `
          <svg viewBox="0 0 24 24" class="spin">
            <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
          </svg>
          导出中...
        `;
      }

      // 显示进度条
      showProgress(true);
      updateProgress(0, '准备导出字幕...');

      showSuccess(`开始批量导出${format.toUpperCase()}字幕，共 ${videosWithSubtitle.length} 个文件`);

      // 创建一个临时的zip文件夹
      const zipContent = new JSZip();
      let exportedCount = 0;
      let errorCount = 0;

      // 依次导出每个视频的字幕
      for (const [index, video] of videosWithSubtitle.entries()) {
        try {
          // 创建文件名，移除不合法的文件名字符
          const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '_');
          const fileName = `${safeTitle}.${format}`;

          // 根据选择的格式处理字幕内容
          let subtitleContent;
          if (format === 'srt') {
            subtitleContent = convertToSrtFormat(video.subtitleText);
          } else {
            subtitleContent = convertToTxtFormat(video.subtitleText);
          }

          // 将字幕内容添加到zip文件
          zipContent.file(fileName, subtitleContent);
          exportedCount++;

          // 更新进度条
          const percent = Math.floor(((index + 1) / videosWithSubtitle.length) * 100);
          updateProgress(percent, `已处理 ${exportedCount}/${videosWithSubtitle.length} 个字幕`);

          // 每添加一个更新一次状态
          showSuccess(`已处理 ${exportedCount}/${videosWithSubtitle.length} 个字幕`);
        } catch (videoError) {
          console.error(`导出视频 "${video.title}" 的字幕失败:`, videoError);
          errorCount++;
        }
      }

      // 更新进度为100%
      updateProgress(100, '压缩文件中...');

      // 生成zip文件
      const zipBlob = await zipContent.generateAsync({ type: 'blob' });

      // 创建下载链接
      const url = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;

      // 格式化当前日期时间为 'SubBatch_年-月-日-时-分-秒_格式' 格式
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const formattedDateTime = `SubBatch_${year}-${month}-${day}-${hours}-${minutes}-${seconds}_${format.toUpperCase()}`;

      downloadLink.download = `${formattedDateTime}.zip`;

      // 触发下载
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // 清理
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      // 短暂延迟后隐藏进度条
      setTimeout(() => {
        showProgress(false);
      }, 1500);

      // 恢复按钮状态
      if (exportTableBtn) {
        exportTableBtn.disabled = false;
        exportTableBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          导出字幕
        `;
      }

      // 显示结果
      if (errorCount === 0) {
        showSuccess(`成功导出 ${exportedCount} 个${format.toUpperCase()}字幕文件到zip压缩包`);
      } else {
        showSuccess(`导出完成，成功: ${exportedCount}，失败: ${errorCount}`);
      }
    } catch (error) {
      console.error('批量导出字幕错误:', error);
      showError('批量导出字幕失败: ' + (error.message || '未知错误'));

      // 隐藏进度条
      showProgress(false);

      // 恢复按钮状态
      const exportTableBtn = document.getElementById('exportTableBtn');
      if (exportTableBtn) {
        exportTableBtn.disabled = false;
        exportTableBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          导出字幕
        `;
      }
    }
  }

  // 将字幕内容转换为SRT格式
  function convertToSrtFormat(subtitleText) {
    if (!subtitleText) return '';

    // 将字幕文本按行分割
    const lines = subtitleText.split('\n');
    let srtContent = '';
    let entryNumber = 1; // 序号从1开始

    // 遍历每一行，重新构建标准SRT格式
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 如果当前行是时间轴（含 --> 格式的行）
      if (line.includes(' --> ')) {
        // 提取并转换时间戳格式
        const timeParts = line.split(' --> ');
        if (timeParts.length === 2) {
          // 替换点号为逗号
          const startTime = timeParts[0].replace('.', ',');
          const endTime = timeParts[1].replace('.', ',');

          // 添加序号和修复后的时间轴
          srtContent += entryNumber + '\n' + startTime + ' --> ' + endTime + '\n';
        } else {
          // 如果时间轴格式不正确，保持原样
          srtContent += entryNumber + '\n' + line + '\n';
        }

        // 查找后续的内容行，一直到遇到空行或下一个时间轴
        let contentLines = [];
        for (let j = i + 1; j < lines.length; j++) {
          const contentLine = lines[j].trim();
          if (contentLine === '' || contentLine.includes(' --> ') || /^\d+$/.test(contentLine)) {
            break; // 遇到空行、时间轴或序号行，结束内容收集
          }
          contentLines.push(contentLine);
          i = j; // 更新外层循环索引
        }

        // 添加内容行
        if (contentLines.length > 0) {
          srtContent += contentLines.join('\n') + '\n\n'; // 内容后添加空行
          entryNumber++; // 更新序号
        }
      }
    }

    return srtContent.trim();
  }

  // 将字幕内容转换为纯文本格式（去除时间戳和序号）
  function convertToTxtFormat(subtitleText) {
    if (!subtitleText) return '';

    // 将字幕文本按行分割
    const lines = subtitleText.split('\n');
    let txtContent = '';
    let contentLine = '';

    // 遍历每一行，提取内容文本
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 跳过空行
      if (line === '') continue;

      // 跳过序号行（纯数字）
      if (/^\d+$/.test(line)) continue;

      // 跳过时间轴行（含 --> 格式的行）
      if (line.includes(' --> ')) continue;

      // 其余行都是内容，添加到结果中
      contentLine = line;
      if (contentLine) {
        txtContent += contentLine + '\n';
      }
    }

    return txtContent;
  }

  // 清空表格
  function clearTable() {
    videoList = [];
    updateVideoTable();
    showSuccess('表格已清空');
  }

  // 为导出表格按钮添加事件监听
  if (exportTableBtn) {
    exportTableBtn.addEventListener('click', batchExportSubtitles);
  }

  // 为清空表格按钮添加事件监听
  if (clearTableBtn) {
    clearTableBtn.addEventListener('click', clearTable);
  }

  // 初始化表格
  updateVideoTable();

  // 为使用文档和反馈问题按钮添加事件监听器
  const docBtn = document.getElementById('docBtn');
  const feedbackBtn = document.getElementById('feedbackBtn');

  // 使用文档按钮点击事件
  if (docBtn) {
    docBtn.addEventListener('click', () => {
      showSuccess('正在打开使用文档...');
      chrome.tabs.create({
        url: 'https://bcmcjimpjd.feishu.cn/wiki/OSOKwYcf4iBZvPkajz7cpF8nnzg?fromScene=spaceOverview',
      });
    });
  }

  // 反馈问题按钮点击事件
  if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
      showSuccess('正在前往反馈页面...');
      chrome.tabs.create({ url: 'https://bcmcjimpjd.feishu.cn/share/base/form/shrcn5zSNoOWSWVjI7y639o3Lyc' });
    });
  }
});
