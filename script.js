document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM加载完成，初始化脚本...');

  const getUrlBtn = document.querySelector('.get-url-btn');
  const tableUrlInput = document.getElementById('tableUrlInput');
  const clearBtn = document.querySelector('.clear-btn');
  const bilibiliCookieInput = document.getElementById('bilibiliCookie');
  const cookieClearBtn = document.querySelector('.cookie-clear-btn');
  const applyCookieBtn = document.getElementById('applyCookieBtn');
  const errorToast = document.getElementById('errorToast');
  const successToast = document.getElementById('successToast');
  const generateUrlBtn = document.getElementById('generateUrlBtn');
  const previewBtn = document.getElementById('previewBtn');
  const copyBtn = document.getElementById('copyBtn');
  const sponsorBtn = document.getElementById('sponsorBtn');
  const followBtn = document.getElementById('followBtn');
  const videoTitleElement = document.getElementById('videoTitle');
  const videoInfoContainer = document.getElementById('videoInfoContainer');
  const videoAuthorElement = document.getElementById('videoAuthor');
  const videoViewCountElement = document.getElementById('videoViewCount');
  const videoLikeCountElement = document.getElementById('videoLikeCount');
  const getSubtitleBtn = document.getElementById('getSubtitleBtn');
  const subtitleContainer = document.getElementById('subtitleContainer');
  const subtitleStatusElement = document.getElementById('subtitleStatus');
  const subtitleContentElement = document.getElementById('subtitleContent');
  const exportSubtitleBtn = document.getElementById('exportSubtitleBtn');
  const noSubtitleOptions = document.getElementById('noSubtitleOptions');
  const downloadVideoBtn = document.getElementById('downloadVideoBtn');
  const transcribeAudioBtn = document.getElementById('transcribeAudioBtn');

  // 表格相关元素
  const videoTableBody = document.getElementById('videoTableBody');
  const exportTableBtn = document.getElementById('exportTableBtn');
  const clearTableBtn = document.getElementById('clearTableBtn');
  const batchGetSubtitleBtn = document.getElementById('batchGetSubtitleBtn');

  // 检查批量获取字幕按钮是否存在
  if (batchGetSubtitleBtn) {
    console.log('批量获取字幕按钮已找到，绑定事件');
  } else {
    console.error('找不到批量获取字幕按钮元素');
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
    subtitleContainer.style.display = 'none';
    subtitleContentElement.textContent = '尚未获取字幕';
    noSubtitleOptions.style.display = 'none';
    currentVideoInfo = null;
    currentSubtitleData = null;
  }

  // 显示视频信息
  function displayVideoInfo(videoInfo) {
    if (!videoInfo || !videoInfo.success) {
      resetVideoInfo();
      return;
    }

    // 注意：这里我们不再设置currentVideoInfo，因为它现在在fetchBilibiliVideoInfo中设置
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
      subtitleContainer.style.display = 'none';

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
        // 确保保存了完整的视频信息，特别是cid和bvid
        currentVideoInfo = response;
        console.log('获取到视频信息:', currentVideoInfo);

        // 检查是否有cid
        if (!currentVideoInfo.cid) {
          console.warn('视频信息中缺少cid参数，可能无法获取字幕');
          videoTitleElement.textContent = currentVideoInfo.title + ' (可能无法获取字幕)';
        } else {
          console.log('成功获取cid:', currentVideoInfo.cid);
        }

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

  // 获取B站视频字幕
  async function fetchBilibiliSubtitle(isBatchMode = false) {
    try {
      // 只有在非批量模式下才操作UI
      if (!isBatchMode) {
        // 隐藏无字幕选项
        noSubtitleOptions.style.display = 'none';
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
          subtitleContainer.style.display = 'block';
          subtitleStatusElement.textContent = '(无法获取)';
          subtitleContentElement.textContent = '无法获取字幕：视频信息中缺少cid参数';
          showError('视频信息中没有cid，无法获取字幕');
          // 显示无字幕选项
          noSubtitleOptions.style.display = 'block';
        }
        console.error('fetchBilibiliSubtitle: 视频信息中没有cid');
        return { success: false, message: '视频信息中没有cid，无法获取字幕' };
      }

      if (!currentVideoInfo.bvid) {
        if (!isBatchMode) {
          subtitleContainer.style.display = 'block';
          subtitleStatusElement.textContent = '(无法获取)';
          subtitleContentElement.textContent = '无法获取字幕：视频信息中缺少bvid参数';
          showError('视频信息中没有bvid，无法获取字幕');
          // 显示无字幕选项
          noSubtitleOptions.style.display = 'block';
        }
        console.error('fetchBilibiliSubtitle: 视频信息中没有bvid');
        return { success: false, message: '视频信息中没有bvid，无法获取字幕' };
      }

      if (!isBatchMode) {
        subtitleStatusElement.textContent = '获取中...';
        subtitleContentElement.textContent = '正在获取字幕数据...';
        subtitleContainer.style.display = 'block';
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
            subtitleContentElement.textContent = response.subtitleText;
            subtitleStatusElement.textContent = response.metadata?.lan_doc ? `(${response.metadata.lan_doc})` : '';
            showSuccess('成功获取字幕');

            // 添加测试WBI接口按钮
            addTestApiButton();
          }

          return response;
        } else {
          if (!isBatchMode) {
            subtitleContentElement.textContent = '获取到的字幕内容为空';
            subtitleStatusElement.textContent = '(内容为空)';
            showError('获取到的字幕内容为空');
            // 显示无字幕选项
            noSubtitleOptions.style.display = 'block';
          }
          console.warn('fetchBilibiliSubtitle: 获取到的字幕内容为空');
          return { ...response, success: false, message: '获取到的字幕内容为空' };
        }
      } else {
        // 字幕获取失败，显示错误信息
        const errorMessage = response?.message || '未知错误';
        console.error('字幕获取失败原因:', errorMessage);

        if (!isBatchMode) {
          subtitleContentElement.textContent = '获取字幕失败: ' + errorMessage;
          subtitleStatusElement.textContent = '(获取失败)';
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
            noSubtitleOptions.style.display = 'block';
          }
        }

        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('获取字幕错误:', error);

      if (!isBatchMode) {
        // 即使出错也显示错误信息
        subtitleContainer.style.display = 'block';
        subtitleContentElement.textContent = `获取字幕出错: ${error.message || '未知错误'}`;
        subtitleStatusElement.textContent = '(获取出错)';
        showError('获取字幕出错，请稍后再试');

        // 显示无字幕选项
        noSubtitleOptions.style.display = 'block';
      }

      return { success: false, message: error.message || '未知错误' };
    }
  }

  // 添加formatTime函数，用于格式化时间
  function formatTime(seconds) {
    const pad = (num) => (num < 10 ? '0' + num : num);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${ms.toString().padStart(3, '0')}`;
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
                  const startTime = formatTime(item.from);
                  const endTime = formatTime(item.to);
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
          showSuccess('Cookie已设置');
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

  // 为Cookie输入框添加blur事件，当用户输入完成离开输入框时设置Cookie
  bilibiliCookieInput.addEventListener('blur', setCookie);

  // 为Cookie输入框添加键盘事件，当用户按下回车键时设置Cookie
  bilibiliCookieInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setCookie();
    }
  });

  // 应用Cookie按钮事件
  applyCookieBtn.addEventListener('click', () => {
    setCookie();
    showSuccess('Cookie已应用');
  });

  // 修改获取视频信息按钮的事件监听
  generateUrlBtn.addEventListener('click', async () => {
    // 先设置Cookie
    setCookie();

    // 然后继续原有逻辑
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
        videoTitleElement.textContent = '不是B站视频链接，无法获取标题';
        videoInfoContainer.style.display = 'none';
        subtitleContainer.style.display = 'none';
        showError('不是B站视频链接，无法添加');
      }
    }
  });

  // 监听获取字幕前先设置Cookie
  getSubtitleBtn.addEventListener('click', async () => {
    // 先设置Cookie
    setCookie();

    // 然后获取字幕
    await fetchBilibiliSubtitle();
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

      // 先设置Cookie
      setCookie();

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

  // 导出字幕按钮事件
  exportSubtitleBtn.addEventListener('click', () => {
    exportSubtitleToTxt();
  });

  // 添加一个函数来创建和添加测试按钮
  function addTestApiButton() {
    // 检查是否已经存在测试按钮
    if (document.getElementById('testWbiApiBtn')) {
      return; // 已存在则不重复添加
    }

    // 检查字幕容器是否存在
    const subtitleContainer = document.getElementById('subtitleContainer');
    if (!subtitleContainer) {
      console.error('字幕容器不存在，无法添加测试按钮');
      return;
    }

    const subtitleActions = subtitleContainer.querySelector('.subtitle-actions');
    if (!subtitleActions) {
      console.error('字幕操作区域不存在，无法添加测试按钮');
      return;
    }
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

  // 为音频转字幕按钮添加事件监听
  transcribeAudioBtn.addEventListener('click', () => {
    showError('音频转字幕功能暂未实现');
  });

  // 为下载视频按钮添加事件监听
  downloadVideoBtn.addEventListener('click', () => {
    if (!currentVideoInfo || !currentVideoInfo.bvid) {
      showError('无法获取视频信息，无法下载视频');
      return;
    }
    // 打开视频页面
    chrome.tabs.create({ url: `https://www.bilibili.com/video/${currentVideoInfo.bvid}` });
    showSuccess('已打开视频页面，请使用第三方工具下载');
  });

  // 添加视频到表格
  function addVideoToTable(videoInfo) {
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
      return;
    }

    // 遍历视频列表，为每个视频创建表格行
    videoList.forEach((video, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${video.title}</td>
        <td>${video.author}</td>
        <td>${video.subtitleStatus}</td>
        <td>
          <button class="table-action-btn remove-row-btn" data-index="${index}">
            移除
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

    let successCount = 0;
    let failCount = 0;

    showSuccess('开始批量获取字幕，请稍候...');

    // 依次处理每个视频
    for (let i = 0; i < videoList.length; i++) {
      const video = videoList[i];
      console.log(`处理第 ${i + 1}/${videoList.length} 个视频: ${video.title}`);

      // 如果已经成功获取过字幕，跳过
      if (video.subtitleStatus === '已获取' && video.subtitleText) {
        console.log(`视频 ${video.title} 已有字幕，跳过`);
        continue;
      }

      // 更新当前状态
      videoList[i].subtitleStatus = '获取中...';
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
          videoList[i].subtitleStatus = '已获取';
          videoList[i].subtitleText = response.subtitleText;
          successCount++;
          console.log(`视频 ${video.title} 字幕获取成功`);
        } else {
          // 获取失败
          const errorMessage = response?.message || '未知原因';
          videoList[i].subtitleStatus = `获取失败: ${errorMessage}`;
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

    // 恢复按钮状态
    if (batchGetSubtitleBtn) {
      console.log('恢复批量获取字幕按钮状态');
      batchGetSubtitleBtn.disabled = false;
      batchGetSubtitleBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
        </svg>
        批量获取字幕
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
    if (videoList.length === 0) {
      showError('表格为空，无法导出');
      return;
    }

    // 筛选出已获取字幕的视频
    const videosWithSubtitle = videoList.filter(
      (video) => video.subtitleStatus === '已获取' && video.subtitleText && video.subtitleText.trim() !== '',
    );

    if (videosWithSubtitle.length === 0) {
      showError('没有可导出的字幕，请先获取字幕');
      return;
    }

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

      showSuccess(`开始批量导出字幕，共 ${videosWithSubtitle.length} 个文件`);

      let exportedCount = 0;
      let errorCount = 0;

      // 添加一个文本区域，用于给用户提供所有字幕文件的下载链接
      const downloadLinksContainer = document.createElement('div');
      downloadLinksContainer.style.display = 'none';
      document.body.appendChild(downloadLinksContainer);

      // 依次导出每个视频的字幕
      for (const video of videosWithSubtitle) {
        try {
          // 创建文件名，移除不合法的文件名字符
          const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '_');
          const fileName = `${safeTitle}.txt`;

          // 创建blob对象
          const blob = new Blob([video.subtitleText], { type: 'text/plain;charset=utf-8' });

          // 创建下载链接
          const url = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = fileName;

          // 触发下载
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();

          // 稍后清理
          setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
          }, 100);

          exportedCount++;

          // 每导出一个更新一次状态
          showSuccess(`已导出 ${exportedCount}/${videosWithSubtitle.length} 个字幕`);

          // 添加延时，避免浏览器阻止多个下载
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (videoError) {
          console.error(`导出视频 "${video.title}" 的字幕失败:`, videoError);
          errorCount++;
        }
      }

      // 清理容器
      document.body.removeChild(downloadLinksContainer);

      // 恢复按钮状态
      if (exportTableBtn) {
        exportTableBtn.disabled = false;
        exportTableBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          批量导出字幕
        `;
      }

      // 显示结果
      if (errorCount === 0) {
        showSuccess(`成功导出 ${exportedCount} 个字幕文件`);
      } else {
        showSuccess(`导出完成，成功: ${exportedCount}，失败: ${errorCount}`);
      }
    } catch (error) {
      console.error('批量导出字幕错误:', error);
      showError('批量导出字幕失败: ' + (error.message || '未知错误'));

      // 恢复按钮状态
      const exportTableBtn = document.getElementById('exportTableBtn');
      if (exportTableBtn) {
        exportTableBtn.disabled = false;
        exportTableBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          批量导出字幕
        `;
      }
    }
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
});
