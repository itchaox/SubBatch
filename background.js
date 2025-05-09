chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

// 在扩展启动时从localStorage读取Cookie
chrome.storage.local.get(['bilibiliCookie'], function (result) {
  if (result.bilibiliCookie) {
    bilibiliCookie = result.bilibiliCookie;
    console.log('从存储中加载Cookie (部分显示):', bilibiliCookie.substring(0, 20) + '...');
  } else {
    console.log('存储中没有找到Cookie');
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error(error);
  }
});

const RELOAD_DELAY = 1000; // 重载延迟时间（毫秒）
let lastReloadTime = 0;

// 全局变量声明 - 在文件顶部添加
let bilibiliCookie = ''; // 确保全局变量正确初始化

// 添加Cookie状态日志函数
function logCookieStatus() {
  try {
    if (bilibiliCookie && bilibiliCookie.trim() !== '') {
      console.log('当前Cookie状态: 已设置 (部分显示): ' + bilibiliCookie.substring(0, 20) + '...');

      // 检查Cookie是否包含必要的部分
      const hasSessData = bilibiliCookie.includes('SESSDATA=');
      const hasBiliJct = bilibiliCookie.includes('bili_jct=');
      const hasDedeUserID = bilibiliCookie.includes('DedeUserID=');

      console.log(
        'Cookie包含关键部分检查: ' +
          'SESSDATA=' +
          (hasSessData ? '✓' : '✗') +
          ', ' +
          'bili_jct=' +
          (hasBiliJct ? '✓' : '✗') +
          ', ' +
          'DedeUserID=' +
          (hasDedeUserID ? '✓' : '✗'),
      );
    } else {
      console.log('当前Cookie状态: 未设置或为空');
    }
  } catch (error) {
    console.error('检查Cookie状态时出错:', error);
  }
}

function reloadExtension() {
  chrome.runtime.reload();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

// 添加Cookie诊断函数
function diagnoseCookie() {
  try {
    console.log('---- Cookie诊断开始 ----');
    if (!bilibiliCookie || bilibiliCookie.trim() === '') {
      console.log('Cookie为空，请确保已设置Cookie');
      return false;
    }

    console.log(`Cookie长度: ${bilibiliCookie.length} 字符`);

    // 检查Cookie格式是否正确（看是否包含关键的Cookie项）
    const hasSessData = bilibiliCookie.includes('SESSDATA=');
    const hasBiliJct = bilibiliCookie.includes('bili_jct=');
    const hasDedeUserID = bilibiliCookie.includes('DedeUserID=');

    console.log('Cookie关键项检查:');
    console.log(`- SESSDATA: ${hasSessData ? '存在 ✓' : '不存在 ✗'}`);
    console.log(`- bili_jct: ${hasBiliJct ? '存在 ✓' : '不存在 ✗'}`);
    console.log(`- DedeUserID: ${hasDedeUserID ? '存在 ✓' : '不存在 ✗'}`);

    // 检查Cookie格式（是否每项都用分号分隔）
    const cookieItems = bilibiliCookie.split(';');
    console.log(`Cookie项数量: ${cookieItems.length}`);

    // 检查Cookie是否含有不必要的空格或换行
    const hasExtraSpaces = bilibiliCookie.includes('\n') || bilibiliCookie.includes('\r');
    if (hasExtraSpaces) {
      console.log('警告：Cookie包含换行符，可能影响请求');
    }

    // 总体评估
    const isValid = hasSessData && hasDedeUserID;
    console.log(`Cookie整体评估: ${isValid ? '基本有效 ✓' : '可能无效 ✗'}`);
    console.log('---- Cookie诊断结束 ----');

    return isValid;
  } catch (error) {
    console.error('Cookie诊断出错:', error);
    return false;
  }
}

// 修改fetchWithHeaders函数，添加Cookie诊断
async function fetchWithHeaders(url) {
  try {
    console.log('发起API请求:', url);
    logCookieStatus(); // 添加Cookie日志记录

    // 添加Cookie诊断
    if (url.includes('api.bilibili.com')) {
      console.log('检测到B站API请求，执行Cookie诊断');
      diagnoseCookie();
    }

    // 检查是否是WBI接口
    const isWbiRequest = url.includes('/x/player/wbi/v2');

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Origin: 'https://www.bilibili.com',
      Referer: 'https://www.bilibili.com/',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      Pragma: 'no-cache',
      'X-Wbi-UA': 'Win32.Chrome.109.0.0.0',
    };

    // 如果有Cookie，添加到请求头中
    if (bilibiliCookie && bilibiliCookie.trim() !== '') {
      headers['Cookie'] = bilibiliCookie;
      console.log('请求已添加Cookie (部分显示):', bilibiliCookie.substring(0, 20) + '...');
    } else {
      console.log('请求未添加Cookie，因为Cookie未设置或为空');
      // 尝试再次从storage获取Cookie
      try {
        const result = await chrome.storage.local.get(['bilibiliCookie']);
        if (result.bilibiliCookie && result.bilibiliCookie.trim() !== '') {
          bilibiliCookie = result.bilibiliCookie;
          headers['Cookie'] = bilibiliCookie;
          console.log('从storage重新获取Cookie并添加到请求头 (部分显示):', bilibiliCookie.substring(0, 20) + '...');
        }
      } catch (storageError) {
        console.error('从storage获取Cookie失败:', storageError);
      }
    }

    // 如果是WBI请求，需要特殊处理
    if (isWbiRequest) {
      console.log('检测到WBI接口请求，进行特殊处理');
      return await fetchWbiRequest(url, headers);
    }

    console.log('发送请求前的完整Headers:', JSON.stringify(headers));

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      credentials: 'include', // 修改为include以确保Cookie被发送
    });

    if (!response.ok) {
      console.error(`API请求失败: ${url}, 状态码: ${response.status}`);
      throw new Error(`请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    console.log('API请求响应:', data);
    return data;
  } catch (error) {
    console.error('API请求出错:', error);
    throw error;
  }
}

// 处理WBI请求的特殊函数
async function fetchWbiRequest(url, headers) {
  try {
    // 如果URL中已经包含w_rid和wts参数，直接使用
    if (url.includes('w_rid=') && url.includes('wts=')) {
      console.log('使用URL中已有的WBI参数');
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include', // WBI接口需要包含credentials
      });

      if (!response.ok) {
        console.error(`WBI请求失败: ${url}, 状态码: ${response.status}`);
        throw new Error(`WBI请求失败，状态码: ${response.status}`);
      }

      const data = await response.json();
      console.log('WBI API请求响应:', data);
      return data;
    } else {
      // 如果URL中没有WBI参数，尝试使用普通v2接口替代
      console.log('缺少WBI签名参数，尝试使用普通v2接口替代');
      const regularUrl = url.replace('/x/player/wbi/v2', '/x/player/v2');
      console.log('替换为普通接口URL:', regularUrl);

      const response = await fetch(regularUrl, {
        method: 'GET',
        headers: headers,
        credentials: 'include', // 改为include以确保Cookie被发送
      });

      if (!response.ok) {
        console.error(`普通API请求失败: ${regularUrl}, 状态码: ${response.status}`);
        throw new Error(`请求失败，状态码: ${response.status}`);
      }

      const data = await response.json();
      console.log('普通API请求响应:', data);

      // 如果返回-400错误并且消息中包含'Key:'，很可能是缺少必要参数
      if (data.code === -400 && data.message && data.message.includes('Key:')) {
        console.warn('API返回参数错误，可能需要额外参数:', data.message);

        // 尝试添加isGaiaAvoided=false参数后再次请求
        let retryUrl = regularUrl;
        if (!retryUrl.includes('isGaiaAvoided=')) {
          retryUrl += (retryUrl.includes('?') ? '&' : '?') + 'isGaiaAvoided=false';
          console.log('尝试添加参数后再次请求:', retryUrl);

          const retryResponse = await fetch(retryUrl, {
            method: 'GET',
            headers: headers,
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            console.error(`参数补充后请求仍然失败: ${retryUrl}, 状态码: ${retryResponse.status}`);
            return data; // 返回原始错误
          }

          const retryData = await retryResponse.json();
          console.log('参数补充后API响应:', retryData);
          return retryData;
        }
      }

      return data;
    }
  } catch (error) {
    console.error('WBI请求处理出错:', error);
    throw error;
  }
}

// 获取B站视频信息
async function getBilibiliVideoInfo(videoId) {
  try {
    // 判断是BV号还是AV号
    const isBV = videoId.startsWith('BV');
    const apiUrl = isBV
      ? `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`
      : `https://api.bilibili.com/x/web-interface/view?aid=${videoId.replace('av', '')}`;

    console.log('请求B站视频信息URL:', apiUrl);
    const data = await fetchWithHeaders(apiUrl);
    console.log('🚀 data:', data);

    if (data.code === 0 && data.data) {
      // 获取视频的第一个分P的cid
      let cid = data.data.cid;

      // 如果视频有多个分P，则优先使用第一P的cid
      if (!cid && data.data.pages && data.data.pages.length > 0) {
        cid = data.data.pages[0].cid;
        console.log('从pages中获取cid:', cid);
      }

      if (!cid) {
        console.error('无法从API响应中获取cid');
        return {
          success: false,
          message: '获取视频cid失败，无法提取字幕',
        };
      }

      return {
        success: true,
        title: data.data.title,
        author: data.data.owner.name,
        cover: data.data.pic,
        description: data.data.desc,
        view_count: data.data.stat.view,
        like_count: data.data.stat.like,
        bvid: data.data.bvid,
        aid: data.data.aid, // 添加aid，便于后续请求
        cid: cid, // 使用获取到的cid
        duration: data.data.duration,
        // 可以添加额外字段但不要替换上面的基本字段
        full_data: data.data, // 添加完整数据供需要时使用
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

// 获取B站视频字幕 - 改进版，参考axios示例
async function getBilibiliSubtitle(cid, bvid, retryCount = 2) {
  try {
    console.log(`正在获取字幕，cid: ${cid}, bvid: ${bvid}, 尝试次数: ${3 - retryCount}`);

    // 首先获取视频的基本信息，确保有aid
    let aid;
    try {
      const viewInfo = await fetchWithHeaders(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
      if (viewInfo.code === 0 && viewInfo.data) {
        aid = viewInfo.data.aid;
        console.log('成功获取aid:', aid);
      } else {
        console.error('获取视频信息失败:', viewInfo);
      }
    } catch (error) {
      console.error('获取视频基本信息出错:', error);
    }

    // 构建字幕信息请求URL - 优先使用aid+cid的组合，因为某些视频可能对bvid的支持不完善
    let subtitleInfoUrl;
    if (aid) {
      subtitleInfoUrl = `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`;
    } else {
      subtitleInfoUrl = `https://api.bilibili.com/x/player/v2?cid=${cid}&bvid=${bvid}`;
    }

    console.log('字幕信息请求URL:', subtitleInfoUrl);

    const subtitleInfoData = await fetchWithHeaders(subtitleInfoUrl);
    console.log('字幕信息响应代码:', subtitleInfoData.code);

    if (subtitleInfoData.code !== 0 || !subtitleInfoData.data) {
      console.error('获取字幕信息失败:', subtitleInfoData);
      throw new Error('获取字幕信息失败: ' + (subtitleInfoData.message || '未知错误'));
    }

    // 完整记录字幕数据，便于调试
    console.log('完整字幕信息数据:', JSON.stringify(subtitleInfoData.data));

    // 检查是否有字幕
    if (!subtitleInfoData.data.subtitle) {
      console.log('API响应中不包含subtitle字段');
      return {
        success: false,
        message: '该视频没有字幕或字幕数据为空',
      };
    }

    const subtitles = subtitleInfoData.data.subtitle.list || [];
    console.log('找到字幕列表数量:', subtitles.length);

    if (subtitles.length === 0) {
      console.log('字幕列表为空');
      return {
        success: false,
        message: '该视频没有可用字幕',
      };
    }

    // 获取第一个字幕（通常是默认字幕）
    const defaultSubtitle = subtitles[0];
    console.log('默认字幕信息:', defaultSubtitle);

    const subtitleUrl = defaultSubtitle.subtitle_url;

    if (!subtitleUrl) {
      console.log('字幕URL为空');

      // 检查是否是自动生成字幕（AI字幕）
      if (defaultSubtitle.lan && defaultSubtitle.lan.startsWith('ai-')) {
        console.log('检测到自动生成的AI字幕，但URL为空，需要再次请求获取字幕URL');

        // 对于自动生成的字幕，需要通过另一个API获取实际的字幕URL
        try {
          const aiSubtitleUrl = `https://api.bilibili.com/x/player/v2/ai/subtitle/search/stat?aid=${
            aid || ''
          }&bvid=${bvid}&cid=${cid}`;
          console.log('请求AI字幕URL:', aiSubtitleUrl);

          const aiSubtitleData = await fetchWithHeaders(aiSubtitleUrl);
          console.log('AI字幕响应:', aiSubtitleData);

          if (aiSubtitleData.code === 0 && aiSubtitleData.data && aiSubtitleData.data.subtitle_url) {
            // 找到了AI字幕的URL
            const fullAiSubtitleUrl = aiSubtitleData.data.subtitle_url.startsWith('http')
              ? aiSubtitleData.data.subtitle_url
              : `https:${aiSubtitleData.data.subtitle_url}`;

            console.log('成功获取AI字幕URL:', fullAiSubtitleUrl);

            // 继续处理字幕内容
            try {
              const subtitleHeaders = {
                Referer: 'https://www.bilibili.com/video/' + bvid,
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Accept: 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                Origin: 'https://www.bilibili.com',
                Connection: 'keep-alive',
                'Cache-Control': 'no-cache',
              };

              // 如果有Cookie，添加到请求头中
              if (bilibiliCookie) {
                subtitleHeaders['Cookie'] = bilibiliCookie;
              }

              const subtitleResponse = await fetch(fullAiSubtitleUrl, {
                headers: subtitleHeaders,
              });

              if (!subtitleResponse.ok) {
                throw new Error(`获取AI字幕内容失败: HTTP ${subtitleResponse.status}`);
              }

              const subtitleData = await subtitleResponse.json();

              if (!subtitleData || !subtitleData.body) {
                return {
                  success: false,
                  message: '解析AI字幕内容失败，可能是不支持的字幕格式',
                };
              }

              if (subtitleData.body.length === 0) {
                return {
                  success: false,
                  message: 'AI字幕内容为空',
                };
              }

              // 字幕元数据
              const metadata = {
                lan: defaultSubtitle.lan,
                lan_doc: defaultSubtitle.lan_doc || '自动生成字幕',
                subtitle_url: fullAiSubtitleUrl,
              };

              // 将字幕内容格式化为文本
              const subtitleText = subtitleData.body
                .map((item) => {
                  const startTime = formatTime(item.from);
                  const endTime = formatTime(item.to);
                  return `${startTime} --> ${endTime}\n${item.content}\n`;
                })
                .join('\n');

              return {
                success: true,
                metadata: metadata,
                subtitles: subtitleData.body,
                subtitleText: subtitleText,
              };
            } catch (aiError) {
              console.error('获取AI字幕内容出错:', aiError);
              throw aiError;
            }
          } else {
            return {
              success: false,
              message: '该视频有自动生成字幕，但无法获取字幕地址',
            };
          }
        } catch (aiUrlError) {
          console.error('获取AI字幕URL失败:', aiUrlError);
          return {
            success: false,
            message: '获取自动生成字幕失败: ' + (aiUrlError.message || '未知错误'),
          };
        }
      }

      return {
        success: false,
        message: '字幕地址无效',
      };
    }

    // 如果字幕URL是相对路径，添加基础URL
    const fullSubtitleUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;

    console.log('字幕内容URL:', fullSubtitleUrl);

    // 使用带Headers的请求获取字幕内容，以避免可能的跨域问题
    try {
      const subtitleHeaders = {
        Referer: 'https://www.bilibili.com/video/' + bvid,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Origin: 'https://www.bilibili.com',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      };

      // 如果有Cookie，添加到请求头中
      if (bilibiliCookie) {
        subtitleHeaders['Cookie'] = bilibiliCookie;
      }

      const subtitleResponse = await fetch(fullSubtitleUrl, {
        headers: subtitleHeaders,
      });

      if (!subtitleResponse.ok) {
        console.error('获取字幕内容失败:', subtitleResponse.status);
        throw new Error(`获取字幕内容失败: HTTP ${subtitleResponse.status}`);
      }

      const subtitleData = await subtitleResponse.json();
      console.log('成功获取字幕内容');

      if (!subtitleData || !subtitleData.body) {
        console.log('字幕数据中不包含body字段');
        return {
          success: false,
          message: '解析字幕内容失败，可能是不支持的字幕格式',
        };
      }

      // 如果字幕列表为空
      if (subtitleData.body.length === 0) {
        console.log('字幕body列表为空');
        return {
          success: false,
          message: '字幕内容为空',
        };
      }

      // 字幕元数据
      const metadata = {
        lan: defaultSubtitle.lan,
        lan_doc: defaultSubtitle.lan_doc,
        subtitle_url: fullSubtitleUrl,
      };

      // 将字幕内容格式化为文本
      const subtitleText = subtitleData.body
        .map((item) => {
          const startTime = formatTime(item.from);
          const endTime = formatTime(item.to);
          return `${startTime} --> ${endTime}\n${item.content}\n`;
        })
        .join('\n');

      return {
        success: true,
        metadata: metadata,
        subtitles: subtitleData.body,
        subtitleText: subtitleText,
      };
    } catch (subtitleError) {
      console.error('获取或解析字幕内容出错:', subtitleError);

      // 尝试重试
      if (retryCount > 0) {
        console.log(`获取字幕内容失败，进行第${3 - retryCount + 1}次重试...`);
        // 短暂延迟后重试
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return getBilibiliSubtitle(cid, bvid, retryCount - 1);
      }

      return {
        success: false,
        message: '获取或解析字幕内容出错: ' + (subtitleError.message || '未知错误'),
      };
    }
  } catch (error) {
    console.error('获取字幕整体流程出错:', error);

    // 如果还有重试次数，则重试
    if (retryCount > 0) {
      console.log(`整体获取字幕失败，进行第${3 - retryCount + 1}次重试...`);
      // 短暂延迟后重试
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return getBilibiliSubtitle(cid, bvid, retryCount - 1);
    }

    return {
      success: false,
      message: error.message || '网络请求错误',
    };
  }
}

// 格式化时间为 HH:MM:SS.mmm 格式
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// 保存Cookie到storage
async function saveCookieToStorage(cookie) {
  try {
    await chrome.storage.local.set({ bilibiliCookie: cookie });
    bilibiliCookie = cookie;
    console.log('Cookie已保存到storage并更新到全局变量');
    logCookieStatus();
  } catch (error) {
    console.error('保存Cookie到storage失败:', error);
  }
}

// 从storage加载Cookie
async function loadCookieFromStorage() {
  try {
    const result = await chrome.storage.local.get(['bilibiliCookie']);
    if (result.bilibiliCookie) {
      bilibiliCookie = result.bilibiliCookie;
      console.log('成功从storage加载Cookie');
      logCookieStatus();
    } else {
      console.log('storage中没有保存的Cookie');
    }
  } catch (error) {
    console.error('从storage加载Cookie失败:', error);
  }
}

// 监听插件启动
chrome.runtime.onStartup.addListener(() => {
  console.log('插件启动，加载Cookie...');
  loadCookieFromStorage();
});

// 监听插件安装或更新
chrome.runtime.onInstalled.addListener(() => {
  console.log('插件安装或更新，加载Cookie...');
  loadCookieFromStorage();
});

// 在后台脚本加载时立即加载Cookie
loadCookieFromStorage();

// 监听来自sidepanel的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理updateCookie消息
  if (message.action === 'updateCookie' || message.action === 'setCookie') {
    console.log('收到Cookie更新请求');
    bilibiliCookie = message.cookie || '';
    if (bilibiliCookie.trim() !== '') {
      console.log(`Cookie已更新 (部分显示): ${bilibiliCookie.substring(0, 20)}...`);
    } else {
      console.log('Cookie已清除');
    }

    // 保存到storage
    saveCookieToStorage(bilibiliCookie);

    logCookieStatus();
    sendResponse({ success: true, message: 'Cookie已更新' });
    return true;
  }

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

  // 处理获取B站视频字幕的消息
  if (message.action === 'fetchBilibiliSubtitle') {
    console.log('收到获取字幕请求:', message);
    if (!message.cid) {
      console.error('获取字幕请求缺少必要参数 cid');
      sendResponse({
        success: false,
        message: '缺少必要参数cid，请确保已获取视频信息',
      });
      return true;
    }

    // 优先使用aid+cid的方式获取字幕
    if (message.aid) {
      console.log('使用aid+cid方式获取字幕');
      // 使用fetchSubtitleWithAid函数，添加重试日志
      fetchSubtitleWithAid(message.aid, message.cid)
        .then((result) => {
          console.log('使用aid获取字幕结果:', result);
          sendResponse(result);
        })
        .catch((error) => {
          console.error('使用aid获取字幕出错:', error);
          // 如果aid方式失败，尝试使用bvid
          if (message.bvid) {
            console.log('aid方式失败，尝试使用bvid方式');
            getBilibiliSubtitle(message.cid, message.bvid)
              .then((result) => {
                console.log('使用bvid获取字幕结果:', result);
                sendResponse(result);
              })
              .catch((fallbackError) => {
                console.error('使用bvid方式也失败:', fallbackError);
                sendResponse({
                  success: false,
                  message: '所有获取字幕方式均失败: ' + (fallbackError.message || '未知错误'),
                  error: '多种获取方式尝试后均失败',
                });
              });
          } else {
            sendResponse({
              success: false,
              message: error.message || '使用aid获取字幕失败',
              error: '使用aid获取字幕失败',
            });
          }
        });
    } else if (message.bvid) {
      console.log('仅使用bvid方式获取字幕');
      getBilibiliSubtitle(message.cid, message.bvid)
        .then((result) => {
          console.log('字幕获取结果:', result);
          sendResponse(result);
        })
        .catch((error) => {
          console.error('获取B站视频字幕出错:', error);
          sendResponse({
            success: false,
            message: error.message || '网络请求错误',
            error: '使用bvid获取字幕失败',
          });
        });
    } else {
      console.error('获取字幕请求缺少必要参数bvid或aid');
      sendResponse({
        success: false,
        message: '缺少必要参数bvid或aid，请确保已获取视频信息',
      });
    }
    return true; // 保持消息通道开启，等待异步响应
  }
});

// 使用aid+cid方式获取字幕
async function fetchSubtitleWithAid(aid, cid, retryCount = 2) {
  try {
    console.log(`使用aid+cid获取字幕, aid: ${aid}, cid: ${cid}, 尝试次数: ${3 - retryCount}`);
    const subtitleInfoUrl = `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`;

    console.log('字幕信息请求URL (aid方式):', subtitleInfoUrl);
    const subtitleInfoData = await fetchWithHeaders(subtitleInfoUrl);

    if (subtitleInfoData.code !== 0 || !subtitleInfoData.data) {
      console.error('获取字幕信息失败:', subtitleInfoData);
      throw new Error('获取字幕信息失败: ' + (subtitleInfoData.message || '未知错误'));
    }

    console.log('aid方式获取的字幕信息:', JSON.stringify(subtitleInfoData.data.subtitle || {}));

    // 处理字幕信息的逻辑与getBilibiliSubtitle类似
    // 检查是否有字幕
    if (!subtitleInfoData.data.subtitle) {
      return {
        success: false,
        message: '该视频没有字幕或字幕数据为空',
      };
    }

    const subtitles = subtitleInfoData.data.subtitle.list || [];
    if (subtitles.length === 0) {
      return {
        success: false,
        message: '该视频没有可用字幕',
      };
    }

    // 获取第一个字幕
    const defaultSubtitle = subtitles[0];
    const subtitleUrl = defaultSubtitle.subtitle_url;

    if (!subtitleUrl) {
      // 检查是否是自动生成字幕（AI字幕）
      if (defaultSubtitle.lan && defaultSubtitle.lan.startsWith('ai-')) {
        console.log('检测到自动生成的AI字幕，但URL为空，需要再次请求获取字幕URL');

        // 对于自动生成的字幕，需要通过另一个API获取实际的字幕URL
        try {
          const aiSubtitleUrl = `https://api.bilibili.com/x/player/v2/ai/subtitle/search/stat?aid=${aid}&cid=${cid}`;
          console.log('请求AI字幕URL:', aiSubtitleUrl);

          const aiSubtitleData = await fetchWithHeaders(aiSubtitleUrl);
          console.log('AI字幕响应:', aiSubtitleData);

          if (aiSubtitleData.code === 0 && aiSubtitleData.data && aiSubtitleData.data.subtitle_url) {
            // 找到了AI字幕的URL
            const fullAiSubtitleUrl = aiSubtitleData.data.subtitle_url.startsWith('http')
              ? aiSubtitleData.data.subtitle_url
              : `https:${aiSubtitleData.data.subtitle_url}`;

            console.log('成功获取AI字幕URL:', fullAiSubtitleUrl);

            // 继续处理字幕内容
            try {
              const subtitleHeaders = {
                Referer: 'https://www.bilibili.com/video/av' + aid, // 修正这里，使用aid而不是bvid
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Accept: 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                Origin: 'https://www.bilibili.com',
                Connection: 'keep-alive',
                'Cache-Control': 'no-cache',
              };

              // 如果有Cookie，添加到请求头中
              if (bilibiliCookie && bilibiliCookie.trim() !== '') {
                subtitleHeaders['Cookie'] = bilibiliCookie;
                console.log('AI字幕请求添加Cookie (部分显示):', bilibiliCookie.substring(0, 20) + '...');
              }

              const subtitleResponse = await fetch(fullAiSubtitleUrl, {
                headers: subtitleHeaders,
                credentials: 'include', // 修改为include以确保Cookie被发送
              });

              if (!subtitleResponse.ok) {
                throw new Error(`获取AI字幕内容失败: HTTP ${subtitleResponse.status}`);
              }

              const subtitleData = await subtitleResponse.json();

              if (!subtitleData || !subtitleData.body) {
                return {
                  success: false,
                  message: '解析AI字幕内容失败，可能是不支持的字幕格式',
                };
              }

              if (subtitleData.body.length === 0) {
                return {
                  success: false,
                  message: 'AI字幕内容为空',
                };
              }

              // 字幕元数据
              const metadata = {
                lan: defaultSubtitle.lan,
                lan_doc: defaultSubtitle.lan_doc || '自动生成字幕',
                subtitle_url: fullAiSubtitleUrl,
              };

              // 将字幕内容格式化为文本
              const subtitleText = subtitleData.body
                .map((item) => {
                  const startTime = formatTime(item.from);
                  const endTime = formatTime(item.to);
                  return `${startTime} --> ${endTime}\n${item.content}\n`;
                })
                .join('\n');

              return {
                success: true,
                metadata: metadata,
                subtitles: subtitleData.body,
                subtitleText: subtitleText,
              };
            } catch (aiError) {
              console.error('获取AI字幕内容出错:', aiError);
              throw aiError;
            }
          } else {
            return {
              success: false,
              message: '该视频有自动生成字幕，但无法获取字幕地址',
            };
          }
        } catch (aiUrlError) {
          console.error('获取AI字幕URL失败:', aiUrlError);
          return {
            success: false,
            message: '获取自动生成字幕失败: ' + (aiUrlError.message || '未知错误'),
          };
        }
      }

      return {
        success: false,
        message: '字幕地址无效',
      };
    }

    // 处理URL
    const fullSubtitleUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;
    console.log('字幕内容URL (aid方式):', fullSubtitleUrl);

    // 获取字幕内容
    try {
      const subtitleHeaders = {
        Referer: 'https://www.bilibili.com/video/av' + aid, // 修正这里，使用aid而不是bvid
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Origin: 'https://www.bilibili.com',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      };

      // 如果有Cookie，添加到请求头中
      if (bilibiliCookie && bilibiliCookie.trim() !== '') {
        subtitleHeaders['Cookie'] = bilibiliCookie;
        console.log('字幕内容请求添加Cookie (部分显示):', bilibiliCookie.substring(0, 20) + '...');
      }

      const subtitleResponse = await fetch(fullSubtitleUrl, {
        headers: subtitleHeaders,
        credentials: 'include', // 修改为include以确保Cookie被发送
      });

      if (!subtitleResponse.ok) {
        throw new Error(`获取字幕内容失败: HTTP ${subtitleResponse.status}`);
      }

      const subtitleData = await subtitleResponse.json();

      if (!subtitleData || !subtitleData.body) {
        return {
          success: false,
          message: '解析字幕内容失败，可能是不支持的字幕格式',
        };
      }

      if (subtitleData.body.length === 0) {
        return {
          success: false,
          message: '字幕内容为空',
        };
      }

      // 字幕元数据
      const metadata = {
        lan: defaultSubtitle.lan,
        lan_doc: defaultSubtitle.lan_doc,
        subtitle_url: fullSubtitleUrl,
      };

      // 将字幕内容格式化为文本
      const subtitleText = subtitleData.body
        .map((item) => {
          const startTime = formatTime(item.from);
          const endTime = formatTime(item.to);
          return `${startTime} --> ${endTime}\n${item.content}\n`;
        })
        .join('\n');

      return {
        success: true,
        metadata: metadata,
        subtitles: subtitleData.body,
        subtitleText: subtitleText,
      };
    } catch (fetchError) {
      console.error('获取字幕内容出错:', fetchError);

      // 尝试重试
      if (retryCount > 0) {
        console.log(`获取字幕内容失败，进行第${3 - retryCount + 1}次重试...`);
        // 短暂延迟后重试
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchSubtitleWithAid(aid, cid, retryCount - 1);
      }

      throw fetchError;
    }
  } catch (error) {
    console.error('aid方式获取字幕出错:', error);

    // 如果还有重试次数，则重试
    if (retryCount > 0) {
      console.log(`整体获取字幕失败，进行第${3 - retryCount + 1}次重试...`);
      // 短暂延迟后重试
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchSubtitleWithAid(aid, cid, retryCount - 1);
    }

    throw error; // 向上传递错误，让调用者决定如何处理
  }
}
