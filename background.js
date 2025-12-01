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
    // 使用原始的WBI URL，不替换为v2接口
    console.log('使用WBI接口请求:', url);
    console.log('请求头:', JSON.stringify(headers));

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      credentials: 'include', // 确保Cookie被发送
    });

    if (!response.ok) {
      console.error(`WBI请求失败: ${url}, 状态码: ${response.status}`);
      throw new Error(`请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();

    // 详细打印完整接口响应数据
    console.log('===== WBI接口响应数据开始 =====');
    console.log('状态码:', data.code);
    console.log('消息:', data.message);
    console.log('完整数据:', JSON.stringify(data, null, 2));
    console.log('===== WBI接口响应数据结束 =====');

    // 如果字幕数据特别关注subtitles字段
    if (data.code === 0 && data.data && data.data.subtitle) {
      console.log('===== 字幕数据详情 =====');
      console.log('字幕列表数量:', (data.data.subtitle.subtitles || []).length);

      const subtitles = data.data.subtitle.subtitles || [];
      if (subtitles.length > 0) {
        subtitles.forEach((sub, index) => {
          console.log(`字幕[${index}]:`, {
            id: sub.id,
            lan: sub.lan,
            lan_doc: sub.lan_doc,
            url: sub.subtitle_url,
          });
        });
      } else {
        console.log('没有找到字幕数据');
      }
      console.log('===== 字幕数据详情结束 =====');
    }

    // 如果返回-400错误并且消息中包含'Key:'，很可能是缺少必要参数
    if (data.code === -400 && data.message && data.message.includes('Key:')) {
      console.warn('API返回参数错误，可能需要额外参数:', data.message);

      // 尝试添加isGaiaAvoided=false参数后再次请求
      let retryUrl = url;
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
        console.log('===== 参数补充后API响应 =====');
        console.log('状态码:', retryData.code);
        console.log('消息:', retryData.message);
        console.log('完整数据:', JSON.stringify(retryData, null, 2));
        console.log('===== 参数补充后API响应结束 =====');
        return retryData;
      }
    }

    return data;
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

    const subtitles = subtitleInfoData.data.subtitle.subtitles || [];
    console.log('找到字幕列表数量:', subtitles.length);

    if (subtitles.length === 0) {
      console.log('字幕列表为空');
      return {
        success: false,
        message: '该视频没有可用字幕',
      };
    }

    // 获取第一个字幕（通常是默认字幕），优先获取中文字幕
    const defaultSubtitle = subtitles.find((item) => item.lan === 'ai-zh');
    console.log('默认字幕信息:', defaultSubtitle);

    const subtitleUrl = defaultSubtitle.subtitle_url;

    if (!subtitleUrl) {
      console.log('字幕URL为空');

      // 检查是否是自动生成字幕（AI字幕）
      if (defaultSubtitle.lan && defaultSubtitle.lan.startsWith('ai-')) {
        console.log('检测到自动生成的AI字幕，但URL为空，需要再次请求获取字幕URL');

        // 对于自动生成的字幕，需要通过另一个API获取实际的字幕URL
        try {
          const aiSubtitleUrl = `https://api.bilibili.com/x/player/v2/ai/subtitle/search/stat?aid=${aid}&cid=${cid}`;
          console.log('请求AI字幕URL:', aiSubtitleUrl);

          // 添加详细日志
          console.log('===== AI字幕URL请求开始 =====');
          console.log(`请求URL: ${aiSubtitleUrl}`);
          console.log(`Cookie状态: ${bilibiliCookie ? '已设置' : '未设置'}`);
          if (bilibiliCookie) {
            console.log(`Cookie前20字符: ${bilibiliCookie.substring(0, 20)}`);
          }
          console.log('===== AI字幕URL请求开始结束 =====');

          const aiSubtitleData = await fetchWithHeaders(aiSubtitleUrl);

          // 添加响应详情日志
          console.log('===== AI字幕URL响应详情 =====');
          console.log('状态码:', aiSubtitleData.code);
          console.log('消息:', aiSubtitleData.message);
          console.log('完整响应:', JSON.stringify(aiSubtitleData, null, 2));

          if (aiSubtitleData.code === 0 && aiSubtitleData.data) {
            console.log('AI字幕URL:', aiSubtitleData.data.subtitle_url || '未找到');
          }
          console.log('===== AI字幕URL响应详情结束 =====');

          console.log('AI字幕响应:', aiSubtitleData);

          if (aiSubtitleData.code === 0 && aiSubtitleData.data && aiSubtitleData.data.subtitle_url) {
            // 找到了AI字幕的URL
            const fullAiSubtitleUrl = formatSubtitleUrl(aiSubtitleData.data.subtitle_url);

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

              // 检查是否是AI字幕格式
              if (isAISubtitleFormat(subtitleData)) {
                console.log('检测到AI字幕格式，使用专用处理');
                const formattedData = formatAISubtitleData(subtitleData);
                if (formattedData) {
                  return {
                    success: true,
                    metadata: formattedData.metadata,
                    subtitles: formattedData.subtitles,
                    subtitleText: formattedData.subtitleText,
                  };
                }
              }

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
    const fullSubtitleUrl = formatSubtitleUrl(subtitleUrl);

    console.log('字幕内容URL:', fullSubtitleUrl);

    // 使用带Headers的请求获取字幕内容，以避免可能的跨域问题
    try {
      console.log('🚀 subtitleResponse---:', '123');
      const subtitleResponse = await fetch(fullSubtitleUrl);

      console.log('🚀 subtitleResponse---:', subtitleResponse);

      if (!subtitleResponse.ok) {
        console.error('获取字幕内容失败:', subtitleResponse.status);
        throw new Error(`获取字幕内容失败: HTTP ${subtitleResponse.status}`);
      }

      const subtitleData = await subtitleResponse.json();
      console.log('成功获取字幕内容');

      // 检查是否是AI字幕格式
      if (isAISubtitleFormat(subtitleData)) {
        console.log('检测到AI字幕格式，使用专用处理');
        const formattedData = formatAISubtitleData(subtitleData);
        if (formattedData) {
          return {
            success: true,
            metadata: formattedData.metadata,
            subtitles: formattedData.subtitles,
            subtitleText: formattedData.subtitleText,
          };
        }
      }

      if (!subtitleData || !subtitleData.body) {
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

    // FIXME 使用 aid 获取字幕文件的成功率很低
    // 优先使用aid+cid的方式获取字幕
    // if (message.aid) {
    //   console.log('使用aid+cid方式获取字幕');
    //   // 使用fetchSubtitleWithAid函数，添加重试日志
    //   fetchSubtitleWithAid(message.aid, message.cid)
    //     .then((result) => {
    //       console.log('使用aid获取字幕结果:', result);
    //       sendResponse(result);
    //     })
    //     .catch((error) => {
    //       console.error('使用aid获取字幕出错:', error);
    //       // 如果aid方式失败，尝试使用bvid
    //       if (message.bvid) {
    //         console.log('aid方式失败，尝试使用bvid方式');
    //         getBilibiliSubtitle(message.cid, message.bvid)
    //           .then((result) => {
    //             console.log('使用bvid获取字幕结果:', result);
    //             sendResponse(result);
    //           })
    //           .catch((fallbackError) => {
    //             console.error('使用bvid方式也失败:', fallbackError);
    //             sendResponse({
    //               success: false,
    //               message: '所有获取字幕方式均失败: ' + (fallbackError.message || '未知错误'),
    //               error: '多种获取方式尝试后均失败',
    //             });
    //           });
    //       } else {
    //         sendResponse({
    //           success: false,
    //           message: error.message || '使用aid获取字幕失败',
    //           error: '使用aid获取字幕失败',
    //         });
    //       }
    //     });
    // } else

    if (message.bvid) {
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

  // 处理获取B站Cookie的消息
  if (message.action === 'getCookie') {
    console.log('收到获取Cookie请求');

    // 查询当前激活的标签页
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        if (!tabs || tabs.length === 0) {
          console.error('无法获取当前标签页');
          sendResponse({ success: false, message: '无法获取当前标签页' });
          return;
        }

        const currentTab = tabs[0];
        console.log('当前标签页URL:', currentTab.url);

        // 检查是否在B站页面
        if (!currentTab.url || !currentTab.url.includes('bilibili.com')) {
          console.error('当前不在B站页面');
          sendResponse({ success: false, message: '请在B站页面使用此功能' });
          return;
        }

        // 使用chrome.cookies API获取所有B站Cookie
        console.log('开始获取B站Cookies...');

        try {
          // 直接使用内容脚本获取完整Cookie字符串
          console.log('尝试使用脚本直接获取document.cookie...');
          const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => {
              return document.cookie;
            },
          });

          console.log('脚本执行结果:', results);

          if (results && results[0] && results[0].result && results[0].result.trim() !== '') {
            const fullCookie = results[0].result;
            console.log('成功获取完整Cookie字符串，长度:', fullCookie.length);

            // 保存Cookie
            bilibiliCookie = fullCookie;
            await saveCookieToStorage(fullCookie);

            // 检查必要的Cookie项是否存在
            const hasSessData = fullCookie.includes('SESSDATA=');
            const hasBiliJct = fullCookie.includes('bili_jct=');
            const hasDedeUserID = fullCookie.includes('DedeUserID=');

            console.log(
              'Cookie关键项检查: SESSDATA=',
              hasSessData,
              'bili_jct=',
              hasBiliJct,
              'DedeUserID=',
              hasDedeUserID,
            );

            if (!hasSessData || !hasBiliJct || !hasDedeUserID) {
              console.warn('Cookie可能不完整，缺少关键信息');
              sendResponse({
                success: true,
                cookie: fullCookie,
                message: 'Cookie获取成功，包含所有关键信息',
              });
              return;
            } else {
              console.log('Cookie获取成功，包含所有关键信息');
              sendResponse({
                success: true,
                cookie: fullCookie,
                message: 'Cookie获取成功',
              });
              return;
            }
          } else {
            console.log('直接获取document.cookie失败，尝试使用cookies API');
          }
        } catch (scriptError) {
          console.error('尝试使用脚本获取Cookie时出错:', scriptError);
          console.log('将尝试使用cookies API');
        }

        // 如果内容脚本方法失败，再尝试使用cookies API
        // 从URL获取域名
        const url = new URL(currentTab.url);
        const domain = url.hostname;
        console.log('从URL提取的域名:', domain);

        // 获取所有相关域名的cookie
        const domains = ['.bilibili.com', 'www.bilibili.com', 'bilibili.com', domain];

        let allCookies = [];

        // 获取所有域名的cookies
        for (const d of domains) {
          try {
            console.log(`获取域名 ${d} 的cookies...`);
            const cookies = await chrome.cookies.getAll({ domain: d });
            console.log(`域名 ${d} 获取到 ${cookies.length} 个cookies`);
            allCookies = allCookies.concat(cookies);
          } catch (e) {
            console.error(`获取域名 ${d} 的cookies时出错:`, e);
          }
        }

        // 去重
        const uniqueCookies = Array.from(new Set(allCookies.map((c) => c.name))).map((name) => {
          return allCookies.find((c) => c.name === name);
        });

        console.log('获取到的总Cookie数:', uniqueCookies.length);

        if (uniqueCookies.length === 0) {
          console.error('未获取到任何Cookie');
          sendResponse({ success: false, message: '未获取到Cookie，请确保已登录B站' });
          return;
        }

        // 将Cookie格式化为字符串格式
        const cookieString = uniqueCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

        console.log('整合后的Cookie长度:', cookieString.length);

        if (cookieString.trim() === '') {
          console.error('整合后的Cookie为空');
          sendResponse({ success: false, message: '获取到的Cookie为空，请确保已登录B站' });
          return;
        }

        // 保存Cookie
        bilibiliCookie = cookieString;
        await saveCookieToStorage(cookieString);

        // 检查是否包含关键Cookie项
        const hasSessData = cookieString.includes('SESSDATA=');
        const hasBiliJct = cookieString.includes('bili_jct=');
        const hasDedeUserID = cookieString.includes('DedeUserID=');

        console.log(
          'Cookie包含关键信息检查: SESSDATA=',
          hasSessData,
          'bili_jct=',
          hasBiliJct,
          'DedeUserID=',
          hasDedeUserID,
        );

        if (!hasSessData || !hasBiliJct || !hasDedeUserID) {
          console.warn('通过API获取的Cookie可能不完整，缺少关键信息');
          sendResponse({
            success: true,
            cookie: cookieString,
            message: 'Cookie已获取(API方式)，但可能不完整，建议确认是否已正确登录B站',
          });
        } else {
          console.log('通过API获取Cookie成功，包含所有关键信息');
          sendResponse({
            success: true,
            cookie: cookieString,
            message: 'Cookie获取成功(API方式)',
          });
        }
      } catch (error) {
        console.error('获取Cookie时出错:', error);
        sendResponse({
          success: false,
          message: '获取Cookie失败: ' + (error?.message || '未知错误'),
        });
      }
    });

    return true; // 保持消息通道开启，等待异步响应
  }

  // 处理测试WBI接口的消息
  if (message.action === 'testWbiApi') {
    console.log('收到测试WBI接口请求:', message);

    if (!message.aid || !message.cid) {
      sendResponse({
        success: false,
        message: '缺少必要参数aid或cid',
      });
      return true;
    }

    testWbiApi(message.aid, message.cid)
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        console.error('测试WBI接口出错:', error);
        sendResponse({
          success: false,
          message: error.message || '测试WBI接口时发生错误',
        });
      });

    return true; // 保持消息通道开启，等待异步响应
  }

  // 处理获取合集列表的消息
  if (message.action === 'fetchCollectionList') {
    console.log('收到获取合集列表请求:', message);

    if (!message.mid || !message.season_id) {
      console.error('获取合集请求缺少必要参数 mid 或 season_id');
      sendResponse({
        success: false,
        message: '缺少必要参数 mid 或 season_id',
      });
      return true;
    }

    const page = typeof message.page === 'number' && message.page > 0 ? message.page : 1;
    const pageSize = typeof message.pageSize === 'number' && message.pageSize > 0 ? message.pageSize : 30;
    const responseSender = sendResponse;

    try {
      // 构建合集API URL
      const collectionUrl = `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=${message.mid}&season_id=${message.season_id}&sort_reverse=false&page_num=${page}&page_size=${pageSize}&web_location=333.1387`;
      console.log('合集API请求URL:', collectionUrl);

      // 检查Cookie状态
      console.log('合集请求前Cookie状态:');
      logCookieStatus();
      diagnoseCookie();

      // 创建请求头
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Origin: 'https://space.bilibili.com',
        Referer: `https://space.bilibili.com/${message.mid}/channel/collectiondetail?sid=${message.season_id}`,
      };

      // 如果有Cookie，添加到请求头中
      if (bilibiliCookie && bilibiliCookie.trim() !== '') {
        headers['Cookie'] = bilibiliCookie;
        console.log('合集请求已添加Cookie (部分显示):', bilibiliCookie.substring(0, 20) + '...');
      } else {
        console.log('合集请求未添加Cookie，因为Cookie未设置或为空');
      }

      // 使用setTimeout确保在单独的任务中执行网络请求
      setTimeout(() => {
        fetch(collectionUrl, {
          method: 'GET',
          headers: headers,
          credentials: 'include',
        })
          .then((response) => {
            console.log('合集API响应状态:', response.status);

            if (!response.ok) {
              throw new Error(`HTTP请求失败，状态码: ${response.status}`);
            }

            return response.json();
          })
          .then((result) => {
            console.log('合集API响应:', result);

            try {
              if (result.code === 0 && result.data) {
                responseSender({
                  success: true,
                  data: result.data,
                  message: '获取合集内容成功',
                  page: page,
                });
              } else {
                console.error('合集API返回错误:', result);
                responseSender({
                  success: false,
                  message: result.message || '获取合集内容失败',
                  code: result.code,
                });
              }
            } catch (sendError) {
              console.error('发送响应时出错:', sendError);
              try {
                responseSender({
                  success: false,
                  message: '发送响应时出错: ' + sendError.message,
                });
              } catch (finalError) {
                console.error('最终尝试发送响应也失败:', finalError);
              }
            }
          })
          .catch((error) => {
            console.error('获取合集内容出错:', error);
            try {
              responseSender({
                success: false,
                message: error.message || '网络请求错误',
              });
            } catch (sendError) {
              console.error('发送错误响应时出错:', sendError);
            }
          });
      }, 0);
    } catch (error) {
      console.error('准备合集请求时出错:', error);
      try {
        responseSender({
          success: false,
          message: '准备请求时出错: ' + error.message,
        });
      } catch (sendError) {
        console.error('发送错误响应时出错:', sendError);
      }
    }

    return true; // 保持消息通道开启
  }

  // 处理获取用户信息(卡片)的消息
  if (message.action === 'fetchUserCard') {
    console.log('收到获取用户信息请求:', message);

    if (!message.mid) {
      console.error('获取用户信息请求缺少必要参数 mid');
      sendResponse({
        success: false,
        message: '缺少必要参数 mid',
      });
      return true;
    }

    const responseSender = sendResponse;

    try {
      // 构建API URL
      const photo = message.photo === true;
      const userCardUrl = `https://api.bilibili.com/x/web-interface/card?mid=${message.mid}&photo=${photo}`;
      console.log('用户信息API请求URL:', userCardUrl);

      // 检查Cookie状态
      logCookieStatus();

      // 创建请求头
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Origin: 'https://space.bilibili.com',
        Referer: `https://space.bilibili.com/${message.mid}`,
      };

      // 如果有Cookie，添加到请求头中
      if (bilibiliCookie && bilibiliCookie.trim() !== '') {
        headers['Cookie'] = bilibiliCookie;
      }

      // 使用setTimeout确保在单独的任务中执行网络请求
      setTimeout(() => {
        fetch(userCardUrl, {
          method: 'GET',
          headers: headers,
          credentials: 'include',
        })
          .then((response) => {
            console.log('用户信息API响应状态:', response.status);

            if (!response.ok) {
              throw new Error(`HTTP请求失败，状态码: ${response.status}`);
            }

            return response.json();
          })
          .then((result) => {
            console.log('用户信息API响应:', result);

            try {
              if (result.code === 0 && result.data) {
                responseSender({
                  success: true,
                  data: result.data,
                  message: '获取用户信息成功',
                });
              } else {
                console.error('用户信息API返回错误:', result);
                responseSender({
                  success: false,
                  message: result.message || '获取用户信息失败',
                  code: result.code,
                });
              }
            } catch (sendError) {
              console.error('发送响应时出错:', sendError);
              try {
                responseSender({
                  success: false,
                  message: '发送响应时出错: ' + sendError.message,
                });
              } catch (finalError) {
                console.error('最终尝试发送响应也失败:', finalError);
              }
            }
          })
          .catch((error) => {
            console.error('获取用户信息出错:', error);
            try {
              responseSender({
                success: false,
                message: error.message || '网络请求错误',
              });
            } catch (sendError) {
              console.error('发送错误响应时出错:', sendError);
            }
          });
      }, 0);
    } catch (error) {
      console.error('准备用户信息请求时出错:', error);
      try {
        responseSender({
          success: false,
          message: '准备请求时出错: ' + error.message,
        });
      } catch (sendError) {
        console.error('发送错误响应时出错:', sendError);
      }
    }

    return true; // 保持消息通道开启
  }

  // 处理获取收藏夹列表的消息
  if (message.action === 'fetchFavoriteList') {
    console.log('收到获取收藏夹列表请求:', message);

    if (!message.mediaId) {
      console.error('获取收藏夹请求缺少必要参数 mediaId');
      sendResponse({
        success: false,
        message: '缺少必要参数mediaId，请确保已提取收藏夹ID',
      });
      return true;
    }

    // 确保页码和每页数量参数有效
    const page = typeof message.page === 'number' && message.page > 0 ? message.page : 1;
    const pageSize =
      typeof message.pageSize === 'number' && message.pageSize > 0 && message.pageSize <= 20 ? message.pageSize : 20;

    // 为确保在任何情况下都能返回响应，保存sendResponse引用
    const responseSender = sendResponse;

    try {
      // 构建收藏夹API URL - 添加平台参数和时间戳减少缓存问题
      const favoriteUrl = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${
        message.mediaId
      }&pn=${page}&ps=${pageSize}&platform=web&t=${Date.now()}`;
      console.log('收藏夹API请求URL:', favoriteUrl);

      // 检查Cookie状态
      console.log('收藏夹请求前Cookie状态:');
      logCookieStatus();
      diagnoseCookie();

      // 创建请求头
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Origin: 'https://www.bilibili.com',
        Referer: 'https://space.bilibili.com/',
      };

      // 如果有Cookie，添加到请求头中
      if (bilibiliCookie && bilibiliCookie.trim() !== '') {
        headers['Cookie'] = bilibiliCookie;
        console.log('收藏夹请求已添加Cookie (部分显示):', bilibiliCookie.substring(0, 20) + '...');
      } else {
        console.log('收藏夹请求未添加Cookie，因为Cookie未设置或为空');
      }

      // 使用setTimeout确保在单独的任务中执行网络请求，避免消息端口提前关闭
      setTimeout(() => {
        fetch(favoriteUrl, {
          method: 'GET',
          headers: headers,
          credentials: 'include',
        })
          .then((response) => {
            console.log('收藏夹API响应状态:', response.status);

            if (!response.ok) {
              throw new Error(`HTTP请求失败，状态码: ${response.status}`);
            }

            return response.json();
          })
          .then((result) => {
            console.log('收藏夹API响应:', result);

            try {
              if (result.code === 0 && result.data) {
                // 记录是否有更多数据需要分页
                const hasMore = result.data.has_more === true;
                console.log(`收藏夹是否有更多数据: ${hasMore}, 当前页: ${page}`);

                responseSender({
                  success: true,
                  data: result.data,
                  message: '获取收藏夹内容成功',
                  page: page,
                  hasMore: hasMore,
                });
              } else {
                console.error('收藏夹API返回错误:', result);
                responseSender({
                  success: false,
                  message: result.message || '获取收藏夹内容失败',
                  code: result.code,
                });
              }
            } catch (sendError) {
              console.error('发送响应时出错:', sendError);
              // 尝试再次发送响应
              try {
                responseSender({
                  success: false,
                  message: '发送响应时出错: ' + sendError.message,
                });
              } catch (finalError) {
                console.error('最终尝试发送响应也失败:', finalError);
              }
            }
          })
          .catch((error) => {
            console.error('获取收藏夹内容出错:', error);

            try {
              responseSender({
                success: false,
                message: error.message || '网络请求错误',
              });
            } catch (sendError) {
              console.error('发送错误响应时出错:', sendError);
            }
          });
      }, 0);
    } catch (error) {
      console.error('准备收藏夹请求时出错:', error);
      try {
        responseSender({
          success: false,
          message: '准备请求时出错: ' + error.message,
        });
      } catch (sendError) {
        console.error('发送错误响应时出错:', sendError);
      }
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

    // 记录请求前的关键信息
    console.log('===== 字幕请求前信息 =====');
    console.log(`请求URL: ${subtitleInfoUrl}`);
    console.log(`Cookie状态: ${bilibiliCookie ? '已设置' : '未设置'}`);
    if (bilibiliCookie) {
      console.log(`Cookie长度: ${bilibiliCookie.length}`);
      console.log(`Cookie前20字符: ${bilibiliCookie.substring(0, 20)}`);
    }
    diagnoseCookie(); // 运行Cookie诊断
    console.log('===== 字幕请求前信息结束 =====');

    const subtitleInfoData = await fetchWithHeaders(subtitleInfoUrl);

    // 记录完整的字幕响应数据
    console.log('===== 字幕响应详细数据 =====');
    console.log('状态码:', subtitleInfoData.code);
    console.log('消息:', subtitleInfoData.message);

    if (subtitleInfoData.code === 0 && subtitleInfoData.data) {
      // 有字幕数据时输出详细信息
      if (subtitleInfoData.data.subtitle) {
        console.log('字幕信息:', JSON.stringify(subtitleInfoData.data.subtitle, null, 2));

        // 输出每个字幕的详细信息
        const subtitles = subtitleInfoData.data.subtitle.subtitles || [];
        if (subtitles.length > 0) {
          subtitles.forEach((sub, index) => {
            console.log(`字幕[${index}] 详情:`, JSON.stringify(sub, null, 2));
          });
        } else {
          console.log('字幕列表为空');
        }
      } else {
        console.log('响应中不包含字幕数据');
      }
    } else {
      console.log('响应状态码非0，无法获取字幕');
    }
    console.log('===== 字幕响应详细数据结束 =====');

    if (subtitleInfoData.code !== 0 || !subtitleInfoData.data) {
      console.error('获取字幕信息失败:', subtitleInfoData);
      throw new Error('获取字幕信息失败: ' + (subtitleInfoData.message || '未知错误'));
    }

    console.log('aid方式获取的字幕信息:', JSON.stringify(subtitleInfoData.data.subtitle || {}));

    // 检查是否有字幕
    if (!subtitleInfoData.data.subtitle) {
      return {
        success: false,
        message: '该视频没有字幕或字幕数据为空',
      };
    }

    const subtitles = subtitleInfoData.data.subtitle.subtitles || [];

    console.log('🚀 subtitles:', subtitles, subtitleInfoData.data.subtitle);
    if (subtitles.length === 0) {
      return {
        success: false,
        message: '该视频没有可用字幕',
      };
    }

    // 获取第一个字幕，优先获取中文字幕
    const defaultSubtitle = subtitles.find((item) => item.lan === 'ai-zh');
    console.log('🚀 defaultSubtitle:', defaultSubtitle);
    const subtitleUrl = defaultSubtitle.subtitle_url;
    console.log('🚀 subtitleUrl:', subtitleUrl);

    if (!subtitleUrl) {
      // 检查是否是自动生成字幕（AI字幕）
      if (defaultSubtitle.lan && defaultSubtitle.lan.startsWith('ai-')) {
        console.log('检测到自动生成的AI字幕，但URL为空，需要再次请求获取字幕URL');

        // 对于自动生成的字幕，需要通过另一个API获取实际的字幕URL
        try {
          const aiSubtitleUrl = `https://api.bilibili.com/x/player/v2/ai/subtitle/search/stat?aid=${aid}&cid=${cid}`;
          console.log('请求AI字幕URL:', aiSubtitleUrl);

          // 添加详细日志
          console.log('===== AI字幕URL请求开始 =====');
          console.log(`请求URL: ${aiSubtitleUrl}`);
          console.log(`Cookie状态: ${bilibiliCookie ? '已设置' : '未设置'}`);
          if (bilibiliCookie) {
            console.log(`Cookie前20字符: ${bilibiliCookie.substring(0, 20)}`);
          }
          console.log('===== AI字幕URL请求开始结束 =====');

          const aiSubtitleData = await fetchWithHeaders(aiSubtitleUrl);

          // 添加响应详情日志
          console.log('===== AI字幕URL响应详情 =====');
          console.log('状态码:', aiSubtitleData.code);
          console.log('消息:', aiSubtitleData.message);
          console.log('完整响应:', JSON.stringify(aiSubtitleData, null, 2));

          if (aiSubtitleData.code === 0 && aiSubtitleData.data) {
            console.log('AI字幕URL:', aiSubtitleData.data.subtitle_url || '未找到');
          }
          console.log('===== AI字幕URL响应详情结束 =====');

          console.log('AI字幕响应:', aiSubtitleData);

          if (aiSubtitleData.code === 0 && aiSubtitleData.data && aiSubtitleData.data.subtitle_url) {
            // 找到了AI字幕的URL
            const fullAiSubtitleUrl = formatSubtitleUrl(aiSubtitleData.data.subtitle_url);

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

              // 检查是否是AI字幕格式
              if (isAISubtitleFormat(subtitleData)) {
                console.log('检测到AI字幕格式，使用专用处理');
                const formattedData = formatAISubtitleData(subtitleData);
                if (formattedData) {
                  return {
                    success: true,
                    metadata: formattedData.metadata,
                    subtitles: formattedData.subtitles,
                    subtitleText: formattedData.subtitleText,
                  };
                }
              }

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
    const fullSubtitleUrl = formatSubtitleUrl(subtitleUrl);
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

      // 检查是否是AI字幕格式
      if (isAISubtitleFormat(subtitleData)) {
        console.log('检测到AI字幕格式，使用专用处理');
        const formattedData = formatAISubtitleData(subtitleData);
        if (formattedData) {
          return {
            success: true,
            metadata: formattedData.metadata,
            subtitles: formattedData.subtitles,
            subtitleText: formattedData.subtitleText,
          };
        }
      }

      if (!subtitleData || !subtitleData.body) {
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

// 在文件适当位置添加一个处理字幕URL的辅助函数
function formatSubtitleUrl(url) {
  if (!url) return '';

  // 处理以//开头的URL，添加https:
  if (url.startsWith('//')) {
    return 'https:' + url;
  }

  // 处理不带协议头的URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }

  return url;
}

// 添加一个函数来检查是否是AI字幕格式
function isAISubtitleFormat(data) {
  return data && data.type === 'AIsubtitle' && Array.isArray(data.body);
}

// 添加一个函数处理AI字幕数据
function formatAISubtitleData(data) {
  if (!isAISubtitleFormat(data)) {
    return null;
  }

  try {
    // 将字幕内容格式化为文本
    const subtitleText = data.body
      .map((item) => {
        const startTime = formatTime(item.from);
        const endTime = formatTime(item.to);
        return `${startTime} --> ${endTime}\n${item.content}\n`;
      })
      .join('\n');

    return {
      metadata: {
        lan: data.lang || 'zh',
        lan_doc: '自动生成字幕 (AI)',
        ai_type: true,
      },
      subtitles: data.body,
      subtitleText: subtitleText,
    };
  } catch (error) {
    console.error('格式化AI字幕数据失败:', error);
    return null;
  }
}

// 添加一个测试WBI接口的函数
async function testWbiApi(aid, cid) {
  try {
    console.log('==== 开始测试WBI接口 ====');
    console.log(`参数: aid=${aid}, cid=${cid}`);

    // 构建URL
    const wbiUrl = `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`;
    console.log(`请求URL: ${wbiUrl}`);

    // 诊断Cookie
    diagnoseCookie();

    // 创建请求头
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Origin: 'https://www.bilibili.com',
      Referer: 'https://www.bilibili.com/',
    };

    // 添加Cookie
    if (bilibiliCookie && bilibiliCookie.trim() !== '') {
      headers['Cookie'] = bilibiliCookie;
      console.log('已添加Cookie到请求头');
    } else {
      console.log('未添加Cookie，因为Cookie未设置或为空');
    }

    console.log('请求头:', JSON.stringify(headers, null, 2));

    // 发送请求
    console.log('正在发送请求...');
    const response = await fetch(wbiUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });

    console.log('请求已发送，状态码:', response.status);

    // 获取响应数据
    const data = await response.json();

    console.log('===== WBI接口测试响应 =====');
    console.log('状态码:', data.code);
    console.log('消息:', data.message);
    console.log('完整响应数据:');
    console.log(JSON.stringify(data, null, 2));
    console.log('===== WBI接口测试响应结束 =====');

    return {
      success: data.code === 0,
      data: data,
    };
  } catch (error) {
    console.error('WBI接口测试失败:', error);
    return {
      success: false,
      error: error.message || '未知错误',
    };
  } finally {
    console.log('==== 测试WBI接口结束 ====');
  }
}
