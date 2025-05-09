chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error(error);
  }
});

const RELOAD_DELAY = 1000; // 重载延迟时间（毫秒）
let lastReloadTime = 0;

function reloadExtension() {
  chrome.runtime.reload();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

// 获取B站视频信息
async function getBilibiliVideoInfo(videoId) {
  try {
    // 判断是BV号还是AV号
    const isBV = videoId.startsWith('BV');
    const apiUrl = isBV
      ? `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`
      : `https://api.bilibili.com/x/web-interface/view?aid=${videoId.replace('av', '')}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.code === 0 && data.data) {
      return {
        success: true,
        title: data.data.title,
        author: data.data.owner.name,
        cover: data.data.pic,
        description: data.data.desc,
        view_count: data.data.stat.view,
        like_count: data.data.stat.like,
      };
    } else {
      return {
        success: false,
        message: data.message || '获取视频信息失败',
      };
    }
  } catch (error) {
    console.error('获取视频信息出错:', error);
    return {
      success: false,
      message: error.message || '网络请求错误',
    };
  }
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理文件变化消息
  if (message.type === 'FILE_CHANGED') {
    const currentTime = Date.now();
    if (currentTime - lastReloadTime > RELOAD_DELAY) {
      lastReloadTime = currentTime;
      reloadExtension();
    }
  }

  // 处理获取URL消息
  if (message.action === 'getTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ url: null });
      }
    });
    return true; // 保持消息通道开启，等待异步响应
  }

  // 处理获取B站视频信息的消息
  if (message.action === 'fetchBilibiliInfo') {
    getBilibiliVideoInfo(message.videoId)
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        console.error('获取B站视频信息出错:', error);
        sendResponse({
          success: false,
          message: error.message || '网络请求错误',
        });
      });
    return true; // 保持消息通道开启，等待异步响应
  }
});
