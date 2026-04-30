document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM加载完成，初始化脚本...');

  const getPageUrlBtn = document.getElementById('getPageUrlBtn');
  const urlInput = document.getElementById('urlInput');
  const generateUrlBtn = document.getElementById('generateUrlBtn');
  const getFavoriteBtn = document.getElementById('getFavoriteBtn');

  // 自定义下拉框元素
  const urlTypeTrigger = document.getElementById('urlTypeTrigger');
  const urlTypeDropdown = document.getElementById('urlTypeDropdown');
  const urlTypeOptions = urlTypeDropdown.querySelectorAll('.custom-select-option');
  const urlTypeSelectedText = document.querySelector('.custom-select-selected-text');
  let currentUrlType = 'video'; // 默认选择视频地址

  const bilibiliCookieInput = document.getElementById('bilibiliCookie');
  const cookieClearBtn = document.querySelector('.cookie-clear-btn');
  const cookieVisibilityBtn = document.getElementById('cookieVisibilityBtn');
  const cookieInputWrapper = bilibiliCookieInput.closest('.input-wrapper');
  const errorToast = document.getElementById('errorToast');
  const successToast = document.getElementById('successToast');
  const previewBtn = document.getElementById('previewBtn');
  const copyBtn = document.getElementById('copyBtn');
  const sponsorBtn = document.getElementById('sponsorBtn');
  const followBtn = document.getElementById('followBtn');

  // 表格相关元素
  const videoTableBody = document.getElementById('videoTableBody');
  const exportTableBtn = document.getElementById('exportTableBtn');
  const clearTableBtn = document.getElementById('clearTableBtn');
  const batchGetSubtitleBtn = document.getElementById('batchGetSubtitleBtn');
  const transcribeAudioBtn = document.getElementById('transcribeAudioBtn');
  const transcribeAudioBtnDefaultHtml = transcribeAudioBtn ? transcribeAudioBtn.innerHTML : '';
  const noSubtitleBanner = document.getElementById('noSubtitleBanner');
  const noSubtitleBannerText = document.getElementById('noSubtitleBannerText');

  // 进度条相关元素
  const progressContainer = document.getElementById('progressContainer');
  const progressCircleValue = document.getElementById('progressCircleValue');
  const progressText = document.getElementById('progressText');
  const progressSubText = document.getElementById('progressSubText');
  const transcribeProgressReminder = document.getElementById('transcribeProgressReminder');

  // 显示和更新进度条函数
  function showProgress(show = true) {
    if (show) {
      progressContainer.classList.add('show');
    } else {
      progressContainer.classList.remove('show');
      setTranscribeProgressReminderVisible(false);
    }
  }

  function setTranscribeProgressReminderVisible(visible) {
    if (!transcribeProgressReminder) return;
    transcribeProgressReminder.classList.toggle('show', !!visible);
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
      closeSubtitleLanguageMenu();
      // 当表体水平滚动时，同步表头的水平滚动位置
      tableHeaderContainer.scrollLeft = tableBodyContainer.scrollLeft;
    });
  } else {
    console.error('找不到表格容器元素，无法设置同步滚动');
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('.subtitle-language-select') || event.target.closest('.subtitle-language-menu')) return;
    closeSubtitleLanguageMenu();
  });

  let generatedUrl = '';
  let currentVideoInfo = null;
  let currentSubtitleData = null;
  // 视频列表数组，用于存储添加到表格的视频
  let videoList = [];
  let activeSubtitleLanguageMenu = null;
  let transcribeProgressContext = null;
  let skipTranscribeConfirmDialog = false;
  const CHARGE_EXCLUSIVE_BLOCK_REASON = 'charge-exclusive';
  const CHARGE_EXCLUSIVE_BLOCK_STATUS = '充电专属不可获取';
  const TXT_VIDEO_INFO_FIELD_OPTIONS = [
    { value: 'title', label: '标题' },
    { value: 'link', label: '链接' },
    { value: 'author', label: '作者' },
    { value: 'publishDate', label: '发布日期' },
    { value: 'tags', label: '标签' },
  ];

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

  function isSubtitleSuccessStatus(status) {
    return ['获取成功', '已获取字幕', '已获取AI字幕', 'B站字幕', '外挂字幕', '转写字幕'].includes(status);
  }

  function hasSubtitleTracks(video) {
    return Array.isArray(video?.subtitleTracks) && video.subtitleTracks.length > 0;
  }

  function isTranscribedSubtitle(video) {
    return ['已获取AI字幕', '转写字幕'].includes(video?.subtitleStatus);
  }

  function hasSubtitleContent(video) {
    return !!(
      video &&
      isSubtitleSuccessStatus(video.subtitleStatus) &&
      ((video.subtitleText && video.subtitleText.trim() !== '') || hasSubtitleTracks(video))
    );
  }

  function isChargeExclusiveBlockedResponse(response) {
    return !!(
      response &&
      (response.blockReason === CHARGE_EXCLUSIVE_BLOCK_REASON || response.isChargeExclusive === true)
    );
  }

  function markVideoAsChargeExclusive(video) {
    if (!video) return;
    video.subtitleStatus = CHARGE_EXCLUSIVE_BLOCK_STATUS;
    video.subtitleText = null;
    video.subtitleTracks = [];
    video.selectedSubtitleTrackIds = [];
    video.subtitleTrackContents = {};
    video.transcribedLanguage = null;
    video.transcribedLanguageName = null;
    video.isChargeExclusive = true;
    video.blockReason = CHARGE_EXCLUSIVE_BLOCK_REASON;
  }

  function getNoExternalSubtitleCount() {
    return videoList.filter((video) => video?.subtitleStatus && video.subtitleStatus.includes('无外挂字幕')).length;
  }

  function updateNoSubtitleBanner() {
    if (!noSubtitleBanner || !noSubtitleBannerText) return;

    const noExternalSubtitleCount = getNoExternalSubtitleCount();
    if (noExternalSubtitleCount <= 0) {
      noSubtitleBanner.classList.remove('show');
      noSubtitleBannerText.textContent = '';
      return;
    }

    noSubtitleBannerText.textContent = `${noExternalSubtitleCount} 个视频无外挂字幕，可点击“转写无字幕”按钮生成字幕`;
    noSubtitleBanner.classList.add('show');
  }

  function shouldAttemptAudioTranscription(video) {
    if (!video || !video.bvid) return false;
    if (hasSubtitleContent(video)) return false;

    const status = video.subtitleStatus || '未获取';
    if (
      status === '获取中' ||
      status === 'AI转写中' ||
      status === '转写中' ||
      status === CHARGE_EXCLUSIVE_BLOCK_STATUS ||
      status.startsWith('信息不完整')
    ) {
      return false;
    }

    return true;
  }

  function getSubtitleStatusDisplayText(video) {
    if (isTranscribedSubtitle(video)) {
      return '转写字幕';
    }

    return '外挂字幕';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSubtitleTrackId(track, index = 0) {
    return String(track?.trackId || `${track?.id ?? track?.lan ?? 'track'}-${track?.lan || 'unknown'}-${index}`);
  }

  function getSubtitleLanguageName(track) {
    const sourceText = String(track?.lan_doc || track?.lan || '字幕').trim();
    const lan = String(track?.lan || '').toLowerCase();

    if (/中文|简体|繁体|chinese/.test(sourceText) || lan.includes('zh')) return '中文';
    if (/英文|英语|english/.test(sourceText) || lan.includes('en')) return '英文';
    if (/日文|日语|japanese/.test(sourceText) || lan.includes('ja') || lan.includes('jp')) return '日文';
    if (/韩文|韩语|korean/.test(sourceText) || lan.includes('ko')) return '韩文';

    return sourceText.replace(/自动生成|字幕|\(AI\)|AI/g, '').trim() || sourceText || lan || '字幕';
  }

  function getSubtitleTrackLanguageCode(track) {
    const byCode = normalizeWhisperLanguageCode(track?.lan);
    if (byCode !== 'unknown') return byCode;

    return normalizeWhisperLanguageCode(getSubtitleLanguageName(track));
  }

  function normalizeWhisperLanguageCode(language) {
    if (!language) return 'unknown';

    const normalized = String(language)
      .trim()
      .toLowerCase()
      .replace(/^<\|/, '')
      .replace(/\|>$/, '')
      .replace(/^language:/, '')
      .replace(/^lang:/, '');

    const aliasMap = {
      chinese: 'zh',
      mandarin: 'zh',
      cmn: 'zh',
      yue: 'zh',
      cantonese: 'zh',
      中文: 'zh',
      english: 'en',
      英文: 'en',
      英语: 'en',
      japanese: 'ja',
      日文: 'ja',
      日语: 'ja',
      jp: 'ja',
      korean: 'ko',
      韩文: 'ko',
      韩语: 'ko',
      kr: 'ko',
    };

    const mapped = aliasMap[normalized] || normalized;
    if (mapped.startsWith('zh')) return 'zh';
    if (mapped.startsWith('en')) return 'en';
    if (mapped.startsWith('ja')) return 'ja';
    if (mapped.startsWith('ko')) return 'ko';
    if (/^[a-z]{2,3}$/.test(mapped)) return mapped;
    return 'unknown';
  }

  function isChineseTranscriptionLanguage(language) {
    return normalizeWhisperLanguageCode(language) === 'zh';
  }

  function getTranscriptionLanguageName(language) {
    const normalized = normalizeWhisperLanguageCode(language);
    const languageNames = {
      zh: '中文',
      en: '英文',
      ja: '日文',
      ko: '韩文',
      fr: '法文',
      de: '德文',
      es: '西班牙文',
      ru: '俄文',
      it: '意大利文',
      pt: '葡萄牙文',
    };

    return languageNames[normalized] || '未知';
  }

  function getTranscribedLanguageName(video) {
    return video?.transcribedLanguageName || getTranscriptionLanguageName(video?.transcribedLanguage);
  }

  function sanitizeLanguageSuffix(languageName) {
    return String(languageName || '字幕').replace(/[\\/:*?"<>|]/g, '_').trim() || '字幕';
  }

  function ensureSubtitleSelection(video) {
    if (!hasSubtitleTracks(video)) return [];

    const validTrackIds = video.subtitleTracks.map((track, index) => getSubtitleTrackId(track, index));
    const selectedTrackIds = Array.isArray(video.selectedSubtitleTrackIds)
      ? video.selectedSubtitleTrackIds.filter((trackId) => validTrackIds.includes(String(trackId)))
      : [];

    if (selectedTrackIds.length === 0) {
      selectedTrackIds.push(validTrackIds[0]);
    }

    video.selectedSubtitleTrackIds = selectedTrackIds;
    return selectedTrackIds;
  }

  function getSelectedSubtitleTracks(video) {
    if (!hasSubtitleTracks(video)) return [];
    const selectedTrackIds = ensureSubtitleSelection(video);
    return video.subtitleTracks.filter((track, index) => selectedTrackIds.includes(getSubtitleTrackId(track, index)));
  }

  function isAllSubtitleTracksSelected(video) {
    return hasSubtitleTracks(video) && ensureSubtitleSelection(video).length === video.subtitleTracks.length;
  }

  function getSubtitleLanguageDisplayText(video) {
    if (!hasSubtitleTracks(video)) return '无';

    const selectedTracks = getSelectedSubtitleTracks(video);
    if (selectedTracks.length === video.subtitleTracks.length && video.subtitleTracks.length > 1) return '全部';
    if (selectedTracks.length === 1) return getSubtitleLanguageName(selectedTracks[0]);
    return `已选 ${selectedTracks.length} 项`;
  }

  function getSubtitleLanguageCellHtml(video, index) {
    if (isTranscribedSubtitle(video)) {
      return `<span class="transcribed-language-badge">${escapeHtml(getTranscribedLanguageName(video))}</span>`;
    }

    if (!hasSubtitleTracks(video)) {
      return '<span style="color: #666;">无</span>';
    }

    ensureSubtitleSelection(video);

    if (video.subtitleTracks.length === 1) {
      return `<span style="color: #333;">${escapeHtml(getSubtitleLanguageName(video.subtitleTracks[0]))}</span>`;
    }

    return `
      <div class="subtitle-language-select" data-index="${index}">
        <button class="subtitle-language-trigger" type="button" data-index="${index}">
          <span>${escapeHtml(getSubtitleLanguageDisplayText(video))}</span>
          <span>▾</span>
        </button>
      </div>
    `;
  }

  function closeSubtitleLanguageMenu() {
    if (activeSubtitleLanguageMenu) {
      activeSubtitleLanguageMenu.element.remove();
      activeSubtitleLanguageMenu.trigger?.closest('.subtitle-language-select')?.classList.remove('open');
      activeSubtitleLanguageMenu = null;
    }
  }

  function getSubtitleLanguageMenuHtml(video, index) {
    const selectedTrackIds = video.selectedSubtitleTrackIds || [];
    const allSelected = isAllSubtitleTracksSelected(video);
    const optionsHtml = video.subtitleTracks
      .map((track, trackIndex) => {
        const trackId = getSubtitleTrackId(track, trackIndex);
        const checked = selectedTrackIds.includes(trackId) ? 'checked' : '';
        return `
          <label class="subtitle-language-option">
            <input type="checkbox" class="subtitle-language-option-input" data-index="${index}" data-track-id="${escapeHtml(
              trackId,
            )}" ${checked}>
            <span>${escapeHtml(getSubtitleLanguageName(track))}</span>
          </label>
        `;
      })
      .join('');

    return `
      <label class="subtitle-language-option">
        <input type="checkbox" class="subtitle-language-all-input" data-index="${index}" ${allSelected ? 'checked' : ''}>
        <span>全部</span>
      </label>
      ${optionsHtml}
    `;
  }

  function positionSubtitleLanguageMenu(trigger, menu) {
    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const viewportPadding = 8;
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2 - menuWidth / 2;

    if (top + menuHeight > window.innerHeight - viewportPadding && rect.top > menuHeight + gap) {
      top = rect.top - menuHeight - gap;
    }

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuWidth - viewportPadding));
    top = Math.max(viewportPadding, top);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function refreshSubtitleLanguageTrigger(index) {
    document
      .querySelector(`.subtitle-language-trigger[data-index="${index}"] span:first-child`)
      ?.replaceChildren(document.createTextNode(getSubtitleLanguageDisplayText(videoList[index])));
  }

  function refreshSubtitleLanguageActionState(index) {
    const video = videoList[index];
    const copyButton = document.querySelector(`.copy-row-btn[data-index="${index}"]`);
    if (!video || !copyButton) return;

    copyButton.disabled = !canCopyVideoSubtitle(video);
    copyButton.title = getCopyButtonTitle(video);
  }

  function refreshSubtitleLanguageMenu(index) {
    if (!activeSubtitleLanguageMenu) return;
    const video = videoList[index];
    if (!video || !hasSubtitleTracks(video)) return;

    activeSubtitleLanguageMenu.element.innerHTML = getSubtitleLanguageMenuHtml(video, index);
    bindSubtitleLanguageMenuEvents(activeSubtitleLanguageMenu.element, index);
    positionSubtitleLanguageMenu(activeSubtitleLanguageMenu.trigger, activeSubtitleLanguageMenu.element);
  }

  function setAllSubtitleLanguageSelection(index, checked) {
    const video = videoList[index];
    if (!video || !hasSubtitleTracks(video)) return;

    if (checked) {
      video.selectedSubtitleTrackIds = video.subtitleTracks.map((track, trackIndex) =>
        getSubtitleTrackId(track, trackIndex),
      );
    } else {
      video.selectedSubtitleTrackIds = [getSubtitleTrackId(video.subtitleTracks[0], 0)];
    }

    refreshSubtitleLanguageTrigger(index);
    refreshSubtitleLanguageActionState(index);
    refreshSubtitleLanguageMenu(index);
  }

  function setSubtitleLanguageSelection(index, trackId, checked) {
    const video = videoList[index];
    if (!video || !hasSubtitleTracks(video)) return;

    const currentSelection = ensureSubtitleSelection(video);
    if (checked) {
      video.selectedSubtitleTrackIds = Array.from(new Set([...currentSelection, trackId]));
    } else {
      const nextSelection = currentSelection.filter((selectedTrackId) => selectedTrackId !== trackId);
      video.selectedSubtitleTrackIds = nextSelection.length > 0 ? nextSelection : currentSelection;
    }

    refreshSubtitleLanguageTrigger(index);
    refreshSubtitleLanguageActionState(index);
    refreshSubtitleLanguageMenu(index);
  }

  function bindSubtitleLanguageMenuEvents(menu, index) {
    menu.querySelector('.subtitle-language-all-input')?.addEventListener('change', function () {
      setAllSubtitleLanguageSelection(index, this.checked);
    });

    menu.querySelectorAll('.subtitle-language-option-input').forEach((input) => {
      input.addEventListener('change', function () {
        setSubtitleLanguageSelection(index, this.getAttribute('data-track-id'), this.checked);
      });
    });
  }

  function openSubtitleLanguageMenu(index, trigger) {
    const video = videoList[index];
    if (!video || !hasSubtitleTracks(video)) return;

    closeSubtitleLanguageMenu();

    const menu = document.createElement('div');
    menu.className = 'subtitle-language-menu';
    menu.innerHTML = getSubtitleLanguageMenuHtml(video, index);
    menu.addEventListener('click', (event) => event.stopPropagation());
    document.body.appendChild(menu);

    positionSubtitleLanguageMenu(trigger, menu);
    trigger.closest('.subtitle-language-select')?.classList.add('open');
    activeSubtitleLanguageMenu = { element: menu, trigger };
    bindSubtitleLanguageMenuEvents(menu, index);
  }

  function canCopyVideoSubtitle(video) {
    if (!hasSubtitleContent(video)) return false;
    if (hasSubtitleTracks(video)) return getSelectedSubtitleTracks(video).length === 1;
    return !!(video.subtitleText && video.subtitleText.trim() !== '');
  }

  function getCopyButtonTitle(video) {
    if (!hasSubtitleContent(video)) return '没有可复制的字幕内容';
    if (hasSubtitleTracks(video) && getSelectedSubtitleTracks(video).length !== 1) return '选择单个语言后可复制';
    return '复制视频脚本';
  }

  async function getSubtitleContentForTrack(video, track) {
    const trackId = getSubtitleTrackId(track, track?.index || 0);
    video.subtitleTrackContents = video.subtitleTrackContents || {};

    if (video.subtitleTrackContents[trackId]?.subtitleText) {
      return video.subtitleTrackContents[trackId];
    }

    const response = await chrome.runtime.sendMessage({
      action: 'fetchBilibiliSubtitleContent',
      cid: video.cid,
      bvid: video.bvid,
      aid: video.aid,
      track,
    });

    if (!response?.success || !response.subtitleText) {
      throw new Error(response?.message || '获取字幕内容失败');
    }

    video.subtitleTrackContents[trackId] = response;
    return response;
  }

  function setTranscribeProgressContext(currentIndex, total) {
    transcribeProgressContext = {
      currentIndex,
      total,
    };
  }

  function clearTranscribeProgressContext() {
    transcribeProgressContext = null;
  }

  function updateTranscribeProgress(localPercent, text = '转写中...') {
    if (!transcribeProgressContext || !transcribeProgressContext.total) {
      updateProgress(localPercent, text);
      return;
    }

    const { currentIndex, total } = transcribeProgressContext;
    const normalizedPercent = Math.max(0, Math.min(100, Number(localPercent) || 0));
    const basePercent = (currentIndex / total) * 100;
    const rangePercent = 100 / total;
    const overallPercent = basePercent + (normalizedPercent / 100) * rangePercent;
    const prefixedText = `当前第 ${currentIndex + 1}/${total} 个视频`;

    updateProgress(overallPercent, prefixedText);
  }

  function setTranscribeAudioButtonLoading(loading) {
    if (!transcribeAudioBtn) return;

    transcribeAudioBtn.disabled = loading;
    if (loading) {
      transcribeAudioBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="spin">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
        </svg>
        转写中...
      `;
      return;
    }

    transcribeAudioBtn.innerHTML = transcribeAudioBtnDefaultHtml;
  }

  function resolveCidFromVideoInfo(video, infoResponse) {
    const fullData = infoResponse?.full_data;
    const pages = Array.isArray(fullData?.pages) ? fullData.pages.filter((page) => page && page.cid) : [];
    const normalizedPage = Number(video?.page || 0);
    const normalizedDuration = Number(video?.duration || 0);

    if (normalizedPage > 0 && pages.length > 0) {
      const matchedPage = pages.find((page) => Number(page.page) === normalizedPage);
      if (matchedPage?.cid) {
        console.log(`按分P页码匹配到 CID: P${normalizedPage} -> ${matchedPage.cid}`);
        return matchedPage.cid;
      }
    }

    if (normalizedDuration > 0 && pages.length > 1) {
      const matchedByDuration = pages.filter((page) => Math.abs(Number(page.duration || 0) - normalizedDuration) <= 1);
      if (matchedByDuration.length === 1) {
        console.log(`按时长匹配到 CID: ${normalizedDuration}s -> ${matchedByDuration[0].cid}`);
        return matchedByDuration[0].cid;
      }
    }

    if (pages.length === 1 && pages[0].cid) {
      console.log(`单P视频，使用唯一 CID: ${pages[0].cid}`);
      return pages[0].cid;
    }

    if (pages.length === 0 && infoResponse?.cid) {
      console.log(`无 pages 数据，回退使用响应 CID: ${infoResponse.cid}`);
      return infoResponse.cid;
    }

    if (pages.length > 1) {
      console.warn('多P视频缺少精确定位信息，拒绝盲选第一个 CID 以避免转错音频:', {
        title: video?.title,
        bvid: video?.bvid,
        page: video?.page,
        duration: video?.duration,
        pages: pages.map((page) => ({ page: page.page, cid: page.cid, duration: page.duration })),
      });
    }

    return null;
  }

  async function ensureVideoCid(video) {
    if (!video?.bvid) return false;
    if (video.cid) return true;

    try {
      const infoResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'fetchBilibiliInfo',
            videoId: video.bvid,
          },
          resolve,
        );
      });

      if (infoResponse && infoResponse.success) {
        const resolvedCid = resolveCidFromVideoInfo(video, infoResponse);
        if (!resolvedCid) {
          return false;
        }

        video.cid = resolvedCid;
        if (infoResponse.aid) {
          video.aid = infoResponse.aid;
        }
        if (Array.isArray(infoResponse.tags)) {
          video.tags = infoResponse.tags.filter(Boolean);
        }
        return true;
      }
    } catch (error) {
      console.error(`补全视频 ${video.title} 的 CID 失败:`, error);
    }

    return false;
  }

  async function refreshVideoExecutionInfo(video, options = {}) {
    const { allowFallbackCid = true } = options;

    if (!video?.bvid) {
      return { success: false, message: '缺少必要参数bvid' };
    }

    try {
      const infoResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'fetchBilibiliInfo',
            videoId: video.bvid,
          },
          resolve,
        );
      });

      if (infoResponse && infoResponse.success) {
        const resolvedCid = resolveCidFromVideoInfo(video, infoResponse);
        if (resolvedCid) {
          video.cid = resolvedCid;
        } else if (allowFallbackCid && infoResponse.cid) {
          video.cid = infoResponse.cid;
        }

        if (infoResponse.aid) {
          video.aid = infoResponse.aid;
        }
        if (Array.isArray(infoResponse.tags)) {
          video.tags = infoResponse.tags.filter(Boolean);
        }

        video.isChargeExclusive = !!infoResponse.isChargeExclusive;
        video.blockReason = infoResponse.blockReason;

        return {
          success: true,
          info: infoResponse,
          isChargeExclusive: !!infoResponse.isChargeExclusive,
        };
      }

      return {
        success: false,
        info: infoResponse,
        isChargeExclusive: false,
      };
    } catch (error) {
      console.error(`刷新视频 ${video.title} 的执行信息失败:`, error);
      return {
        success: false,
        message: error.message || '获取视频信息失败',
        isChargeExclusive: false,
      };
    }
  }

  async function getCurrentBilibiliVideoTab() {
    const activeTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeBilibiliTab = activeTabs.find((tab) => tab.url && /https?:\/\/([^/]+\.)?bilibili\.com\//.test(tab.url));
    if (activeBilibiliTab) {
      return activeBilibiliTab;
    }

    const bilibiliTabs = await chrome.tabs.query({
      url: '*://*.bilibili.com/*',
      currentWindow: true,
    });
    if (bilibiliTabs.length > 0) {
      return bilibiliTabs[0];
    }

    const globalActiveTabs = await chrome.tabs.query({ active: true });
    const globalActiveBilibiliTab = globalActiveTabs.find(
      (tab) => tab.url && /https?:\/\/([^/]+\.)?bilibili\.com\//.test(tab.url),
    );
    if (globalActiveBilibiliTab) {
      return globalActiveBilibiliTab;
    }

    const globalBilibiliTabs = await chrome.tabs.query({
      url: '*://*.bilibili.com/*',
    });
    return globalBilibiliTabs.length > 0 ? globalBilibiliTabs[0] : null;
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

  // 从URL中提取合集信息 (mid和season_id)
  function parseCollectionUrl(url) {
    // 匹配格式: https://space.bilibili.com/521041866/lists/4337438?type=season
    const regex = /space\.bilibili\.com\/(\d+)\/lists\/(\d+)/;
    const match = url.match(regex);
    if (match && match.length >= 3) {
      return {
        mid: match[1],
        season_id: match[2],
      };
    }
    return null;
  }

  function parseSearchPageUrl(url) {
    try {
      const parsedUrl = new URL(url);
      if (!/search\.bilibili\.com$/i.test(parsedUrl.hostname)) {
        return null;
      }

      if (!/^\/(all|video)\/?$/i.test(parsedUrl.pathname)) {
        return null;
      }

      const keyword = parsedUrl.searchParams.get('keyword')?.trim();
      if (!keyword) {
        return null;
      }

      const allowedOrders = new Set(['totalrank', 'click', 'pubdate', 'dm', 'stow', 'scores']);
      const parsedPage = parseInt(parsedUrl.searchParams.get('page') || '1', 10);
      const order = (parsedUrl.searchParams.get('order') || 'totalrank').trim().toLowerCase();

      return {
        keyword,
        order: allowedOrders.has(order) ? order : 'totalrank',
        page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
        rawUrl: parsedUrl.toString(),
      };
    } catch (error) {
      console.warn('解析搜索页面地址失败:', error);
      return null;
    }
  }

  const htmlEntityDecoder = document.createElement('textarea');

  function sanitizeSearchResultText(text) {
    if (text === null || text === undefined) return '';
    const strippedText = String(text).replace(/<[^>]+>/g, '');
    htmlEntityDecoder.innerHTML = strippedText;
    return htmlEntityDecoder.value.replace(/\s+/g, ' ').trim();
  }

  function parseSearchDuration(duration) {
    if (typeof duration === 'number' && Number.isFinite(duration) && duration >= 0) {
      return duration;
    }

    if (typeof duration !== 'string') return 0;

    const parts = duration
      .split(':')
      .map((part) => parseInt(part, 10))
      .filter((part) => Number.isFinite(part));

    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
  }

  function processAndAddSearchVideosToTable(videos) {
    if (!Array.isArray(videos) || videos.length === 0) {
      console.error('无效的搜索结果数据');
      return 0;
    }

    let addedCount = 0;

    videos.forEach((video) => {
      const bvid = video.bvid || extractBilibiliVideoId(video.arcurl || '');
      const aidMatch = typeof video.arcurl === 'string' ? video.arcurl.match(/\/video\/av(\d+)/i) : null;
      const aid = video.aid || video.id || (aidMatch ? parseInt(aidMatch[1], 10) : 0);

      if (!bvid && !aid) {
        console.warn('搜索结果缺少可识别的视频 ID，已跳过:', video);
        return;
      }

      const existingVideo = videoList.find(
        (item) => (bvid && item.bvid === bvid) || (aid && String(item.aid) === String(aid)),
      );
      if (existingVideo) {
        return;
      }

      const formattedVideo = {
        id: bvid || aid || `${Date.now()}-${Math.random()}`,
        bvid: bvid || '',
        aid: aid || 0,
        cid: 0,
        title: sanitizeSearchResultText(video.title) || '未知标题',
        author: sanitizeSearchResultText(video.author || video.up_name) || '未知作者',
        publishDate: video.pubdate || 0,
        subtitleStatus: '未获取',
        subtitleText: null,
        view_count: video.play || 0,
        like_count: video.favorites || 0,
        mid: video.mid || video.author_mid || 0,
        duration: parseSearchDuration(video.duration),
      };

      if (addVideoToTable(formattedVideo, false)) {
        addedCount++;
      }
    });

    if (addedCount > 0) {
      updateVideoTable();
    }

    return addedCount;
  }

  async function fetchSearchPageVideos(searchInfo) {
    console.log('开始获取搜索页面视频:', searchInfo);

    getFavoriteBtn.disabled = true;
    getFavoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="spin">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
        获取中
      `;

    showSuccess('正在获取搜索页面视频，请稍候...');

    try {
      const response = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('请求超时，background.js没有及时响应'));
        }, 15000);

        chrome.runtime.sendMessage(
          {
            action: 'fetchSearchVideoList',
            keyword: searchInfo.keyword,
            order: searchInfo.order,
            page: searchInfo.page,
          },
          (response) => {
            clearTimeout(timeoutId);
            const error = chrome.runtime.lastError;
            if (error) {
              reject(error);
              return;
            }
            resolve(response);
          },
        );
      });

      if (response && response.success && response.data) {
        const medias = response.data.medias || [];
        if (medias.length === 0) {
          showError('当前搜索页面没有可添加的视频');
          return;
        }

        const addedCount = processAndAddSearchVideosToTable(medias);
        if (addedCount > 0) {
          showSuccess(`成功添加 ${addedCount} 个搜索结果视频到表格`);
        } else {
          showSuccess('当前搜索结果视频已全部在表格中');
        }
        return;
      }

      showError(response?.message || '获取搜索页面视频失败');
    } catch (error) {
      console.error('获取搜索页面视频出错:', error);
      showError('获取搜索页面视频失败: ' + (error.message || '未知错误'));
    } finally {
      getFavoriteBtn.disabled = false;
      getFavoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        获取视频
      `;
    }
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

            // 增加解析次数统计
            checkAndIncrementExtractCount(1);

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
      await ensureVideoExportMetadata(currentVideoInfo);
      const finalText = prependVideoInfoText(subtitleText, currentVideoInfo);
      const blob = new Blob([finalText], { type: 'text/plain;charset=utf-8' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);

      // 创建一个临时的<a>元素用于下载
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      const safeTitle = (currentVideoInfo?.title || 'subtitle').replace(/[\\/:*?"<>|]/g, '_');
      const safeAuthor = (currentVideoInfo?.author || 'unknown').replace(/[\\/:*?"<>|]/g, '_');

      // 格式化发布日期
      let formattedDate = '';
      if (currentVideoInfo?.publishDate) {
        const d = formatDate(currentVideoInfo.publishDate);
        if (d && d !== '-') {
          formattedDate = d;
        }
      }

      downloadLink.download = buildFileName(safeAuthor, safeTitle, formattedDate, 'txt');
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
    const url = urlInput.value.trim();
    if (!url) {
      showError('请先填写地址！');
      return '';
    }

    return url;
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
  // 清空地址输入框
  document.querySelector('#urlInput + .clear-btn').addEventListener('click', () => {
    urlInput.value = '';
    resetVideoInfo();
    // 清空后自动聚焦输入框
    urlInput.focus();
  });

  // 自定义下拉框点击显示/隐藏下拉列表
  urlTypeTrigger.addEventListener('click', function (e) {
    e.stopPropagation();
    this.classList.toggle('active');
    urlTypeDropdown.classList.toggle('active');
  });

  // 支持触摸事件
  urlTypeTrigger.addEventListener('touchend', function (e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.toggle('active');
    urlTypeDropdown.classList.toggle('active');
  });

  // 点击页面其他部分关闭下拉框
  document.addEventListener('click', function () {
    urlTypeTrigger.classList.remove('active');
    urlTypeDropdown.classList.remove('active');
  });

  document.addEventListener('touchend', function () {
    urlTypeTrigger.classList.remove('active');
    urlTypeDropdown.classList.remove('active');
  });

  // 下拉选项点击事件
  urlTypeOptions.forEach(function (option) {
    option.addEventListener('click', function (e) {
      e.stopPropagation();

      // 更新当前选中值
      currentUrlType = this.getAttribute('data-value');

      // 获取选项中的SVG图标
      const iconSvg = this.querySelector('.option-icon').cloneNode(true);

      // 更新选中文本和图标
      urlTypeSelectedText.textContent = this.textContent.trim();

      // 替换触发器中的图标
      const triggerIcon = urlTypeTrigger.querySelector('.option-icon');
      triggerIcon.innerHTML = iconSvg.innerHTML;

      // 更新选中状态
      urlTypeOptions.forEach((opt) => opt.classList.remove('selected'));
      this.classList.add('selected');

      // 根据类型显示不同按钮
      if (currentUrlType === 'video') {
        generateUrlBtn.style.display = 'block';
        getFavoriteBtn.style.display = 'none';
        urlInput.placeholder = '请输入B站单个视频地址';
      } else if (currentUrlType === 'search') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站搜索页面地址';
      } else if (currentUrlType === 'favorite') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站收藏夹地址';
      } else if (currentUrlType === 'collection') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站合集地址';
      } else if (currentUrlType === 'user') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站个人主页地址';
      } else if (currentUrlType === 'selection') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站视频选集地址 (含分P)';
      }

      // 关闭下拉框
      urlTypeTrigger.classList.remove('active');
      urlTypeDropdown.classList.remove('active');
    });

    // 同样更新触摸事件处理
    option.addEventListener('touchend', function (e) {
      e.stopPropagation();
      e.preventDefault();

      // 更新当前选中值
      currentUrlType = this.getAttribute('data-value');

      // 获取选项中的SVG图标
      const iconSvg = this.querySelector('.option-icon').cloneNode(true);

      // 更新选中文本和图标
      urlTypeSelectedText.textContent = this.textContent.trim();

      // 替换触发器中的图标
      const triggerIcon = urlTypeTrigger.querySelector('.option-icon');
      triggerIcon.innerHTML = iconSvg.innerHTML;

      // 更新选中状态
      urlTypeOptions.forEach((opt) => opt.classList.remove('selected'));
      this.classList.add('selected');

      // 根据类型显示不同按钮
      if (currentUrlType === 'video') {
        generateUrlBtn.style.display = 'block';
        getFavoriteBtn.style.display = 'none';
        urlInput.placeholder = '请输入B站视频地址';
      } else if (currentUrlType === 'search') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站搜索页面地址';
      } else if (currentUrlType === 'favorite') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站收藏夹地址';
      } else if (currentUrlType === 'collection') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站合集地址';
      } else if (currentUrlType === 'user') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站个人主页地址';
      } else if (currentUrlType === 'selection') {
        generateUrlBtn.style.display = 'none';
        getFavoriteBtn.style.display = 'block';
        urlInput.placeholder = '请输入B站视频地址 (含分P)';
      }

      // 关闭下拉框
      urlTypeTrigger.classList.remove('active');
      urlTypeDropdown.classList.remove('active');
    });
  });

  // 获取当前页面地址按钮
  getPageUrlBtn.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTabUrl' });
      if (response?.url) {
        urlInput.value = response.url;
        resetVideoInfo();
        showSuccess('已获取当前页面地址');
      }
    } catch (error) {
      console.error('获取URL失败:', error);
      showError('获取地址失败，请重试');
    }
  });

  // Cookie 处理函数
  function updateCookieInputControls() {
    const hasCookieValue = Boolean(bilibiliCookieInput.value.trim());

    cookieInputWrapper?.classList.toggle('has-cookie-value', hasCookieValue);

    if (!hasCookieValue) {
      bilibiliCookieInput.type = 'password';
      cookieVisibilityBtn?.classList.remove('is-visible');
      cookieVisibilityBtn?.setAttribute('aria-label', '显示 Cookie');
      cookieVisibilityBtn?.setAttribute('title', '显示 Cookie');
    }
  }

  function setCookie() {
    updateCookieInputControls();

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

  // Cookie 默认隐藏，必要时允许用户临时查看。
  cookieVisibilityBtn?.addEventListener('click', () => {
    if (!bilibiliCookieInput.value.trim()) {
      updateCookieInputControls();
      return;
    }

    const shouldShowCookie = bilibiliCookieInput.type === 'password';

    bilibiliCookieInput.type = shouldShowCookie ? 'text' : 'password';
    cookieVisibilityBtn.classList.toggle('is-visible', shouldShowCookie);
    cookieVisibilityBtn.setAttribute('aria-label', shouldShowCookie ? '隐藏 Cookie' : '显示 Cookie');
    cookieVisibilityBtn.setAttribute('title', shouldShowCookie ? '隐藏 Cookie' : '显示 Cookie');
    bilibiliCookieInput.focus();
  });

  // 为Cookie输入框添加input事件监听器，当用户输入内容时自动保存
  bilibiliCookieInput.addEventListener('input', setCookie);
  updateCookieInputControls();

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

    // 获取URL
    const url = urlInput.value.trim();
    if (!url) {
      showError('请先填写视频地址！');
      return;
    }

    // 重置当前视频信息和字幕数据
    currentVideoInfo = null;
    currentSubtitleData = null;

    // 如果是B站视频链接，获取视频信息
    if (isBilibiliUrl(url)) {
      const videoInfo = await fetchBilibiliVideoInfo(url);
      if (videoInfo && videoInfo.success) {
        // 添加到表格
        addVideoToTable(videoInfo);
      }
    } else {
      showError('不是B站视频链接，无法添加');
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

  // 为解析收藏夹地址按钮添加事件监听
  if (getFavoriteBtn) {
    getFavoriteBtn.addEventListener('click', async () => {
      const inputUrl = urlInput.value.trim();

      if (currentUrlType === 'search') {
        if (!inputUrl) {
          showError('请输入B站搜索页面地址');
          urlInput.focus();
          return;
        }

        const searchInfo = parseSearchPageUrl(inputUrl);
        if (!searchInfo) {
          showError('无法识别的搜索页面地址，请检查格式');
          return;
        }

        await fetchSearchPageVideos(searchInfo);
        return;
      }

      // 处理用户主页地址
      if (currentUrlType === 'user') {
        if (!inputUrl) {
          showError('请输入B站个人主页地址');
          urlInput.focus();
          return;
        }

        const mid = parseUserUrl(inputUrl);
        if (!mid) {
          showError('无法识别的用户主页地址，请检查格式');
          return;
        }

        await fetchUserVideos(mid);
        return;
      }

      // 处理合集地址
      if (currentUrlType === 'collection') {
        if (!inputUrl) {
          showError('请输入B站合集地址');
          urlInput.focus();
          return;
        }

        const collectionInfo = parseCollectionUrl(inputUrl);
        if (!collectionInfo) {
          showError('无法识别的合集地址，请检查格式');
          return;
        }

        await fetchCollectionVideos(collectionInfo.mid, collectionInfo.season_id);
        return;
      }

      // 处理视频选集
      if (currentUrlType === 'selection') {
        if (!inputUrl) {
          showError('请输入B站视频地址');
          urlInput.focus();
          return;
        }

        const videoId = extractBilibiliVideoId(inputUrl);
        if (!videoId) {
          showError('无法识别的视频地址，请检查格式');
          return;
        }

        await fetchVideoParts(videoId);
        return;
      }

      // 处理收藏夹地址
      const favoriteUrl = inputUrl;
      if (!favoriteUrl) {
        showError('请输入B站收藏夹地址');
        urlInput.focus();
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
      getFavoriteBtn.disabled = true;
      getFavoriteBtn.innerHTML = `
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
        getFavoriteBtn.disabled = false;
        getFavoriteBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          获取视频
        `;
      }
    });
  }

  // 获取合集视频列表
  async function fetchCollectionVideos(mid, season_id) {
    console.log(`开始获取合集视频: mid=${mid}, season_id=${season_id}`);

    // 禁用按钮并显示加载状态
    getFavoriteBtn.disabled = true;
    getFavoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="spin">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
        获取中
      `;

    showSuccess('正在获取合集内容，请稍候...');

    try {
      let allVideos = [];
      let hasMore = true;
      let currentPage = 1;
      const pageSize = 30;

      while (hasMore) {
        showSuccess(`正在获取第${currentPage}页合集内容...`);
        console.log(`获取合集第${currentPage}页，每页${pageSize}条`);

        const response = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('请求超时，background.js没有及时响应'));
          }, 15000);

          chrome.runtime.sendMessage(
            {
              action: 'fetchCollectionList',
              mid: mid,
              season_id: season_id,
              page: currentPage,
              pageSize: pageSize,
            },
            (response) => {
              clearTimeout(timeoutId);
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

        if (response && response.success && response.data) {
          console.log(`第${currentPage}页合集数据:`, response.data);

          const archives = response.data.archives || [];
          if (archives.length > 0) {
            allVideos = allVideos.concat(archives);
            console.log(`当前已获取${allVideos.length}个视频`);
            showSuccess(`已获取${allVideos.length}个视频 (第${currentPage}页)`);
          }

          const pageInfo = response.data.page;
          if (pageInfo) {
            if (allVideos.length < pageInfo.total) {
              currentPage++;
              await new Promise((resolve) => setTimeout(resolve, 300));
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }

          if (archives.length === 0) {
            hasMore = false;
          }
        } else {
          const errorMsg = response?.message || '获取合集内容失败';
          showError(errorMsg);
          console.error('获取合集失败:', response);
          break;
        }
      }

      if (allVideos.length > 0) {
        showSuccess(`成功获取合集内容，共${allVideos.length}个视频`);
        console.log('完整合集内容:', allVideos);

        const addedCount = await processAndAddCollectionVideosToTable(allVideos, mid);

        if (addedCount > 0) {
          showSuccess(`成功添加${addedCount}个视频到表格`);
        } else {
          showError('没有找到可添加的视频');
        }
      } else {
        showError('合集中没有视频');
      }
    } catch (error) {
      console.error('获取合集出错:', error);
      showError('获取合集内容失败: ' + (error.message || '未知错误'));
    } finally {
      getFavoriteBtn.disabled = false;
      getFavoriteBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          获取视频
        `;
    }
  }

  // 处理合集视频并添加到表格
  async function processAndAddCollectionVideosToTable(videos, collectionMid) {
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      console.error('无效的视频数据');
      return 0;
    }

    let addedCount = 0;
    let authorName = '未知作者';

    // 如果有合集MID，尝试获取UP主信息
    if (collectionMid) {
      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'fetchUserCard', mid: collectionMid, photo: true }, resolve);
        });

        if (response && response.success && response.data && response.data.card) {
          authorName = response.data.card.name || '未知作者';
          console.log('获取到合集UP主名称:', authorName);
        }
      } catch (error) {
        console.error('获取合集UP主信息失败:', error);
      }
    }

    videos.forEach((video) => {
      // 检查是否已存在相同的视频
      const existingVideo = videoList.find(
        (v) => (video.bvid && v.bvid === video.bvid) || (video.aid && v.aid === video.aid),
      );

      if (!existingVideo) {
        console.log('222', video);

        const formattedVideo = {
          id: video.bvid || video.aid || Date.now().toString(),
          bvid: video.bvid,
          aid: video.aid,
          cid: video.cid || 0, // 如果没有cid，后续需要获取
          title: video.title,
          author: authorName, // 使用获取到的UP主名称
          publishDate: video.pubdate || video.pubtime || video.ctime || video.created || 0,
          subtitleStatus: '未获取',
          subtitleText: null,
          view_count: video.stat?.view || 0,
          like_count: video.stat?.like || 0,
          mid: collectionMid || video.owner?.mid || 0,
        };

        addVideoToTable(formattedVideo);
        addedCount++;
      }
    });

    return addedCount;
  }

  // 获取视频分P列表
  async function fetchVideoParts(videoId) {
    console.log(`开始获取视频分P: ${videoId}`);

    // 禁用按钮并显示加载状态
    getFavoriteBtn.disabled = true;
    getFavoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="spin">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
        获取中
      `;

    showSuccess('正在获取视频信息和分P列表...');

    try {
      // 1. 获取主视频信息以获得标题等元数据
      const videoUrl = `https://www.bilibili.com/video/${videoId}`;
      const mainVideoInfo = await fetchBilibiliVideoInfo(videoUrl);

      if (!mainVideoInfo || !mainVideoInfo.success) {
        throw new Error('无法获取主视频信息');
      }

      // 2. 获取分P列表
      const response = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('请求超时，background.js没有及时响应'));
        }, 15000);

        chrome.runtime.sendMessage(
          {
            action: 'fetchVideoParts',
            videoId: videoId,
          },
          (response) => {
            clearTimeout(timeoutId);
            const error = chrome.runtime.lastError;
            if (error) {
              reject(error);
              return;
            }
            resolve(response);
          },
        );
      });

      if (response && response.success && response.data) {
        console.log('获取到分P列表:', response.data);
        const parts = response.data;

        if (parts && parts.length > 0) {
          showSuccess(`成功获取${parts.length}个分P视频`);
          const addedCount = processAndAddVideoPartsToTable(parts, mainVideoInfo);
          if (addedCount > 0) {
            showSuccess(`成功添加${addedCount}个分P视频到表格`);
          } else {
            showError('没有找到可添加的视频或视频已存在');
          }
        } else {
          showError('该视频没有分P信息');
        }
      } else {
        throw new Error(response?.message || '获取分P列表失败');
      }
    } catch (error) {
      console.error('获取视频分P出错:', error);
      showError('获取分P失败: ' + (error.message || '未知错误'));
    } finally {
      // 恢复按钮状态
      getFavoriteBtn.disabled = false;
      getFavoriteBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          获取视频
        `;
    }
  }

  // 处理分P视频并添加到表格
  function processAndAddVideoPartsToTable(parts, mainVideoInfo) {
    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return 0;
    }

    let addedCount = 0;

    parts.forEach((part) => {
      // 构造唯一ID
      const uniqueId = `${mainVideoInfo.bvid}_${part.cid}`;

      // 检查是否已存在
      const existingVideo = videoList.find((v) => v.id === uniqueId || v.cid === part.cid);

      if (!existingVideo) {
        const formattedVideo = {
          id: uniqueId,
          bvid: mainVideoInfo.bvid,
          aid: mainVideoInfo.aid,
          cid: part.cid,
          // 标题格式：主标题 - Px 分P标题
          title: `${mainVideoInfo.title} - P${part.page}【${part.part}】`,
          author: mainVideoInfo.author,
          publishDate: mainVideoInfo.publishDate,
          subtitleStatus: '未获取',
          subtitleText: null,
          view_count: mainVideoInfo.view_count, // 使用主视频数据
          like_count: mainVideoInfo.like_count,
          mid: mainVideoInfo.mid,
          duration: part.duration,
          page: part.page, // 保存分P页码
        };

        // 批量添加时不更新UI，最后统一更新
        if (addVideoToTable(formattedVideo, false)) {
          addedCount++;
        }
      }
    });

    // 如果有添加视频，统一更新UI
    if (addedCount > 0) {
      updateVideoTable();
    }

    return addedCount;
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
            publishDate: video.pubdate || video.pubtime || video.ctime || video.created || 0,
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

  // 从URL中提取用户mid
  function parseUserUrl(url) {
    // 匹配格式: https://space.bilibili.com/521041866
    const regex = /space\.bilibili\.com\/(\d+)/;
    const match = url.match(regex);
    if (match && match.length >= 2) {
      return match[1];
    }
    return null;
  }

  // 获取用户主页视频列表
  async function fetchUserVideos(mid) {
    console.log(`开始获取用户视频: mid=${mid}`);

    // 禁用按钮并显示加载状态
    getFavoriteBtn.disabled = true;
    getFavoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="spin">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
        获取中
      `;

    showSuccess('正在获取用户视频内容，请稍候...');

    try {
      let allVideos = [];
      let hasMore = true;
      let currentPage = 1;
      const pageSize = 30;

      while (hasMore) {
        showSuccess(`正在获取第${currentPage}页用户视频...`);
        console.log(`获取用户视频第${currentPage}页，每页${pageSize}条`);

        const response = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('请求超时，background.js没有及时响应'));
          }, 15000);

          chrome.runtime.sendMessage(
            {
              action: 'fetchUserVideoList',
              mid: mid,
              page: currentPage,
              pageSize: pageSize,
            },
            (response) => {
              clearTimeout(timeoutId);
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

        if (response && response.success && response.data) {
          console.log(`第${currentPage}页用户视频数据:`, response.data);

          const medias = response.data.medias || [];
          if (medias.length > 0) {
            allVideos = allVideos.concat(medias);
            console.log(`当前已获取${allVideos.length}个视频`);
            showSuccess(`已获取${allVideos.length}个视频 (第${currentPage}页)`);
          }

          // 根据API返回的hasMore判断
          if (response.hasMore === false) {
            hasMore = false;
          } else {
            // 如果返回的数据少于pageSize，也可以认为是最后一页
            if (medias.length < pageSize) {
              hasMore = false;
            } else {
              currentPage++;
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }

          if (medias.length === 0) {
            hasMore = false;
          }
        } else {
          const errorMsg = response?.message || '获取用户视频列表失败';
          showError(errorMsg);
          console.error('获取用户视频失败:', response);
          break;
        }
      }

      if (allVideos.length > 0) {
        showSuccess(`成功获取用户视频，共${allVideos.length}个视频`);
        console.log('完整用户视频内容:', allVideos);

        // 处理并添加到表格
        let addedCount = 0;
        allVideos.forEach((video) => {
          // 格式化视频信息
          const formattedVideo = {
            bvid: video.bvid,
            aid: video.aid,
            cid: 0, // 用户空间接口不直接返回cid，可能需要后续获取
            title: video.title,
            author: video.author,
            publishDate: video.created || video.pubdate || 0,
            subtitleStatus: '未获取',
            subtitleText: null,
            view_count: video.play || 0, // 注意字段名可能不同
            like_count: 0, // 列表可能不包含点赞数
            mid: mid,
          };

          // 如果没有cid，标记为需要获取
          // 注意：addVideoToTable 中目前没有处理cid缺失的逻辑，
          // 但 fetchSubtitleWithAid 需要cid。
          // 我们可能需要在获取字幕时动态获取cid，或者在这里尝试获取。
          // 鉴于批量处理，最好是先添加，点击获取字幕时再获取详情。
          // 或者修改 fetchBilibiliVideoInfo 逻辑来支持只用bvid/aid获取详情。

          // 暂时先添加，后续流程可能需要优化

          // 检查是否已经存在
          const existingVideo = videoList.find((v) => v.bvid === formattedVideo.bvid);
          if (!existingVideo) {
            videoList.push({
              id: formattedVideo.bvid || formattedVideo.aid || Date.now().toString() + Math.random(),
              ...formattedVideo,
            });
            addedCount++;
          }
        });

        if (addedCount > 0) {
          updateVideoTable();
          showSuccess(`成功添加 ${addedCount} 个视频到列表`);
        } else {
          showSuccess('所有视频已在列表中');
        }
      } else {
        showError('未找到任何视频');
      }
    } catch (error) {
      console.error('获取用户视频出错:', error);
      showError('获取用户视频出错: ' + error.message);
    } finally {
      // 恢复按钮状态
      getFavoriteBtn.disabled = false;
      getFavoriteBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        获取视频
      `;
    }
  }

  // 添加视频到表格
  function addVideoToTable(videoInfo, updateUI = true) {
    console.log('🚀 videoInfo:', videoInfo);
    if (!videoInfo || !videoInfo.title) {
      showError('视频信息不完整，无法添加到表格');
      return false;
    }

    // 检查是否已经存在相同的视频
    // 修改去重逻辑：如果新视频有cid，则需要bvid和cid都匹配才算重复
    // 如果没有cid，则只检查bvid
    const existingVideo = videoList.find((v) => {
      if (videoInfo.cid && v.cid) {
        return v.bvid === videoInfo.bvid && v.cid === videoInfo.cid;
      }
      return v.bvid === videoInfo.bvid;
    });

    if (existingVideo) {
      if (updateUI) showError('该视频已在表格中');
      return false;
    }

    // 创建一个包含所需信息的视频对象
    const video = {
      id: videoInfo.id || videoInfo.bvid || videoInfo.aid || Date.now().toString(),
      bvid: videoInfo.bvid,
      aid: videoInfo.aid,
      cid: videoInfo.cid,
      title: videoInfo.title,
      author: videoInfo.author,
      publishDate: videoInfo.publishDate || 0,
      tags: Array.isArray(videoInfo.tags) ? videoInfo.tags.filter(Boolean) : [],
      subtitleStatus: '未获取',
      subtitleText: null,
      view_count: videoInfo.view_count,
      like_count: videoInfo.like_count,
      mid: videoInfo.mid,
      duration: videoInfo.duration,
      page: videoInfo.page, // 保存分P页码
      transcribedLanguage: null,
      transcribedLanguageName: null,
    };

    // 添加到视频列表
    videoList.push(video);

    // 更新表格UI
    if (updateUI) {
      updateVideoTable();
      showSuccess('已添加到表格');
    }

    return true;
  }

  // 更新视频表格
  function updateVideoTable() {
    closeSubtitleLanguageMenu();

    // 清空表格内容
    videoTableBody.innerHTML = '';

    // 如果没有视频，显示空状态
    if (videoList.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="7" style="text-align: center; padding: 20px;">暂无视频，请添加视频</td>`;
      videoTableBody.appendChild(emptyRow);

      // 更新计数器显示
      document.getElementById('videoCountInfo').style.display = 'none';
      document.getElementById('totalVideoCount').textContent = '0';
      document.getElementById('completedSubtitleCount').textContent = '0';
      updateNoSubtitleBanner();
      return;
    }

    // 有视频时显示计数信息
    document.getElementById('videoCountInfo').style.display = 'inline';
    // 计算已获取字幕的视频数量
    const completedCount = videoList.filter((video) => hasSubtitleContent(video)).length;

    // 更新计数器显示
    document.getElementById('totalVideoCount').textContent = videoList.length.toString();
    document.getElementById('completedSubtitleCount').textContent = completedCount.toString();
    updateNoSubtitleBanner();

    // 遍历视频列表，为每个视频创建表格行
    videoList.forEach((video, index) => {
      const row = document.createElement('tr');

      // 根据字幕状态设置样式
      let subtitleStatusHtml = '';
      if (isSubtitleSuccessStatus(video.subtitleStatus)) {
        // 已获取状态显示为绿色并添加✅图标
        subtitleStatusHtml = `<span style="color: #52c41a; font-weight: 500;">✅ ${getSubtitleStatusDisplayText(video)}</span>`;
      } else if (video.subtitleStatus === '获取中' || video.subtitleStatus === 'AI转写中' || video.subtitleStatus === '转写中') {
        // 获取中状态显示为蓝色带动画
        const pendingStatusText = video.subtitleStatus === 'AI转写中' ? '转写中' : video.subtitleStatus;
        subtitleStatusHtml = `<span style="color: #1890ff; display: flex; align-items: center;">
          <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; margin-right: 4px; animation: spin 1.5s linear infinite;">
            <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" fill="currentColor"/>
          </svg>${pendingStatusText}</span>`;
      } else if (video.subtitleStatus === '未获取') {
        // 未获取状态显示为灰色
        subtitleStatusHtml = `<span style="color: #666;">${video.subtitleStatus}</span>`;
      } else if (
        video.subtitleStatus &&
        (video.subtitleStatus.includes('信息不完整') ||
          video.subtitleStatus.includes(CHARGE_EXCLUSIVE_BLOCK_STATUS) ||
          video.subtitleStatus.includes('无外挂字幕') ||
          video.subtitleStatus.includes('错误') ||
          video.subtitleStatus.includes('失败'))
      ) {
        // 失败状态显示为红色
        subtitleStatusHtml = `<span style="color: #ff4d4f;">${video.subtitleStatus}</span>`;
      } else {
        // 其他状态保持默认
        subtitleStatusHtml = video.subtitleStatus;
      }

      // 构建视频链接，如果有分P则添加p参数
      let videoUrl = `https://www.bilibili.com/video/${video.bvid}`;
      if (video.page && video.page > 1) {
        videoUrl += `?p=${video.page}`;
      }

      // 构建操作按钮HTML
      let actionButtonsHtml = '';
      if (hasSubtitleContent(video)) {
        const copyDisabled = canCopyVideoSubtitle(video) ? '' : 'disabled';
        actionButtonsHtml += `
          <button class="table-action-btn copy-row-btn" data-index="${index}" title="${getCopyButtonTitle(
            video,
          )}" ${copyDisabled}>
            <svg viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
        `;
      }

      actionButtonsHtml += `
          <button class="table-action-btn remove-row-btn" data-index="${index}" title="删除视频">
            <svg viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
      `;

      row.innerHTML = `
        <td>${index + 1}</td>
        <td><a href="${videoUrl}" target="_blank" title="${video.title}">${video.title}</a></td>
        <td><a href="https://space.bilibili.com/${video.mid}" target="_blank" title="${video.author}">${
          video.author
        }</a></td>
        <td style="text-align: center;">${formatDate(video.publishDate)}</td>
        <td>${subtitleStatusHtml}</td>
        <td style="text-align: center;">${getSubtitleLanguageCellHtml(video, index)}</td>
        <td>
          ${actionButtonsHtml}
        </td>
      `;
      videoTableBody.appendChild(row);
    });

    // 为表格中的按钮添加事件监听
    addTableButtonListeners();

    // 同步表头和表体的滚动
    const tableBodyContainer = document.getElementById('tableBodyContainer');
    const tableHeaderContainer = document.getElementById('tableHeaderContainer');

    if (tableBodyContainer && tableHeaderContainer) {
      // 移除旧的监听器以避免重复
      tableBodyContainer.onscroll = null;

      tableBodyContainer.addEventListener('scroll', function () {
        closeSubtitleLanguageMenu();
        tableHeaderContainer.scrollLeft = this.scrollLeft;
      });
    }
  }

  // 为表格中的按钮添加事件监听
  function addTableButtonListeners() {
    // 为复制按钮添加事件监听
    document.querySelectorAll('.copy-row-btn').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const index = parseInt(this.getAttribute('data-index'));
        if (isNaN(index) || index < 0 || index >= videoList.length) {
          showError('无效的视频索引');
          return;
        }

        const video = videoList[index];
        if (!hasSubtitleContent(video)) {
          showError('没有可复制的字幕内容');
          return;
        }

        try {
          let subtitleText = video.subtitleText;
          let subtitleLanguage = isTranscribedSubtitle(video) ? video.transcribedLanguage : null;

          if (hasSubtitleTracks(video)) {
            const selectedTracks = getSelectedSubtitleTracks(video);
            if (selectedTracks.length !== 1) {
              showError('选择单个语言后可复制');
              return;
            }

            const subtitleContent = await getSubtitleContentForTrack(video, selectedTracks[0]);
            subtitleText = subtitleContent.subtitleText;
            subtitleLanguage = getSubtitleTrackLanguageCode(selectedTracks[0]);
          }

          // 转换为TXT格式
          let txtContent = convertToTxtFormat(subtitleText, subtitleLanguage);

          // 添加视频信息前缀
          await ensureVideoExportMetadata(video);
          txtContent = prependVideoInfoText(txtContent, video);

          // 复制到剪贴板
          await navigator.clipboard.writeText(txtContent);
          showSuccess('复制成功');
        } catch (err) {
          console.error('复制失败:', err);
          showError('复制失败: ' + (err.message || '未知错误'));
        }
      });
    });

    document.querySelectorAll('.subtitle-language-trigger').forEach((btn) => {
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        const index = parseInt(this.getAttribute('data-index'));
        if (activeSubtitleLanguageMenu?.trigger === this) {
          closeSubtitleLanguageMenu();
          return;
        }
        openSubtitleLanguageMenu(index, this);
      });
    });

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

  // 格式化日期函数
  function formatDate(timestamp) {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp * 1000);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '-';
    }
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
    setTranscribeProgressReminderVisible(false);
    showProgress(true);
    updateProgress(0, '准备获取字幕...');

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const totalVideos = videoList.length;
    const needProcessVideos = videoList.filter((v) => !hasSubtitleContent(v)).length;

    showSuccess('开始批量获取字幕，请稍候...');

    // 依次处理每个视频
    for (let i = 0; i < videoList.length; i++) {
      const video = videoList[i];
      console.log(`处理第 ${i + 1}/${videoList.length} 个视频: ${video.title}`);

      // 计算当前进度百分比
      const currentPercent = Math.floor((i / totalVideos) * 100);
      updateProgress(currentPercent, '获取字幕中...');

      // 如果已经成功获取过字幕，跳过
      if (hasSubtitleContent(video)) {
        console.log(`视频 ${video.title} 已有字幕，跳过`);
        continue;
      }

      if (video.subtitleStatus === CHARGE_EXCLUSIVE_BLOCK_STATUS) {
        console.log(`视频 ${video.title} 已标记为充电专属不可获取，跳过`);
        skippedCount++;
        continue;
      }

      // 更新当前状态
      videoList[i].subtitleStatus = '获取中';
      updateVideoTable();

      try {
        const executionInfo = await refreshVideoExecutionInfo(video);
        if (executionInfo.success) {
          videoList[i].cid = video.cid;
          videoList[i].aid = video.aid;
          videoList[i].isChargeExclusive = video.isChargeExclusive;
          videoList[i].blockReason = video.blockReason;
        }

        if (executionInfo.isChargeExclusive) {
          markVideoAsChargeExclusive(videoList[i]);
          skippedCount++;
          updateVideoTable();
          continue;
        }

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

        // 获取字幕语言列表，具体字幕内容在复制或导出时按需下载。
        const response = await chrome.runtime.sendMessage({
          action: 'fetchBilibiliSubtitleTracks',
          cid: video.cid,
          bvid: video.bvid,
          aid: video.aid, // 添加aid参数，帮助后台更好地获取字幕
        });

        console.log(`获取字幕结果:`, response);

        if (response && response.success && Array.isArray(response.subtitleTracks) && response.subtitleTracks.length > 0) {
          // 更新字幕状态和内容
          videoList[i].subtitleStatus = '外挂字幕';
          videoList[i].subtitleText = null;
          videoList[i].aid = response.aid || videoList[i].aid;
          videoList[i].subtitleTracks = response.subtitleTracks;
          videoList[i].selectedSubtitleTrackIds = [getSubtitleTrackId(response.subtitleTracks[0], 0)];
          videoList[i].subtitleTrackContents = {};
          videoList[i].transcribedLanguage = null;
          videoList[i].transcribedLanguageName = null;
          successCount++;
          console.log(`视频 ${video.title} 字幕获取成功`);
        } else if (isChargeExclusiveBlockedResponse(response)) {
          markVideoAsChargeExclusive(videoList[i]);
          skippedCount++;
          console.log(`视频 ${video.title} 因充电专属限制被跳过`);
        } else {
          // 获取失败
          const errorMessage = response?.message || '未知原因';
          // videoList[i].subtitleStatus = `获取失败: ${errorMessage}`;
          videoList[i].subtitleStatus = `无外挂字幕`;
          videoList[i].subtitleText = null;
          videoList[i].subtitleTracks = [];
          videoList[i].selectedSubtitleTrackIds = [];
          videoList[i].subtitleTrackContents = {};
          videoList[i].transcribedLanguage = null;
          videoList[i].transcribedLanguageName = null;
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
    if (successCount > 0) {
      // 增加解析次数统计
      checkAndIncrementExtractCount(successCount);
    }

    const noExternalSubtitleCount = getNoExternalSubtitleCount();
    const noSubtitleFollowupText =
      noExternalSubtitleCount > 0
        ? ` ${noExternalSubtitleCount} 个视频无外挂字幕，可点击“转写无字幕”按钮生成字幕`
        : '';
    const skippedChargeText = skippedCount > 0 ? ` 跳过: ${skippedCount}` : '';

    if (successCount > 0 && failCount === 0) {
      showSuccess(
        `所有字幕获取成功 (成功: ${successCount}${skippedChargeText})。${noSubtitleFollowupText}`.trim(),
      );
    } else if (successCount > 0 || skippedCount > 0) {
      showSuccess(
        `字幕获取完成 (成功: ${successCount}, 失败: ${failCount}, 跳过: ${skippedCount})。${noSubtitleFollowupText}`.trim(),
      );
    } else if (successCount === 0 && failCount > 0) {
      showError(`所有字幕获取失败 (${failCount}/${videoList.length})。${noSubtitleFollowupText}`.trim());
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

  function showTranscribeConfirmDialog(videoCount) {
    return new Promise((resolve) => {
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

      const dialogContent = document.createElement('div');
      dialogContent.style.backgroundColor = 'white';
      dialogContent.style.borderRadius = '14px';
      dialogContent.style.padding = '22px';
      dialogContent.style.width = '420px';
      dialogContent.style.maxWidth = '92%';
      dialogContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';

      const title = document.createElement('h3');
      title.textContent = '转写提醒';
      title.style.margin = '0 0 10px 0';
      title.style.color = '#222';
      title.style.fontSize = '18px';

      const tipsList = document.createElement('ol');
      tipsList.style.margin = '0';
      tipsList.style.paddingLeft = '20px';
      tipsList.style.color = '#333';
      tipsList.style.fontSize = '14px';
      tipsList.style.lineHeight = '1.75';
      tipsList.style.textAlign = 'left';

      const tips = [
        { text: '转写准确率在 95% 左右，作为 AI 知识库基本够用' },
        { text: '首次转写需要加载模型，第一次会更慢' },
        { text: '转写速度和转写效果与本地电脑配置有关' },
        { html: '转写过程中<span style="color: #ff4d4f; font-weight: 600;">请勿关闭插件侧边栏</span>' },
        { text: '转写耗时可能较长，请耐心等待' },
      ];

      tips.forEach((tip) => {
        const item = document.createElement('li');
        if (tip.html) {
          item.innerHTML = tip.html;
        } else {
          item.textContent = tip.text;
        }
        item.style.marginBottom = '6px';
        tipsList.appendChild(item);
      });

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.gap = '12px';
      buttonContainer.style.marginTop = '18px';

      const checkboxLabel = document.createElement('label');
      checkboxLabel.style.display = 'flex';
      checkboxLabel.style.alignItems = 'center';
      checkboxLabel.style.gap = '8px';
      checkboxLabel.style.marginTop = '16px';
      checkboxLabel.style.color = '#666';
      checkboxLabel.style.fontSize = '13px';
      checkboxLabel.style.cursor = 'pointer';

      const dontShowAgainCheckbox = document.createElement('input');
      dontShowAgainCheckbox.type = 'checkbox';
      dontShowAgainCheckbox.style.width = '14px';
      dontShowAgainCheckbox.style.height = '14px';
      dontShowAgainCheckbox.style.cursor = 'pointer';

      const checkboxText = document.createElement('span');
      checkboxText.textContent = '下次不再提示';

      checkboxLabel.appendChild(dontShowAgainCheckbox);
      checkboxLabel.appendChild(checkboxText);

      const cancelButton = document.createElement('button');
      cancelButton.textContent = '取消';
      cancelButton.style.padding = '10px 18px';
      cancelButton.style.backgroundColor = '#f0f2f5';
      cancelButton.style.color = '#333';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '8px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.fontWeight = '500';

      const confirmButton = document.createElement('button');
      confirmButton.textContent = '确认转写';
      confirmButton.style.padding = '10px 18px';
      confirmButton.style.background = 'linear-gradient(to right, #722ed1, #722ed1)';
      confirmButton.style.color = 'white';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '8px';
      confirmButton.style.cursor = 'pointer';
      confirmButton.style.fontWeight = '600';
      confirmButton.style.boxShadow = '0 4px 12px rgba(114, 46, 209, 0.25)';

      function closeDialog(result) {
        if (dialogOverlay.parentNode) {
          document.body.removeChild(dialogOverlay);
        }
        resolve(result);
      }

      cancelButton.addEventListener('click', () => closeDialog({ confirmed: false, skipFuture: false }));
      confirmButton.addEventListener('click', () =>
        closeDialog({ confirmed: true, skipFuture: dontShowAgainCheckbox.checked }),
      );
      dialogOverlay.addEventListener('click', (event) => {
        if (event.target === dialogOverlay) {
          closeDialog({ confirmed: false, skipFuture: false });
        }
      });

      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      dialogContent.appendChild(title);
      dialogContent.appendChild(tipsList);
      dialogContent.appendChild(checkboxLabel);
      dialogContent.appendChild(buttonContainer);
      dialogOverlay.appendChild(dialogContent);
      document.body.appendChild(dialogOverlay);
    });
  }

  function showClearTableConfirmDialog() {
    return new Promise((resolve) => {
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

      const dialogContent = document.createElement('div');
      dialogContent.style.backgroundColor = 'white';
      dialogContent.style.borderRadius = '14px';
      dialogContent.style.padding = '22px';
      dialogContent.style.width = '400px';
      dialogContent.style.maxWidth = '92%';
      dialogContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';

      const title = document.createElement('h3');
      title.textContent = '确认清空表格';
      title.style.margin = '0 0 10px 0';
      title.style.color = '#222';
      title.style.fontSize = '18px';

      const description = document.createElement('p');
      description.textContent = '清空后，当前表格中的视频列表和字幕状态都会被移除。';
      description.style.margin = '0';
      description.style.color = '#555';
      description.style.fontSize = '14px';
      description.style.lineHeight = '1.7';

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.gap = '12px';
      buttonContainer.style.marginTop = '20px';

      const cancelButton = document.createElement('button');
      cancelButton.textContent = '取消';
      cancelButton.style.padding = '10px 18px';
      cancelButton.style.backgroundColor = '#f0f2f5';
      cancelButton.style.color = '#333';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '8px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.fontWeight = '500';

      const confirmButton = document.createElement('button');
      confirmButton.textContent = '确认清空';
      confirmButton.style.padding = '10px 18px';
      confirmButton.style.background = 'linear-gradient(to right, #ff7875, #ff4d4f)';
      confirmButton.style.color = 'white';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '8px';
      confirmButton.style.cursor = 'pointer';
      confirmButton.style.fontWeight = '600';
      confirmButton.style.boxShadow = '0 4px 12px rgba(255, 77, 79, 0.22)';

      function closeDialog(confirmed) {
        if (dialogOverlay.parentNode) {
          document.body.removeChild(dialogOverlay);
        }
        resolve(confirmed);
      }

      cancelButton.addEventListener('click', () => closeDialog(false));
      confirmButton.addEventListener('click', () => closeDialog(true));
      dialogOverlay.addEventListener('click', (event) => {
        if (event.target === dialogOverlay) {
          closeDialog(false);
        }
      });

      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      dialogContent.appendChild(title);
      dialogContent.appendChild(description);
      dialogContent.appendChild(buttonContainer);
      dialogOverlay.appendChild(dialogContent);
      document.body.appendChild(dialogOverlay);
    });
  }

  // 音频转字幕按钮事件监听
  if (transcribeAudioBtn) {
    console.log('添加音频转字幕按钮事件监听');
    transcribeAudioBtn.addEventListener('click', async function () {
      console.log('音频转字幕按钮被点击');

      // 检查是否有视频在表格中
      if (videoList.length === 0) {
        showError('请先添加视频到表格');
        return;
      }

      const videosToTranscribe = videoList.filter((video) => shouldAttemptAudioTranscription(video));
      if (videosToTranscribe.length === 0) {
        showError('没有需要转写的无字幕视频（所有视频都已获取字幕、信息不完整或充电专属不可获取）');
        return;
      }

      let dialogResult = { confirmed: true, skipFuture: false };
      if (!skipTranscribeConfirmDialog) {
        dialogResult = await showTranscribeConfirmDialog(videosToTranscribe.length);
      }

      if (!dialogResult.confirmed) {
        return;
      }

      if (dialogResult.skipFuture) {
        skipTranscribeConfirmDialog = true;
        chrome.storage.local.set({ skipTranscribeConfirmDialog: true });
      }

      // 显示进度
      showProgress(true);
      setTranscribeProgressReminderVisible(true);
      updateProgress(0, '准备转写无字幕视频...');
      setTranscribeAudioButtonLoading(true);

      try {
        showSuccess(`开始批量转写无字幕视频，共 ${videosToTranscribe.length} 个视频...`);

        // 优先使用任意已打开的 B站页面通过页面上下文下载音频；没有时让后台尝试直接下载。
        const bilibiliTab = await getCurrentBilibiliVideoTab();
        console.log('B站 标签页:', bilibiliTab?.url, 'ID:', bilibiliTab?.id);

        if (!bilibiliTab) {
          console.warn('未找到已打开的 B站页面标签页，将尝试直接下载音频');
          showError('未找到已打开的 B站页面，将尝试直接下载音频；若失败请先打开任意 B站页面后重试');
        }

        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < videosToTranscribe.length; i++) {
          const videoToTranscribe = videosToTranscribe[i];
          setTranscribeProgressContext(i, videosToTranscribe.length);

          try {
            const executionInfo = await refreshVideoExecutionInfo(videoToTranscribe, { allowFallbackCid: false });
            if (executionInfo.success) {
              videoToTranscribe.isChargeExclusive = !!executionInfo.info?.isChargeExclusive;
              videoToTranscribe.blockReason = executionInfo.info?.blockReason;
            }

            if (executionInfo.isChargeExclusive) {
              markVideoAsChargeExclusive(videoToTranscribe);
              skippedCount++;
              updateVideoTable();
              continue;
            }

            if (videoToTranscribe.duration && videoToTranscribe.duration > 3600) {
              videoToTranscribe.subtitleStatus = '转写失败: 视频超过60分钟';
              failCount++;
              updateVideoTable();
              continue;
            }

            videoToTranscribe.subtitleStatus = '转写中';
            updateVideoTable();
            updateTranscribeProgress(0, `准备转写：${videoToTranscribe.title}`);

            const hasCid = await ensureVideoCid(videoToTranscribe);
            if (!hasCid) {
              videoToTranscribe.subtitleStatus = '信息不完整: 无法准确匹配CID';
              failCount++;
              updateVideoTable();
              continue;
            }

            // 发送转写请求（包括 tabId）
            const response = await chrome.runtime.sendMessage({
              action: 'transcribeAudio',
              bvid: videoToTranscribe.bvid,
              cid: videoToTranscribe.cid,
              tabId: bilibiliTab?.id || null,
            });

            console.log('音频转写响应:', response);

            if (!response.success) {
              if (isChargeExclusiveBlockedResponse(response)) {
                markVideoAsChargeExclusive(videoToTranscribe);
                skippedCount++;
              } else {
                videoToTranscribe.subtitleStatus = `转写失败: ${response.message || '未知错误'}`;
                failCount++;
              }
              updateVideoTable();
              continue;
            }

            if (response.stage === 'needs_frontend_processing' && response.audioData) {
              console.log('需要在前端处理音频，开始解码...');
              updateTranscribeProgress(50, '在前端解码音频...');

              const audioBuffer = await decodeAudioInFrontend(response.audioData);
              if (!audioBuffer) {
                throw new Error('前端音频解码失败');
              }

              updateTranscribeProgress(60, '音频解码完成，开始转写...');

              const transcribeResult = await transcribeAudioInFrontend(audioBuffer, (progress, msg) => {
                updateTranscribeProgress(progress, msg || '转写中...');
              });

              videoToTranscribe.subtitleStatus = '转写字幕';
              videoToTranscribe.subtitleText = transcribeResult.srtContent;
              videoToTranscribe.subtitleTracks = [];
              videoToTranscribe.selectedSubtitleTrackIds = [];
              videoToTranscribe.subtitleTrackContents = {};
              videoToTranscribe.transcribedLanguage = normalizeWhisperLanguageCode(transcribeResult.language);
              videoToTranscribe.transcribedLanguageName =
                transcribeResult.languageName || getTranscriptionLanguageName(transcribeResult.language);
              successCount++;
              updateVideoTable();
              continue;
            }

            if (response.srtContent) {
              videoToTranscribe.subtitleStatus = '转写字幕';
              videoToTranscribe.subtitleText = response.srtContent;
              videoToTranscribe.subtitleTracks = [];
              videoToTranscribe.selectedSubtitleTrackIds = [];
              videoToTranscribe.subtitleTrackContents = {};
              videoToTranscribe.transcribedLanguage = normalizeWhisperLanguageCode(response.language);
              videoToTranscribe.transcribedLanguageName =
                response.languageName || getTranscriptionLanguageName(response.language);
              successCount++;
              updateVideoTable();
              continue;
            }

            videoToTranscribe.subtitleStatus = '转写失败: 转写结果格式不正确';
            failCount++;
            updateVideoTable();
          } catch (itemError) {
            console.error(`音频转写失败: ${videoToTranscribe.title}`, itemError);
            videoToTranscribe.subtitleStatus = `转写失败: ${itemError.message || '未知错误'}`;
            failCount++;
            updateVideoTable();
          }
        }

        clearTranscribeProgressContext();
        updateProgress(100, '批量转写无字幕视频完成');

        if (successCount > 0 && failCount === 0 && skippedCount === 0) {
          showSuccess(`批量转写无字幕视频完成，成功 ${successCount} 个视频`);
        } else if (successCount > 0 || skippedCount > 0) {
          showSuccess(`批量转写无字幕视频完成，成功 ${successCount} 个，失败 ${failCount} 个，跳过 ${skippedCount} 个`);
        } else {
          showError(`批量转写无字幕视频失败，共失败 ${failCount} 个视频`);
        }
      } catch (error) {
        console.error('音频转写出错:', error);
        showError('转写出错: ' + (error.message || '未知错误'));
      } finally {
        clearTranscribeProgressContext();
        setTranscribeAudioButtonLoading(false);
        setTimeout(() => {
          showProgress(false);
        }, 2000);
      }
    });
  } else {
    console.warn('音频转字幕按钮未找到');
  }

  // 监听转写进度消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'transcribeProgress') {
      console.log('收到转写进度:', message);
      updateTranscribeProgress(message.progress || 0, message.message || '处理中...');
    }
    return true;
  });

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
      const videosWithSubtitle = videoList.filter((video) => hasSubtitleContent(video));

      if (videosWithSubtitle.length === 0) {
        showError('没有可导出的字幕，请先获取字幕');
        return;
      }

      // 检查是否设置了默认导出格式
      if (defaultExportFormat === 'srt' || defaultExportFormat === 'txt') {
        console.log(`使用默认导出格式: ${defaultExportFormat}`);
        executeExport(videosWithSubtitle, defaultExportFormat);
      } else {
        // 创建格式选择弹窗
        showFormatSelectionDialog((selectedFormat) => {
          if (!selectedFormat) {
            return; // 用户取消了选择
          }

          console.log(`选择了导出格式: ${selectedFormat}`);

          // 继续执行导出流程，并传入所选格式
          executeExport(videosWithSubtitle, selectedFormat);
        });
      }
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

  // 根据设置生成文件名
  function buildFileName(safeAuthor, safeTitle, formattedDate, format, namingFormat = defaultFileNameFormat) {
    const d = formattedDate ? `【${formattedDate}】` : '';
    const sep = '—';
    switch (namingFormat) {
      case 'author-date-title':
        return `【${safeAuthor}】${d ? sep + d : ''}${sep}${safeTitle}.${format}`;
      case 'title-author-date':
        return `${safeTitle}${sep}【${safeAuthor}】${d ? sep + d : ''}.${format}`;
      case 'title-date':
        return `${safeTitle}${d ? sep + d : ''}.${format}`;
      case 'date-title':
        return `${d ? d + sep : ''}${safeTitle}.${format}`;
      default: // 'author-title-date'
        return `【${safeAuthor}】${sep}${safeTitle}${d ? sep + d : ''}.${format}`;
    }
  }

  function normalizePrependVideoInfoFields(fields) {
    if (!Array.isArray(fields)) return [];
    const fieldSet = new Set(fields);
    return TXT_VIDEO_INFO_FIELD_OPTIONS.map((option) => option.value).filter((value) => fieldSet.has(value));
  }

  function getTxtVideoInfoFieldLabel(field) {
    return TXT_VIDEO_INFO_FIELD_OPTIONS.find((option) => option.value === field)?.label || field;
  }

  function buildExportVideoUrl(video) {
    if (!video?.bvid) return '';
    let videoUrl = `https://www.bilibili.com/video/${video.bvid}`;
    if (Number(video.page) > 1) {
      videoUrl += `?p=${video.page}`;
    }
    return videoUrl;
  }

  function getTxtVideoInfoFieldValue(video, field) {
    if (!video) return '';

    if (field === 'title') {
      return video.title || '';
    }

    if (field === 'link') {
      return buildExportVideoUrl(video);
    }

    if (field === 'author') {
      return video.author || '';
    }

    if (field === 'publishDate') {
      if (!video.publishDate) return '';
      const formattedDate = formatDate(video.publishDate);
      return formattedDate && formattedDate !== '-' ? formattedDate : '';
    }

    if (field === 'tags') {
      const tags = Array.isArray(video.tags) ? video.tags : [];
      if (tags.length === 0) return '';
      return tags
        .map((tag) => String(tag || '').trim())
        .filter(Boolean)
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
        .join(' ');
    }

    return '';
  }

  async function ensureVideoExportMetadata(video, activeFields = prependVideoInfoFields) {
    if (!video?.bvid) return;

    const normalizedFields = normalizePrependVideoInfoFields(activeFields);
    const needsTags = normalizedFields.includes('tags') && (!Array.isArray(video.tags) || video.tags.length === 0);
    if (!needsTags) return;

    try {
      const infoResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'fetchBilibiliInfo',
            videoId: video.bvid,
          },
          resolve,
        );
      });

      if (infoResponse?.success) {
        if (Array.isArray(infoResponse.tags)) {
          video.tags = infoResponse.tags.filter(Boolean);
        }
        if (!video.author && infoResponse.author) {
          video.author = infoResponse.author;
        }
        if (!video.publishDate && infoResponse.publishDate) {
          video.publishDate = infoResponse.publishDate;
        }
      }
    } catch (error) {
      console.warn(`补充视频导出元信息失败: ${video.title}`, error);
    }
  }

  // 根据设置在字幕内容前添加视频信息
  function prependVideoInfoText(subtitleContent, video) {
    const activeFields = normalizePrependVideoInfoFields(prependVideoInfoFields);
    if (activeFields.length === 0 || !video) return subtitleContent;

    const lines = activeFields
      .map((field) => {
        const value = getTxtVideoInfoFieldValue(video, field);
        if (!value) return '';
        return `${getTxtVideoInfoFieldLabel(field)}：${value}`;
      })
      .filter(Boolean);

    if (lines.length === 0) return subtitleContent;
    return `${lines.join('\n')}\n\n${subtitleContent}`;
  }

  function buildVideoExportFileName(video, format) {
    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '_');
    const safeAuthor = video.author ? video.author.replace(/[\\/:*?"<>|]/g, '_') : 'unknown';
    let formattedDate = '';

    if (video.publishDate) {
      const d = formatDate(video.publishDate);
      if (d && d !== '-') {
        formattedDate = d;
      }
    }

    return buildFileName(safeAuthor, safeTitle, formattedDate, format);
  }

  function appendLanguageSuffixToFileName(fileName, languageName, format) {
    const suffix = sanitizeLanguageSuffix(languageName);
    const extension = `.${format}`;

    if (fileName.endsWith(extension)) {
      return `${fileName.slice(0, -extension.length)}-${suffix}${extension}`;
    }

    return `${fileName}-${suffix}`;
  }

  function ensureUniqueZipFileName(fileName, usedFileNames) {
    if (!usedFileNames.has(fileName)) {
      usedFileNames.add(fileName);
      return fileName;
    }

    const dotIndex = fileName.lastIndexOf('.');
    const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
    const extension = dotIndex >= 0 ? fileName.slice(dotIndex) : '';
    let index = 2;
    let nextFileName = `${baseName}-${index}${extension}`;

    while (usedFileNames.has(nextFileName)) {
      index++;
      nextFileName = `${baseName}-${index}${extension}`;
    }

    usedFileNames.add(nextFileName);
    return nextFileName;
  }

  function buildSubtitleExportTasks(videosWithSubtitle, format) {
    const usedFileNames = new Set();
    const tasks = [];

    videosWithSubtitle.forEach((video) => {
      const baseFileName = buildVideoExportFileName(video, format);

      if (hasSubtitleTracks(video)) {
        getSelectedSubtitleTracks(video).forEach((track) => {
          const languageName = getSubtitleLanguageName(track);
          const fileName = ensureUniqueZipFileName(
            appendLanguageSuffixToFileName(baseFileName, languageName, format),
            usedFileNames,
          );

          tasks.push({
            video,
            track,
            languageName,
            fileName,
          });
        });
        return;
      }

      tasks.push({
        video,
        track: null,
        languageName: '',
        fileName: ensureUniqueZipFileName(baseFileName, usedFileNames),
      });
    });

    return tasks;
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

      const exportTasks = buildSubtitleExportTasks(videosWithSubtitle, format);

      if (exportTasks.length === 0) {
        showError('没有可导出的字幕语言，请先选择字幕语言');
        showProgress(false);
        if (exportTableBtn) {
          exportTableBtn.disabled = false;
          exportTableBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            导出字幕
          `;
        }
        return;
      }

      showSuccess(`开始批量导出${format.toUpperCase()}字幕，共 ${exportTasks.length} 个文件`);

      // 创建一个临时的zip文件夹
      const zipContent = new JSZip();
      let exportedCount = 0;
      let errorCount = 0;

      // 依次导出每个字幕文件
      for (const [index, task] of exportTasks.entries()) {
        try {
          const { video, track, fileName } = task;
          const subtitleSource = track ? await getSubtitleContentForTrack(video, track) : video;
          const subtitleText = subtitleSource.subtitleText;

          // 根据选择的格式处理字幕内容
          let subtitleContent;
          if (format === 'srt') {
            subtitleContent = convertToSrtFormat(subtitleText);
          } else {
            subtitleContent = convertToTxtFormat(
              subtitleText,
              track ? getSubtitleTrackLanguageCode(track) : video.transcribedLanguage,
            );
          }

          // 添加视频信息前缀（仅TXT格式，SRT不能破坏格式）
          if (format !== 'srt') {
            await ensureVideoExportMetadata(video);
            subtitleContent = prependVideoInfoText(subtitleContent, video);
          }

          // 将字幕内容添加到zip文件
          zipContent.file(fileName, subtitleContent);
          exportedCount++;

          // 更新进度条
          const percent = Math.floor(((index + 1) / exportTasks.length) * 100);
          updateProgress(percent, `已处理 ${exportedCount}/${exportTasks.length} 个字幕`);

          // 每添加一个更新一次状态
          showSuccess(`已处理 ${exportedCount}/${exportTasks.length} 个字幕`);
        } catch (videoError) {
          console.error(`导出字幕失败:`, videoError);
          errorCount++;
        }
      }

      if (exportedCount === 0) {
        showProgress(false);
        if (exportTableBtn) {
          exportTableBtn.disabled = false;
          exportTableBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            导出字幕
          `;
        }
        showError(`导出失败，${errorCount} 个字幕文件未能生成`);
        return;
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
  function convertToTxtFormat(subtitleText, transcriptionLanguage = null) {
    if (!subtitleText) return '';

    const useChineseWrapRules = !transcriptionLanguage || isChineseTranscriptionLanguage(transcriptionLanguage);

    // 将字幕文本按行分割
    const lines = subtitleText.split('\n');
    let txtContent = '';

    // 遍历每一行，提取内容文本
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // 跳过空行
      if (line === '') continue;

      // 跳过序号行（纯数字）
      if (/^\d+$/.test(line)) continue;

      // 跳过时间轴行（含 --> 格式的行）
      if (line.includes(' --> ')) continue;

      // 清理残余的 <|X.XX|> 时间戳标记；只有中文内容才做繁简转换。
      line = cleanTranscriptionText(line, { language: transcriptionLanguage });

      if (line) {
        if (useChineseWrapRules) {
          // 中文转写继续按语义断句，保持当前更适合中文的阅读观感。
          const segments = splitTextToSentences(line);
          txtContent += segments + '\n';
        } else {
          // 非中文不套中文 18 字断句规则，保留模型输出的自然片段。
          txtContent += line + '\n';
        }
      }
    }

    return useChineseWrapRules ? removeDuplicateTextLines(txtContent) : txtContent.trim();
  }

  const TXT_WRAP_PREFERRED_CHARS = 17;
  const TXT_WRAP_MAX_CHARS = 20;
  const PROTECTED_INLINE_TOKENS = [
    'YouTube', 'Python', 'ChatGPT', 'AIGC', 'AI工具', 'AI', 'B站', 'UP主', 'up主',
  ];
  const PROTECTED_FUNCTION_PHRASES = [
    '只有', '一个', '这种', '这个', '那个', '不是', '因为', '如果', '但是', '不过',
    '以及', '为了', '可以', '我们', '你们', '他们', '大家', '还有', '已经', '还是',
    '不会', '不能', '不要', '然后', '就是',
  ];
  const FORBIDDEN_LEADING_LINE_CHARS = '的了是在和与及并而';
  const WEAK_TRAILING_CHARS = '只很太更最把被给向跟和与在对的了着过地得';
  const DANGLING_ACTION_CHARS = '去点看说做开找拿问提学讲写读听想用带发';

  // 按中文标点符号将文本分句，每句单独一行
  // 对于没有标点的长文本，优先寻找自然断点，避免简单按固定字数硬切
  function splitTextToSentences(text, maxChars = 18) {
    if (!text) return '';
    const MAX_CHARS = maxChars; // 更接近 B 站短字幕观感，默认按 18 字做软约束
    const result = [];
    // 先按句末标点（。！？!?；;）分句
    const sentences = text.split(/(?<=[。！？!?；;])/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      // 再按逗号（，,、）进一步拆分
      const parts = trimmed.split(/(?<=[，,、])/);
      for (const part of parts) {
        const p = part.trim();
        if (!p) continue;
        // 如果拆分后仍然超长（Whisper 经常输出无标点的长文本），尽量按自然断点换行
        if (p.length > MAX_CHARS) {
          result.push(...softWrapTextByMeaning(p, MAX_CHARS));
        } else {
          result.push(p);
        }
      }
    }
    return repairWrappedLines(result, Math.min(TXT_WRAP_MAX_CHARS, MAX_CHARS + 2)).join('\n');
  }

  // 对无标点长文本做软换行：通过候选断点评分，尽量找到更像人话的断句位置
  function softWrapTextByMeaning(text, maxChars = 18) {
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.length <= maxChars) return [trimmed];

    const result = [];
    let remaining = trimmed;
    const preferredChars = Math.min(18, Math.max(16, maxChars - 1));

    while (remaining.length > maxChars) {
      const splitIndex = findBestWrapIndex(remaining, maxChars, preferredChars);
      const head = remaining.slice(0, splitIndex).trim();
      if (head) result.push(head);
      remaining = remaining.slice(splitIndex).trim();
      if (!remaining) break;
    }

    if (remaining) result.push(remaining);
    return result;
  }

  function findBestWrapIndex(text, maxChars, preferredChars = TXT_WRAP_PREFERRED_CHARS) {
    const searchEnd = Math.min(text.length - 1, maxChars);
    if (searchEnd <= 1) return Math.min(maxChars, text.length);

    const minChars = Math.max(4, preferredChars - 8);
    const protectedSpans = collectProtectedSpans(text);
    const candidateIndexes = collectWrapCandidateIndexes(text, minChars, searchEnd);
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const i of candidateIndexes) {
      const score = scoreWrapCandidate(text, i, preferredChars, protectedSpans);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex > 0 && Number.isFinite(bestScore)) {
      return bestIndex;
    }

    let fallbackIndex = -1;
    let fallbackDistance = Number.POSITIVE_INFINITY;
    for (const i of candidateIndexes) {
      if (isForbiddenSplitPoint(text, i, protectedSpans)) continue;
      const head = text.slice(0, i).trim();
      const tail = text.slice(i).trim();
      if (!head || !tail) continue;

      const distance = Math.abs(head.length - preferredChars);
      if (distance < fallbackDistance) {
        fallbackDistance = distance;
        fallbackIndex = i;
      }
    }

    if (fallbackIndex > 0) {
      return fallbackIndex;
    }

    for (let i = searchEnd; i >= minChars; i--) {
      const head = text.slice(0, i).trim();
      const tail = text.slice(i).trim();
      if (!head || !tail) continue;
      return i;
    }

    return Math.min(maxChars, text.length);
  }

  function collectWrapCandidateIndexes(text, minChars, searchEnd) {
    const candidates = new Set();
    const segmenterBoundaries = collectSegmenterBoundaryIndexes(text, minChars, searchEnd);

    for (const index of segmenterBoundaries) {
      candidates.add(index);
    }

    if (candidates.size === 0) {
      for (let i = minChars; i <= searchEnd; i++) {
        candidates.add(i);
      }
    }

    return Array.from(candidates).sort((a, b) => a - b);
  }

  function collectSegmenterBoundaryIndexes(text, minChars, searchEnd) {
    if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') {
      return [];
    }

    try {
      const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
      const boundaries = [];
      for (const part of segmenter.segment(text)) {
        const end = part.index + part.segment.length;
        if (end >= minChars && end <= searchEnd) {
          boundaries.push(end);
        }
      }
      return boundaries;
    } catch (error) {
      return [];
    }
  }

  function scoreWrapCandidate(text, index, preferredChars, protectedSpans) {
    if (isForbiddenSplitPoint(text, index, protectedSpans)) {
      return Number.NEGATIVE_INFINITY;
    }

    const head = text.slice(0, index).trim();
    const tail = text.slice(index).trim();
    if (!head || !tail) {
      return Number.NEGATIVE_INFINITY;
    }

    const headLen = head.length;
    const tailLen = tail.length;
    const headLastChar = head.slice(-1);
    const tailFirstChar = tail[0];
    let score = 140 - Math.abs(headLen - preferredChars) * 6;

    if (/[。！？!?；;]/.test(headLastChar)) {
      score += 120;
    } else if (/[，,、：:；;]/.test(headLastChar)) {
      score += 70;
    }

    if (startsWithSentenceStarter(tail)) {
      score += 45;
    }

    if (headLen >= 12 && headLen <= 18) {
      score += 20;
    }

    if (tailLen <= 2 || headLen <= 2) {
      score -= 160;
    } else if (tailLen <= 4) {
      score -= 90;
    } else if (tailLen <= 6) {
      score -= 30;
    }

    if (headLen <= 4) {
      score -= 50;
    }

    if (startsWithForbiddenLineChar(tailFirstChar)) {
      score -= 90;
    }

    if (endsWithWeakTrailingChar(headLastChar)) {
      score -= 90;
    }

    if (endsWithDanglingActionChar(headLastChar)) {
      score -= 140;
    }

    if (startsWithBackwardAttachFragment(tail)) {
      score -= 80;
    }

    if (tailLen >= 8 && tailLen <= 18) {
      score += 10;
    }

    return score;
  }

  function isForbiddenSplitPoint(text, index, protectedSpans = collectProtectedSpans(text)) {
    if (index <= 0 || index >= text.length) return true;

    for (const span of protectedSpans) {
      if (index > span.start && index < span.end) {
        return true;
      }
    }

    const previousChar = text[index - 1];
    const nextChar = text[index];
    if (!previousChar || !nextChar) return true;
    if (/\s/.test(previousChar) || /\s/.test(nextChar)) return false;

    if (/[A-Za-z0-9]/.test(previousChar) && /[A-Za-z0-9]/.test(nextChar)) {
      return true;
    }

    if ((/[A-Za-z0-9]/.test(previousChar) && /[\u4e00-\u9fa5]/.test(nextChar)) ||
        (/[\u4e00-\u9fa5]/.test(previousChar) && /[A-Za-z0-9]/.test(nextChar))) {
      return true;
    }

    if ('的了着过地得们'.includes(nextChar)) {
      return true;
    }

    if (WEAK_TRAILING_CHARS.includes(previousChar)) {
      return true;
    }

    if (endsWithDanglingActionChar(previousChar) && /[\u4e00-\u9fa5A-Za-z0-9]/.test(nextChar)) {
      return true;
    }

    return false;
  }

  function collectProtectedSpans(text) {
    const spans = [];
    const protectedTokens = [...PROTECTED_INLINE_TOKENS, '315'];
    const protectedPhrases = PROTECTED_FUNCTION_PHRASES;
    const asciiTokenRegex = /[A-Za-z0-9]+/g;

    let match;
    while ((match = asciiTokenRegex.exec(text)) !== null) {
      if (match[0].length >= 2) {
        spans.push({ start: match.index, end: match.index + match[0].length });
      }
    }

    for (const token of [...protectedTokens, ...protectedPhrases]) {
      let searchStart = 0;
      while (searchStart < text.length) {
        const index = text.indexOf(token, searchStart);
        if (index === -1) break;
        spans.push({ start: index, end: index + token.length });
        searchStart = index + token.length;
      }
    }

    spans.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const span of spans) {
      const last = merged[merged.length - 1];
      if (!last || span.start > last.end) {
        merged.push({ ...span });
      } else {
        last.end = Math.max(last.end, span.end);
      }
    }

    return merged;
  }

  function repairWrappedLines(lines, maxChars = TXT_WRAP_MAX_CHARS) {
    if (!Array.isArray(lines) || lines.length === 0) return [];

    let repaired = lines.map((line) => line.trim()).filter(Boolean);
    repaired = repairWrappedLinesPass(repaired, maxChars);
    repaired = repairWrappedLinesPass(repaired, maxChars);
    return repaired;
  }

  function repairWrappedLinesPass(lines, maxChars) {
    const workingLines = [...lines];
    const result = [];

    for (let i = 0; i < workingLines.length; i++) {
      const current = (workingLines[i] || '').trim();
      if (!current) continue;

      const previous = result[result.length - 1];
      const next = i + 1 < workingLines.length ? (workingLines[i + 1] || '').trim() : '';

      if (shouldMergeLineIntoPrevious(current, previous, maxChars)) {
        result[result.length - 1] = `${previous}${current}`;
        continue;
      }

      if (shouldMergeLineIntoNext(current, next, previous, maxChars)) {
        workingLines[i + 1] = `${current}${next}`;
        continue;
      }

      result.push(current);
    }

    return result;
  }

  function shouldMergeLineIntoPrevious(current, previous, maxChars) {
    if (!previous || isNaturalShortLine(current)) return false;

    if (current.length <= 2) {
      return previous.length < maxChars - 2 && !/[。！？!?；;]$/.test(previous);
    }

    if (current.length <= 8 && endsWithDanglingActionChar(previous.slice(-1))) {
      return previous.length <= maxChars + 2 && !/[。！？!?；;]$/.test(previous);
    }

    if (current.length <= 4 && endsWithWeakTrailingChar(previous.slice(-1))) {
      return previous.length <= maxChars + 2 && !/[。！？!?；;]$/.test(previous);
    }

    if (current.length <= 4 && startsWithBackwardAttachFragment(current)) {
      return previous.length <= maxChars + 2;
    }

    return false;
  }

  function shouldMergeLineIntoNext(current, next, previous, maxChars) {
    if (!next || isNaturalShortLine(current)) return false;

    if (current.length <= 2) {
      return endsWithWeakTrailingChar(current.slice(-1)) || !previous || previous.length >= maxChars - 2;
    }

    if (current.length <= 4 && startsWithForwardConnector(current)) {
      return true;
    }

    if (current.length <= 4 && endsWithWeakTrailingChar(current.slice(-1))) {
      return true;
    }

    if (current.length <= 8 && endsWithDanglingActionChar(current.slice(-1))) {
      return true;
    }

    return false;
  }

  function startsWithSentenceStarter(text) {
    return /^(但是|不过|然后|所以|因此|另外|后来|最后|于是|那么|其实|比如|如果|因为|接下来|好那|那我们)/.test(text || '');
  }

  function startsWithForbiddenLineChar(char) {
    return FORBIDDEN_LEADING_LINE_CHARS.includes(char || '');
  }

  function endsWithWeakTrailingChar(char) {
    return WEAK_TRAILING_CHARS.includes(char || '');
  }

  function endsWithDanglingActionChar(char) {
    return DANGLING_ACTION_CHARS.includes(char || '');
  }

  function startsWithBackwardAttachFragment(text) {
    return /^(的|了|着|过|地|得|们)/.test(text || '');
  }

  function startsWithForwardConnector(text) {
    return /^(而且|但是|然后|所以|因此|不过|另外|接着|于是|那么|并且|以及|和|与|及|并|而)/.test(text || '');
  }

  function isNaturalShortLine(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return false;

    return /^(先叠个假|谢谢大家|拜拜|大家好|好的|好吧|行吧|对吧|没错|当然|可以)$/.test(trimmed);
  }

  function formatReadableChunksForTxt(chunks, maxChars = 18) {
    if (!Array.isArray(chunks) || chunks.length === 0) return '';

    const lines = [];
    for (const chunk of chunks) {
      const text = cleanTranscriptionText(chunk?.text || '');
      if (!text) continue;

      const wrapped = splitTextToSentences(text, maxChars)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      lines.push(...wrapped);
    }

    return repairWrappedLines(lines, Math.min(TXT_WRAP_MAX_CHARS, maxChars + 2)).join('\n');
  }

  // 让外层前端转写流程也能复用 TXT 格式化逻辑
  window.formatReadableChunksForTxt = formatReadableChunksForTxt;

  // 清空表格
  async function clearTable() {
    if (videoList.length === 0) {
      showError('表格已经是空的');
      return;
    }

    const confirmed = await showClearTableConfirmDialog();
    if (!confirmed) {
      return;
    }

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

  // 设置按钮事件
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsModalCloseBtn = document.getElementById('settingsModalCloseBtn');
  let defaultExportFormat = 'ask'; // 默认值
  let prependVideoInfoFields = [];

  chrome.storage.local.get(['skipTranscribeConfirmDialog'], (result) => {
    skipTranscribeConfirmDialog = !!result.skipTranscribeConfirmDialog;
  });

  // 自定义下拉框元素
  const formatSelectTrigger = document.getElementById('formatSelectTrigger');
  const formatSelectDropdown = document.getElementById('formatSelectDropdown');
  const formatSelectOptions = document.querySelectorAll('#formatSelectDropdown .custom-select-option');
  const formatSelectedText = document.querySelector('#formatSelectTrigger .custom-select-selected-text');

  function getCustomSelectOptionLabel(option) {
    if (!option) return '';
    return option.querySelector('.custom-select-option-title')?.textContent?.trim() || option.textContent.trim();
  }

  function closeAllSettingsDropdowns() {
    if (formatSelectTrigger) formatSelectTrigger.classList.remove('active');
    if (formatSelectDropdown) formatSelectDropdown.classList.remove('active');
    if (fileNameSelectTrigger) fileNameSelectTrigger.classList.remove('active');
    if (fileNameSelectDropdown) fileNameSelectDropdown.classList.remove('active');
    if (txtVideoInfoSelectTrigger) txtVideoInfoSelectTrigger.classList.remove('active');
    if (txtVideoInfoSelectDropdown) txtVideoInfoSelectDropdown.classList.remove('active');
  }

  function updateTxtVideoInfoSelectedText() {
    if (!txtVideoInfoSelectedText) return;

    const activeFields = normalizePrependVideoInfoFields(prependVideoInfoFields);
    if (activeFields.length === 0) {
      txtVideoInfoSelectedText.textContent = '不添加';
      return;
    }

    if (activeFields.length <= 2) {
      txtVideoInfoSelectedText.textContent = activeFields.map(getTxtVideoInfoFieldLabel).join('、');
      return;
    }

    txtVideoInfoSelectedText.textContent = `已选 ${activeFields.length} 项`;
  }

  function syncTxtVideoInfoOptionStates() {
    const activeFields = normalizePrependVideoInfoFields(prependVideoInfoFields);
    txtVideoInfoOptions.forEach((option) => {
      const value = option.getAttribute('data-value');
      const checked = activeFields.includes(value);
      option.classList.toggle('selected', checked);
      const checkbox = option.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = checked;
      }
    });
    updateTxtVideoInfoSelectedText();
  }

  function persistTxtVideoInfoFields() {
    prependVideoInfoFields = normalizePrependVideoInfoFields(prependVideoInfoFields);
    chrome.storage.local.set({
      prependVideoInfoFields,
      prependVideoInfo: prependVideoInfoFields.length > 0,
    });
    syncTxtVideoInfoOptionStates();
  }

  function toggleTxtVideoInfoField(value) {
    if (!value) return;

    const normalizedFields = normalizePrependVideoInfoFields(prependVideoInfoFields);
    if (normalizedFields.includes(value)) {
      prependVideoInfoFields = normalizedFields.filter((field) => field !== value);
    } else {
      prependVideoInfoFields = [...normalizedFields, value];
    }

    persistTxtVideoInfoFields();
  }

  // 从 storage 加载设置
  chrome.storage.local.get(['defaultExportFormat'], (result) => {
    if (result.defaultExportFormat) {
      defaultExportFormat = result.defaultExportFormat;
      if (formatSelectedText) {
        const matchOption = document.querySelector(
          `#formatSelectDropdown .custom-select-option[data-value="${defaultExportFormat}"]`,
        );
        if (matchOption) {
          formatSelectedText.textContent = getCustomSelectOptionLabel(matchOption);
          formatSelectOptions.forEach((o) => o.classList.remove('selected'));
          matchOption.classList.add('selected');
        }
      }
    }
  });

  // 自定义下拉框交互
  if (formatSelectTrigger && formatSelectDropdown) {
    formatSelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = formatSelectTrigger.classList.contains('active');
      closeAllSettingsDropdowns();
      if (!wasOpen) {
        formatSelectTrigger.classList.add('active');
        formatSelectDropdown.classList.add('active');
      }
    });

    formatSelectOptions.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-value');
        defaultExportFormat = value;
        formatSelectedText.textContent = getCustomSelectOptionLabel(option);
        formatSelectOptions.forEach((o) => o.classList.remove('selected'));
        option.classList.add('selected');
        formatSelectTrigger.classList.remove('active');
        formatSelectDropdown.classList.remove('active');
        chrome.storage.local.set({ defaultExportFormat });
      });
    });

    // 点击外部关闭下拉框
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#formatSelectContainer')) {
        formatSelectTrigger.classList.remove('active');
        formatSelectDropdown.classList.remove('active');
      }
    });
  }

  // 文件命名格式设置
  let defaultFileNameFormat = 'author-title-date';
  const fileNameSelectTrigger = document.getElementById('fileNameSelectTrigger');
  const fileNameSelectDropdown = document.getElementById('fileNameSelectDropdown');
  const fileNameSelectOptions = document.querySelectorAll('#fileNameSelectDropdown .custom-select-option');
  const fileNameSelectedText = document.querySelector('#fileNameSelectTrigger .custom-select-selected-text');
  const txtVideoInfoSelectTrigger = document.getElementById('txtVideoInfoSelectTrigger');
  const txtVideoInfoSelectDropdown = document.getElementById('txtVideoInfoSelectDropdown');
  const txtVideoInfoOptions = document.querySelectorAll('#txtVideoInfoSelectDropdown .custom-multi-select-option');
  const txtVideoInfoSelectedText = document.querySelector('#txtVideoInfoSelectTrigger .custom-select-selected-text');

  // 从 storage 加载文件命名设置
  chrome.storage.local.get(['defaultFileNameFormat'], (result) => {
    if (result.defaultFileNameFormat) {
      defaultFileNameFormat = result.defaultFileNameFormat;
      if (fileNameSelectedText) {
        const matchOption = document.querySelector(
          `#fileNameSelectDropdown .custom-select-option[data-value="${defaultFileNameFormat}"]`,
        );
        if (matchOption) {
          fileNameSelectedText.textContent = getCustomSelectOptionLabel(matchOption);
          fileNameSelectOptions.forEach((o) => o.classList.remove('selected'));
          matchOption.classList.add('selected');
        }
      }
    }
  });

  if (fileNameSelectTrigger && fileNameSelectDropdown) {
    fileNameSelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = fileNameSelectTrigger.classList.contains('active');
      closeAllSettingsDropdowns();
      if (!wasOpen) {
        fileNameSelectTrigger.classList.add('active');
        fileNameSelectDropdown.classList.add('active');
      }
    });

    fileNameSelectOptions.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-value');
        defaultFileNameFormat = value;
        fileNameSelectedText.textContent = getCustomSelectOptionLabel(option);
        fileNameSelectOptions.forEach((o) => o.classList.remove('selected'));
        option.classList.add('selected');
        fileNameSelectTrigger.classList.remove('active');
        fileNameSelectDropdown.classList.remove('active');
        chrome.storage.local.set({ defaultFileNameFormat });
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#fileNameSelectContainer')) {
        fileNameSelectTrigger.classList.remove('active');
        fileNameSelectDropdown.classList.remove('active');
      }
    });
  }

  chrome.storage.local.get(['prependVideoInfoFields', 'prependVideoInfo'], (result) => {
    if (Array.isArray(result.prependVideoInfoFields)) {
      prependVideoInfoFields = normalizePrependVideoInfoFields(result.prependVideoInfoFields);
    } else if (result.prependVideoInfo) {
      prependVideoInfoFields = ['title', 'link'];
    } else {
      prependVideoInfoFields = [];
    }

    syncTxtVideoInfoOptionStates();
  });

  if (txtVideoInfoSelectTrigger && txtVideoInfoSelectDropdown) {
    txtVideoInfoSelectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = txtVideoInfoSelectTrigger.classList.contains('active');
      closeAllSettingsDropdowns();
      if (!wasOpen) {
        txtVideoInfoSelectTrigger.classList.add('active');
        txtVideoInfoSelectDropdown.classList.add('active');
      }
    });

    txtVideoInfoOptions.forEach((option) => {
      const checkbox = option.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const value = option.getAttribute('data-value');
          toggleTxtVideoInfoField(value);
        });
      }

      option.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const value = option.getAttribute('data-value');
        toggleTxtVideoInfoField(value);
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#txtVideoInfoSelectContainer')) {
        txtVideoInfoSelectTrigger.classList.remove('active');
        txtVideoInfoSelectDropdown.classList.remove('active');
      }
    });
  }

  if (settingsBtn && settingsModal) {
    const openSettingsModal = () => {
      settingsModal.style.display = 'flex';
      document.body.classList.add('modal-open');
    };

    const closeSettingsModal = () => {
      closeAllSettingsDropdowns();
      settingsModal.style.display = 'none';
      document.body.classList.remove('modal-open');
    };

    settingsBtn.addEventListener('click', () => {
      openSettingsModal();
    });

    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });

    if (settingsModalCloseBtn) {
      settingsModalCloseBtn.addEventListener('click', () => {
        closeSettingsModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
        closeSettingsModal();
      }
    });
  }

  // 初始化表格
  updateVideoTable();

  // 感叹号图标 fixed 定位 tooltip
  const helpIcons = document.querySelectorAll('.status-help-icon[data-tooltip]');
  if (helpIcons.length > 0) {
    const tooltip = document.createElement('div');
    tooltip.className = 'status-fixed-tooltip';
    document.body.appendChild(tooltip);

    helpIcons.forEach((icon) => {
      icon.addEventListener('mouseenter', function () {
        tooltip.textContent = this.getAttribute('data-tooltip');
        const rect = this.getBoundingClientRect();
        tooltip.style.top = rect.top - 8 + 'px';
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
        tooltip.classList.add('show');
      });

      icon.addEventListener('mouseleave', function () {
        tooltip.classList.remove('show');
      });
    });
  }

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

  // 弹窗关闭逻辑
  document.querySelectorAll('.close-modal-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('followModal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  // 监听弹窗内的关注和赞助按钮，点击即视为已转化
  const modalFollowBtn = document.getElementById('modalFollowBtn');
  const modalSponsorBtn = document.getElementById('modalSponsorBtn');

  function markAsConverted() {
    chrome.storage.local.set({ hasConverted: true });
    console.log('用户已转化，不再显示弹窗');
  }

  if (modalFollowBtn) {
    modalFollowBtn.addEventListener('click', markAsConverted);
  }
  if (modalSponsorBtn) {
    modalSponsorBtn.addEventListener('click', markAsConverted);
  }

  // 顶部公告栏事件监听 (解决 CSP 报错问题)
  const bannerContainer = document.getElementById('bannerContainer');
  const bannerFollowLink = document.getElementById('bannerFollowLink');
  const bannerSponsorLink = document.getElementById('bannerSponsorLink');

  if (bannerContainer) {
    bannerContainer.addEventListener('click', () => {
      window.open('https://space.bilibili.com/521041866', '_blank');
    });
  }

  if (bannerFollowLink) {
    bannerFollowLink.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  if (bannerSponsorLink) {
    bannerSponsorLink.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  // 检查并增加解析次数
  function checkAndIncrementExtractCount(amount = 1) {
    chrome.storage.local.get(['extractCount', 'hasConverted'], function (result) {
      // 如果用户已经转化（点击过关注/赞助），则不再弹窗
      if (result.hasConverted) {
        return;
      }

      let count = result.extractCount || 0;
      count += amount;
      chrome.storage.local.set({ extractCount: count });
      console.log('当前解析次数:', count);

      // 里程碑提醒逻辑：100, 200, 500, 1000...
      // 检查这次增加是否跨越了里程碑
      // 例如：之前是98，增加5变成103，跨越了100
      const prevCount = count - amount;

      const milestones = [100, 200, 500];
      let hitMilestone = false;
      let milestoneValue = 0;

      // 检查固定里程碑
      for (const m of milestones) {
        if (prevCount < m && count >= m) {
          hitMilestone = true;
          milestoneValue = m;
          break;
        }
      }

      // 检查循环里程碑 (每1000)
      if (!hitMilestone && count >= 1000) {
        const prevThousand = Math.floor(prevCount / 1000);
        const currThousand = Math.floor(count / 1000);
        if (currThousand > prevThousand) {
          hitMilestone = true;
          milestoneValue = currThousand * 1000;
        }
      }

      if (hitMilestone) {
        const modal = document.getElementById('followModal');
        if (modal) {
          // 更新弹窗文案中的次数
          const countSpan = modal.querySelector('span[style*="color: #1890ff"]');
          if (countSpan) {
            countSpan.textContent = milestoneValue; // 显示触发的里程碑数值
          }
          modal.style.display = 'flex';
        }
      }
    });
  }
});

// ============================================
// 音频转字幕 - 前端处理函数
// ============================================

function normalizeWhisperLanguageCode(language) {
  if (!language) return 'unknown';

  const normalized = String(language)
    .trim()
    .toLowerCase()
    .replace(/^<\|/, '')
    .replace(/\|>$/, '')
    .replace(/^language:/, '')
    .replace(/^lang:/, '');

  const aliasMap = {
    chinese: 'zh',
    mandarin: 'zh',
    cmn: 'zh',
    yue: 'zh',
    cantonese: 'zh',
    中文: 'zh',
    english: 'en',
    英文: 'en',
    英语: 'en',
    japanese: 'ja',
    日文: 'ja',
    日语: 'ja',
    jp: 'ja',
    korean: 'ko',
    韩文: 'ko',
    韩语: 'ko',
    kr: 'ko',
  };

  const mapped = aliasMap[normalized] || normalized;
  if (mapped.startsWith('zh')) return 'zh';
  if (mapped.startsWith('en')) return 'en';
  if (mapped.startsWith('ja')) return 'ja';
  if (mapped.startsWith('ko')) return 'ko';
  if (/^[a-z]{2,3}$/.test(mapped)) return mapped;
  return 'unknown';
}

function isChineseTranscriptionLanguage(language) {
  return normalizeWhisperLanguageCode(language) === 'zh';
}

function getTranscriptionLanguageName(language) {
  const normalized = normalizeWhisperLanguageCode(language);
  const languageNames = {
    zh: '中文',
    en: '英文',
    ja: '日文',
    ko: '韩文',
    fr: '法文',
    de: '德文',
    es: '西班牙文',
    ru: '俄文',
    it: '意大利文',
    pt: '葡萄牙文',
  };

  return languageNames[normalized] || '未知';
}

function inferTranscriptionLanguageFromText(text) {
  const value = String(text || '');
  if (/[\u4e00-\u9fff]/.test(value)) return 'zh';
  if (/[\u3040-\u30ff]/.test(value)) return 'ja';
  if (/[\uac00-\ud7af]/.test(value)) return 'ko';
  if (/[A-Za-z]/.test(value)) return 'en';
  return 'unknown';
}

function resolveTranscriptionLanguage(language, text) {
  const normalized = normalizeWhisperLanguageCode(language);
  return normalized !== 'unknown' ? normalized : inferTranscriptionLanguageFromText(text);
}

function getWhisperLanguageTokenId(language) {
  const normalized = normalizeWhisperLanguageCode(language);
  if (!frontendWhisperModel || normalized === 'unknown') return null;

  const langToId = frontendWhisperModel.generation_config?.lang_to_id || {};
  return langToId[`<|${normalized}|>`] ?? langToId[normalized] ?? null;
}

function getWhisperTranscribeTokenId() {
  return frontendWhisperModel?.generation_config?.task_to_id?.transcribe ?? null;
}

function getWhisperDecoderStartTokenId() {
  return (
    frontendWhisperModel?.generation_config?.decoder_start_token_id ??
    frontendWhisperModel?.config?.decoder_start_token_id ??
    50258
  );
}

function buildWhisperGenerateOptions(language) {
  return {
    max_new_tokens: 448,
    task: 'transcribe',
    return_timestamps: true,
    num_beams: 1,
    do_sample: false,
  };
}

let frontendWhisperActiveLanguage = 'zh';

function getWhisperLanguagePromptValue(language) {
  const normalized = normalizeWhisperLanguageCode(language);
  const promptValues = {
    zh: 'chinese',
    en: 'english',
    ja: 'japanese',
    ko: 'korean',
  };

  return promptValues[normalized] || normalized || 'chinese';
}

function setFrontendWhisperActiveLanguage(language) {
  const normalized = normalizeWhisperLanguageCode(language);
  frontendWhisperActiveLanguage = normalized !== 'unknown' ? normalized : 'zh';
}

function createWhisperDecoderInputIds(tokenIds) {
  const Tensor = frontendTransformersModule?.Tensor;
  if (typeof Tensor !== 'function') return [tokenIds];

  return new Tensor(
    'int64',
    BigInt64Array.from(tokenIds.map((tokenId) => BigInt(tokenId))),
    [1, tokenIds.length],
  );
}

async function readTensorData(tensor) {
  if (!tensor) return [];

  try {
    if (tensor.data) {
      return Array.from(tensor.data, (value) => Number(value));
    }
  } catch (error) {
    if (typeof tensor.getData !== 'function') {
      throw error;
    }
  }

  if (typeof tensor.getData === 'function') {
    const values = await tensor.getData();
    return Array.from(values, (value) => Number(value));
  }

  return [];
}

function disposeTensorTree(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);

  if (typeof value.dispose === 'function') {
    try {
      value.dispose();
    } catch (error) {
      console.warn('Tensor 释放失败:', error.message);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => disposeTensorTree(item, seen));
    return;
  }

  Object.values(value).forEach((item) => disposeTensorTree(item, seen));
}

async function detectWhisperLanguageFromInputFeatures(inputFeatures, tag = '[单块]') {
  const langToId = frontendWhisperModel?.generation_config?.lang_to_id || {};
  const languageEntries = Object.entries(langToId);
  if (!frontendWhisperModel || languageEntries.length === 0) return 'unknown';

  const decoderInputIds = createWhisperDecoderInputIds([getWhisperDecoderStartTokenId()]);
  let output = null;

  try {
    console.time(`${tag} detect_language`);
    output = await frontendWhisperModel({
      input_features: inputFeatures,
      decoder_input_ids: decoderInputIds,
    });
    console.timeEnd(`${tag} detect_language`);

    const logits = output?.logits;
    const logitsData = await readTensorData(logits);
    const dims = logits?.dims || logits?.shape || [];
    const vocabSize = Number(dims[dims.length - 1] || 0);
    if (!vocabSize || logitsData.length < vocabSize) return 'unknown';

    const sequenceLength = Number(dims[dims.length - 2] || 1);
    const lastTokenOffset = Math.max(0, sequenceLength - 1) * vocabSize;
    let bestLanguage = 'unknown';
    let bestScore = -Infinity;

    for (const [language, tokenId] of languageEntries) {
      const score = logitsData[lastTokenOffset + Number(tokenId)];
      if (typeof score === 'number' && score > bestScore) {
        bestScore = score;
        bestLanguage = normalizeWhisperLanguageCode(language);
      }
    }

    if (bestLanguage !== 'unknown') {
      console.log(`${tag} Whisper 语言探测:`, bestLanguage, getTranscriptionLanguageName(bestLanguage));
    }
    return bestLanguage;
  } catch (error) {
    console.warn(`${tag} Whisper 语言探测失败:`, error.message);
    return 'unknown';
  } finally {
    disposeTensorTree(output);
    disposeTensorTree(decoderInputIds);
  }
}

function detectWhisperLanguageFromTokens(tokenIds) {
  if (!Array.isArray(tokenIds) || tokenIds.length === 0 || !frontendWhisperModel) return 'unknown';

  const langToId = frontendWhisperModel.generation_config?.lang_to_id || {};
  const idToLanguage = new Map(Object.entries(langToId).map(([language, id]) => [Number(id), language]));
  for (const tokenId of tokenIds) {
    const language = idToLanguage.get(Number(tokenId));
    if (language) {
      return normalizeWhisperLanguageCode(language);
    }
  }

  return 'unknown';
}

function detectWhisperLanguageFromMetadata(metadata) {
  return normalizeWhisperLanguageCode(
    metadata?.language || metadata?.lang || metadata?.language_code || metadata?.languageCode,
  );
}

function detectWhisperLanguageFromDecodedText(text) {
  const languageMatch = String(text || '').match(/<\|([a-z]{2,3}(?:-[a-z]{2})?|chinese|english|japanese|korean)\|>/i);
  return normalizeWhisperLanguageCode(languageMatch?.[1]);
}

function formatNonChineseChunksForTxt(chunks, language = null) {
  if (!Array.isArray(chunks) || chunks.length === 0) return '';

  return chunks
    .map((chunk) => cleanTranscriptionText(chunk?.text || '', { language }))
    .filter(Boolean)
    .join('\n');
}

function buildTranscriptionResultFromChunks(chunks, fallbackText, language) {
  const sourceText = Array.isArray(chunks) && chunks.length > 0
    ? chunks.map((chunk) => chunk?.text || '').join('\n')
    : fallbackText;
  const normalizedLanguage = resolveTranscriptionLanguage(language, sourceText);
  const languageName = getTranscriptionLanguageName(normalizedLanguage);

  if (Array.isArray(chunks) && chunks.length > 0) {
    if (isChineseTranscriptionLanguage(normalizedLanguage)) {
      const readableChunks = buildReadableChunksFromTimestamps(chunks);
      const outputChunks = readableChunks.length > 0 ? readableChunks : chunks;
      const text = readableChunks.length > 0 && typeof window.formatReadableChunksForTxt === 'function'
        ? window.formatReadableChunksForTxt(readableChunks)
        : outputChunks.map((chunk) => chunk.text).join('\n');

      return {
        text,
        chunks: outputChunks,
        srtContent: convertToSRT(outputChunks),
        language: normalizedLanguage,
        languageName,
      };
    }

    return {
      text: formatNonChineseChunksForTxt(chunks, normalizedLanguage),
      chunks,
      srtContent: convertToSRT(chunks),
      language: normalizedLanguage,
      languageName,
    };
  }

  const cleanedText = cleanTranscriptionText(fallbackText || '', { language: normalizedLanguage });
  return {
    text: cleanedText,
    chunks: [],
    srtContent: cleanedText,
    language: normalizedLanguage,
    languageName,
  };
}

/**
 * 在前端解码音频数据
 * @param {Array} audioData - 原始音频数据（Uint8Array converted to Array）
 * @returns {Promise<AudioBuffer>}
 */
async function decodeAudioInFrontend(audioData) {
  try {
    console.log('开始在前端解码音频，数据大小:', audioData.length);

    // 将 Array 转回 Uint8Array
    const uint8Array = new Uint8Array(audioData);

    // 创建 AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // 解码音频数据
    const audioBuffer = await audioContext.decodeAudioData(uint8Array.buffer);
    console.log('前端音频解码成功，时长:', audioBuffer.duration, '秒');

    return audioBuffer;
  } catch (error) {
    console.error('前端音频解码失败:', error);
    throw error;
  }
}

/**
 * 将 AudioBuffer 转换为 16kHz 单声道 Float32Array
 * @param {AudioBuffer} audioBuffer
 * @returns {Float32Array}
 */
function audioBufferTo16kHzMono(audioBuffer) {
  const sourceSampleRate = audioBuffer.sampleRate;
  const targetSampleRate = 16000;

  // 如果已经是 16kHz 且为单声道，直接返回
  if (sourceSampleRate === 16000 && audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  // 计算重采样比例
  const ratio = targetSampleRate / sourceSampleRate;
  const targetLength = Math.round(audioBuffer.length * ratio);
  const result = new Float32Array(targetLength);

  // 如果是立体声，混合为单声道
  let channelData;
  if (audioBuffer.numberOfChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    channelData = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      channelData[i] = (left[i] + right[i]) / 2;
    }
  } else {
    channelData = audioBuffer.getChannelData(0);
  }

  // 线性插值重采样
  for (let i = 0; i < targetLength; i++) {
    const srcIndex = i / ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, channelData.length - 1);
    const frac = srcIndex - srcIndexFloor;
    result[i] = channelData[srcIndexFloor] * (1 - frac) + channelData[srcIndexCeil] * frac;
  }

  return result;
}

/**
 * SRT 时间格式转换
 * @param {number} seconds - 秒数
 * @returns {string} HH:MM:SS,mmm 格式
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (num, length = 2) => num.toString().padStart(length, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

/**
 * 将转写结果转换为 SRT 格式
 * @param {Array<{text: string, timestamp: [number, number]}>} segments
 * @returns {string} SRT 格式字符串
 */
function convertToSRT(segments) {
  if (!segments || segments.length === 0) {
    return '';
  }

  let srtContent = '';
  let index = 1;

  for (const segment of segments) {
    // 跳过空文本
    if (!segment.text || !segment.text.trim()) {
      continue;
    }

    // 获取时间戳
    let startSec, endSec;
    if (segment.timestamp && Array.isArray(segment.timestamp)) {
      [startSec, endSec] = segment.timestamp;
    } else if (segment.offsets && Array.isArray(segment.offsets)) {
      startSec = segment.offsets[0] / 1000; // 转换为秒
      endSec = segment.offsets[1] / 1000;
    } else {
      // 如果没有时间戳，使用默认值
      startSec = 0;
      endSec = 0;
    }

    // 格式化时间: HH:MM:SS,mmm
    const startTime = formatSRTTime(startSec);
    const endTime = formatSRTTime(endSec);

    // 清理文本（移除多余空格）
    const text = segment.text.trim();

    srtContent += `${index}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${text}\n\n`;

    index++;
  }

  return srtContent.trim();
}

// 前端 Whisper 转写器
let frontendWhisperModel = null;
let frontendWhisperProcessor = null;
let frontendWhisperTokenizer = null;
let frontendTransformersModule = null;

// 当前使用的模型名称（用于日志）
let currentModelName = '';

/**
 * 检测 WebGPU 是否可用
 * @returns {Promise<boolean>}
 */
async function isWebGPUAvailable() {
  try {
    if (!navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (e) {
    return false;
  }
}

/**
 * 在前端初始化 Whisper 模型
 * 优先使用 WebGPU + whisper-large-v3-turbo（精度高、速度快）
 * 如果 WebGPU 不可用则降级到 WASM + whisper-small（兼容性好）
 * @param {Function} onProgress - 进度回调
 */
async function initFrontendWhisper(onProgress) {
  if (frontendWhisperModel && frontendWhisperProcessor && frontendWhisperTokenizer) {
    return;
  }

  console.log('在前端初始化 Whisper 模型...');

  try {
    // 动态 import Transformers.js
    if (!frontendTransformersModule) {
      console.log('加载 Transformers.js (ES module)...');
      frontendTransformersModule = await import(chrome.runtime.getURL('libs/transformers.min.js'));
      console.log('Transformers.js 加载完成');
    }

    const { AutoModelForSpeechSeq2Seq, AutoProcessor, AutoTokenizer, env } = frontendTransformersModule;

    // 配置本地模型
    env.allowLocalModels = true;
    env.useBrowserCache = false;
    env.localModelPath = chrome.runtime.getURL('models/');

    // 配置 ONNX runtime 使用单线程，避免创建 Web Worker（blob: URL 被 CSP 拦截）
    try {
      env.backends.onnx.wasm.numThreads = 1;
    } catch (e) {
      console.warn('无法设置 ONNX 单线程模式:', e);
    }

    // 配置 ONNX Runtime 从本地加载 WASM/JSEP 文件（避免从 CDN 下载被 CSP 拦截）
    try {
      const libsPath = chrome.runtime.getURL('libs/');
      env.backends.onnx.wasm.wasmPaths = libsPath;
      console.log('ONNX Runtime 本地路径:', libsPath);
    } catch (e) {
      console.warn('无法设置 ONNX 本地路径:', e);
    }

    console.log('模型根路径:', env.localModelPath);

    const progressCallback = (progress_info) => {
      console.log('Whisper 加载进度:', progress_info);
      if (onProgress && progress_info.progress !== undefined) {
        onProgress(progress_info.progress * 0.3, `加载模型 ${Math.round(progress_info.progress)}%`);
      }
    };

    // 尝试 WebGPU 加载，失败则降级到 WASM
    let loaded = false;

    if (await isWebGPUAvailable()) {
      try {
        const gpuModelPath = chrome.runtime.getURL('models/whisper-large-v3-turbo');
        console.log('尝试 WebGPU + whisper-large-v3-turbo...');
        if (onProgress) onProgress(5, 'WebGPU 模式，加载大型模型...');

        frontendWhisperModel = await AutoModelForSpeechSeq2Seq.from_pretrained(gpuModelPath, {
          device: 'webgpu',
          dtype: 'q4f16',
          progress_callback: progressCallback,
        });
        frontendWhisperProcessor = await AutoProcessor.from_pretrained(gpuModelPath);
        frontendWhisperTokenizer = await AutoTokenizer.from_pretrained(gpuModelPath);
        currentModelName = 'whisper-large-v3-turbo';
        loaded = true;
        console.log('WebGPU 模型加载成功');
      } catch (gpuError) {
        console.warn('WebGPU 加载失败，降级到 WASM:', gpuError.message);
        // 清理可能的半加载状态
        frontendWhisperModel = null;
        frontendWhisperProcessor = null;
        frontendWhisperTokenizer = null;
      }
    }

    if (!loaded) {
      const cpuModelPath = chrome.runtime.getURL('models/whisper-small');
      console.log('使用 WASM + whisper-small...');
      if (onProgress) onProgress(5, 'WASM 模式，加载小型模型...');

      frontendWhisperModel = await AutoModelForSpeechSeq2Seq.from_pretrained(cpuModelPath, {
        progress_callback: progressCallback,
      });
      frontendWhisperProcessor = await AutoProcessor.from_pretrained(cpuModelPath);
      frontendWhisperTokenizer = await AutoTokenizer.from_pretrained(cpuModelPath);
      currentModelName = 'whisper-small';
      console.log('WASM 模型加载成功');
    }

    // 运行库未传 language 时会默认英文，这里改成按当前分块语言动态注入。
    frontendWhisperModel.generation_config.return_timestamps = true;
    if (typeof frontendWhisperModel._retrieve_init_tokens === 'function' && !frontendWhisperModel.__subBatchLanguagePatch) {
      const originalRetrieveInitTokens = frontendWhisperModel._retrieve_init_tokens;
      frontendWhisperModel._retrieve_init_tokens = function (generationConfig, ...args) {
        generationConfig.language = getWhisperLanguagePromptValue(frontendWhisperActiveLanguage);
        generationConfig.task = 'transcribe';
        generationConfig.return_timestamps = true;
        return originalRetrieveInitTokens.call(this, generationConfig, ...args);
      };
      frontendWhisperModel.__subBatchLanguagePatch = true;
    }

    console.log('Whisper 模型加载完成:', currentModelName, '(动态语言注入)');
  } catch (error) {
    console.error('在前端初始化 Whisper 失败:', error);
    throw error;
  }
}

/**
 * 在前端转写音频（支持长音频分块处理）
 * Whisper 模型最大处理 30 秒，超过的需要分块再合并
 * @param {AudioBuffer} audioBuffer - 解码后的音频
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<{text: string, chunks: Array, srtContent: string}>}
 */
async function transcribeAudioInFrontend(audioBuffer, onProgress) {
  console.time('⏱️ 转写总耗时');
  try {
    // 初始化 Whisper
    console.time('⏱️ 模型加载');
    await initFrontendWhisper(onProgress);
    console.timeEnd('⏱️ 模型加载');

    if (onProgress) onProgress(40, '模型加载完成，开始转写...');

    // 转换音频为 16kHz 单声道
    const monoAudio = audioBufferTo16kHzMono(audioBuffer);
    const totalDuration = monoAudio.length / 16000;
    console.log('转换后音频样本数:', monoAudio.length, '时长:', totalDuration.toFixed(1), '秒');

    const CHUNK_SECONDS = 30; // 每块 30 秒（Whisper 最大输入）
    const STRIDE_SECONDS = 6; // 块间重叠 6 秒（10秒重叠导致大量重复，6秒足够衔接）
    const SAMPLE_RATE = 16000;
    const chunkSamples = CHUNK_SECONDS * SAMPLE_RATE;
    const strideSamples = STRIDE_SECONDS * SAMPLE_RATE;
    const stepSamples = chunkSamples - strideSamples; // 实际步进 24 秒

    const allChunks = [];
    let mergedText = '';
    let transcriptionLanguage = 'unknown';

    // 如果音频 <= 30 秒，直接处理
    if (monoAudio.length <= chunkSamples) {
      if (onProgress) onProgress(50, '处理音频特征...');
      const { input_features } = await frontendWhisperProcessor(monoAudio);
      if (onProgress) onProgress(55, '开始转写音频...');

      const singleChunkResult = await transcribeSingleChunk(input_features, 0, onProgress);
      transcriptionLanguage = normalizeWhisperLanguageCode(singleChunkResult.language);
      return buildTranscriptionResultFromChunks(
        singleChunkResult.chunks,
        singleChunkResult.text,
        transcriptionLanguage,
      );
    }

    // 长音频：分块处理
    const numChunks = Math.ceil(monoAudio.length / stepSamples);
    console.log('音频分块处理:', numChunks, '块, 每块', CHUNK_SECONDS, '秒, 重叠', STRIDE_SECONDS, '秒');

    let lastBlockEnd = performance.now();

    for (let i = 0; i < numChunks; i++) {
      const blockStart = performance.now();
      console.log(`[块${i + 1}] ⏱ 块间等待: ${(blockStart - lastBlockEnd).toFixed(0)} ms`);
      console.time(`[块${i + 1}] 🔵 整块总耗时`);

      const start = i * stepSamples;
      const end = Math.min(start + chunkSamples, monoAudio.length);
      const audioChunk = monoAudio.slice(start, end);

      // 计算该块在整个音频中的时间偏移
      const timeOffset = start / SAMPLE_RATE;

      const progressBase = 50;
      const progressRange = 45; // 50% ~ 95%
      const chunkProgress = progressBase + (i / numChunks) * progressRange;
      if (onProgress) onProgress(chunkProgress, '转写中...');

      console.log(`处理第 ${i + 1}/${numChunks} 块, 偏移: ${timeOffset.toFixed(1)}秒, 样本: ${start}-${end}`);

      try {
        // 提取特征
        console.time(`[块${i + 1}] extract_features`);
        const { input_features } = await frontendWhisperProcessor(audioChunk);
        console.timeEnd(`[块${i + 1}] extract_features`);

        // 转写单个块
        const chunkLanguage = transcriptionLanguage !== 'unknown' ? transcriptionLanguage : null;
        const chunkResult = await transcribeSingleChunk(input_features, timeOffset, null, i + 1, {
          language: chunkLanguage,
        });

        const chunkDetectedLanguage = resolveTranscriptionLanguage(chunkResult.language, chunkResult.text);
        if (transcriptionLanguage === 'unknown' && chunkDetectedLanguage !== 'unknown') {
          transcriptionLanguage = chunkDetectedLanguage;
          console.log('Whisper 自动识别语言:', transcriptionLanguage, getTranscriptionLanguageName(transcriptionLanguage));
        }

        console.time(`[块${i + 1}] 后处理`);
        if (chunkResult.chunks.length > 0) {
          allChunks.push(...chunkResult.chunks);
        }
        if (chunkResult.text) {
          const activeLanguage = transcriptionLanguage !== 'unknown'
            ? transcriptionLanguage
            : chunkDetectedLanguage;
          const cleanedChunkText = cleanTranscriptionText(chunkResult.text, { language: activeLanguage });
          const deduplicatedChunkText = mergedText
            ? trimLeadingOverlapText(mergedText, cleanedChunkText, activeLanguage)
            : cleanedChunkText;

          if (deduplicatedChunkText) {
            mergedText = mergedText ? `${mergedText}\n${deduplicatedChunkText}` : deduplicatedChunkText;
          }
        }
        console.timeEnd(`[块${i + 1}] 后处理`);
      } catch (chunkError) {
        // OOM 等错误时跳过当前块，继续处理后续块
        console.warn(`第 ${i + 1} 块处理失败（可能内存不足），跳过:`, chunkError.message);
      }

      console.timeEnd(`[块${i + 1}] 🔵 整块总耗时`);
      lastBlockEnd = performance.now();
    }

    if (onProgress) onProgress(95, '合并去重中...');

    // 对重叠区域的片段进行去重（基于时间戳）
    const deduplicatedChunks = deduplicateChunksByTime(allChunks);

    const transcriptionResult = buildTranscriptionResultFromChunks(
      deduplicatedChunks,
      mergedText,
      transcriptionLanguage,
    );

    console.log(
      '全部转写完成, 原始片段:',
      allChunks.length,
      '个, 输出片段:',
      transcriptionResult.chunks.length,
      '个, 语言:',
      transcriptionResult.languageName,
      '文本长度:',
      transcriptionResult.text.length,
    );
    console.timeEnd('⏱️ 转写总耗时');

    return transcriptionResult;
  } catch (error) {
    console.error('前端转写失败:', error);
    throw error;
  }
}

/**
 * 转写单个音频块（30 秒以内）
 * @param {Tensor} input_features - 提取的特征
 * @param {number} timeOffset - 该块在完整音频中的时间偏移（秒）
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<{text: string, chunks: Array, srtContent: string}>}
 */
async function transcribeSingleChunk(input_features, timeOffset, onProgress, chunkIndex, options = {}) {
  let chunks = [];
  let text = '';
  let language = normalizeWhisperLanguageCode(options.language);
  const tag = chunkIndex ? `[块${chunkIndex}]` : '[单块]';

  if (language === 'unknown') {
    language = await detectWhisperLanguageFromInputFeatures(input_features, tag);
    if (language === 'unknown') {
      language = 'zh';
      console.warn(`${tag} Whisper 未识别出语言，兜底使用中文`);
    }
  }
  setFrontendWhisperActiveLanguage(language);

  // 只跑一次 generate（带时间戳），不再 fallback 二次推理
  console.time(`${tag} generate`);
  const output = await frontendWhisperModel.generate(
    { input_features },
    buildWhisperGenerateOptions(language),
  );
  console.timeEnd(`${tag} generate`);

  try {
    console.time(`${tag} decode`);
    let tokenIds = [];
    try {
      const asrResult = await decodeWhisperAsrResult(output);
      tokenIds = asrResult.tokenIds || [];
      language = language !== 'unknown' ? language : normalizeWhisperLanguageCode(asrResult.language);
      const rawChunks = asrResult.chunks;
      const dedupedRawChunks = removeWhisperDuplicates(rawChunks);
      for (const chunk of dedupedRawChunks) {
        chunks.push({
          text: chunk.text,
          timestamp: [chunk.timestamp[0] + timeOffset, chunk.timestamp[1] + timeOffset],
        });
      }
      if (chunks.length > 0) {
        console.log(`${tag} 时间戳解析成功:`, chunks.length, '段');
      }
    } catch (tsError) {
      console.warn(tag, '时间戳解析失败:', tsError.message);
    }

    // 如果时间戳解析没产出 chunks，直接从第一次 output 提取纯文本（不重新推理）
    if (chunks.length === 0) {
      if (tokenIds.length === 0) {
        tokenIds = await extractWhisperTokenIds(output);
      }
      const decodeInput = tokenIds.length > 0 ? [tokenIds] : output;
      const decodedWithTokens = frontendWhisperTokenizer.batch_decode(decodeInput, { skip_special_tokens: false });
      language = language !== 'unknown'
        ? language
        : detectWhisperLanguageFromDecodedText(decodedWithTokens[0] || '');
      const decoded = frontendWhisperTokenizer.batch_decode(decodeInput, { skip_special_tokens: true });
      text = cleanTranscriptionText(decoded[0] || '', { language });
    } else {
      text = chunks.map((c) => c.text).join('\n');
    }
    console.timeEnd(`${tag} decode`);
  } finally {
    disposeWhisperOutput(output);
  }

  const srtContent = chunks.length > 0 ? convertToSRT(chunks) : text;
  const resolvedLanguage = resolveTranscriptionLanguage(language, text);
  return {
    text,
    chunks,
    srtContent,
    language: resolvedLanguage,
    languageName: getTranscriptionLanguageName(resolvedLanguage),
  };
}

function disposeWhisperOutput(output) {
  try {
    disposeTensorTree(output);
  } catch (error) {
    console.warn('Whisper 输出释放失败:', error.message);
  }
}

/**
 * 提取 Whisper generate 输出中的 token ids
 * 兼容 Tensor 和 return_dict_in_generate 风格的返回结构
 * @param {*} output
 * @returns {Promise<number[]>}
 */
async function extractWhisperTokenIds(output) {
  const sequences = output?.sequences || output;
  if (!sequences) return [];

  if (typeof sequences.tolist === 'function') {
    try {
      const values = sequences.tolist();
      return Array.isArray(values[0]) ? values[0].map((v) => Number(v)) : values.map((v) => Number(v));
    } catch (error) {
      if (typeof sequences.getData !== 'function') {
        throw error;
      }
    }
  }

  // WebGPU 输出的 Tensor 数据可能仍在 GPU 上，需要先下载到 CPU 再解码。
  if (typeof sequences.getData === 'function') {
    const values = await sequences.getData();
    const flatValues = Array.from(values, (value) => Number(value));
    const dims = sequences.dims || sequences.shape || [];
    if (Array.isArray(dims) && dims.length >= 2) {
      const sequenceLength = Number(dims[dims.length - 1]);
      return flatValues.slice(0, sequenceLength);
    }
    return flatValues;
  }

  if (Array.isArray(sequences)) {
    return (Array.isArray(sequences[0]) ? sequences[0] : sequences).map((v) => Number(v));
  }

  return [];
}

/**
 * Whisper 时间戳 token 的时间精度（秒）
 * Transformers.js 管线内部也是按 chunk_length / max_source_positions 计算
 * @returns {number}
 */
function getWhisperTimePrecision() {
  const chunkLength = frontendWhisperProcessor?.feature_extractor?.config?.chunk_length || 30;
  const maxSourcePositions = frontendWhisperModel?.config?.max_source_positions || 1500;
  return chunkLength / maxSourcePositions;
}

/**
 * 规范化 Whisper 时间戳分段
 * 某些分段的结束时间可能缺失，这里会优先用下一段开始时间补齐
 * @param {Array<{text: string, timestamp: [number, number]}>} chunks
 * @param {string|null} language
 * @returns {Array<{text: string, timestamp: [number, number]}>}
 */
function normalizeWhisperTimestampChunks(chunks, language = null) {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];

  const normalized = [];
  for (let i = 0; i < chunks.length; i++) {
    const current = chunks[i];
    const cleanedText = cleanTranscriptionText(current?.text || '', { language });
    if (!cleanedText) continue;

    let start = Array.isArray(current?.timestamp) ? current.timestamp[0] : null;
    let end = Array.isArray(current?.timestamp) ? current.timestamp[1] : null;
    const nextStart = Array.isArray(chunks[i + 1]?.timestamp) ? chunks[i + 1].timestamp[0] : null;

    if (typeof start !== 'number' || Number.isNaN(start)) continue;

    if (typeof end !== 'number' || Number.isNaN(end) || end <= start) {
      if (typeof nextStart === 'number' && nextStart > start) {
        end = nextStart;
      } else {
        const estimatedDuration = Math.min(4, Math.max(0.6, cleanedText.length * 0.18));
        end = start + estimatedDuration;
      }
    }

    normalized.push({
      text: cleanedText,
      timestamp: [start, end],
    });
  }

  return normalized;
}

/**
 * 使用 Transformers.js 内置 Whisper ASR 解码拿结构化时间戳
 * 如果官方路径失败，再降级到字符串时间戳解析
 * @param {*} output
 * @returns {Array<{text: string, timestamp: [number, number]}>}
 */
async function decodeWhisperAsrResult(output) {
  const tokenIds = await extractWhisperTokenIds(output);
  if (tokenIds.length === 0) {
    return {
      chunks: [],
      language: 'unknown',
      tokenIds: [],
    };
  }

  const tokenizer = frontendWhisperTokenizer;
  const timePrecision = getWhisperTimePrecision();
  let language = detectWhisperLanguageFromTokens(tokenIds);

  if (tokenizer && typeof tokenizer._decode_asr === 'function') {
    try {
      const [, metadata] = tokenizer._decode_asr(
        [{ tokens: tokenIds }],
        {
          time_precision: timePrecision,
          return_timestamps: true,
          force_full_sequences: false,
        },
      );
      const metadataLanguage = detectWhisperLanguageFromMetadata(metadata);
      if (metadataLanguage !== 'unknown') {
        language = metadataLanguage;
      }
      const officialChunks = normalizeWhisperTimestampChunks(metadata?.chunks || [], language);
      if (officialChunks.length > 0) {
        return {
          chunks: officialChunks,
          language,
          tokenIds,
        };
      }
    } catch (officialError) {
      console.warn('Whisper 官方时间戳解码失败，回退到字符串解析:', officialError.message);
    }
  }

  const decodedWithTs = tokenizer.batch_decode([tokenIds], {
    skip_special_tokens: false,
    decode_with_timestamps: true,
    time_precision: timePrecision,
  });
  const decodedLanguage = detectWhisperLanguageFromDecodedText(decodedWithTs[0] || '');
  if (decodedLanguage !== 'unknown') {
    language = decodedLanguage;
  }

  return {
    chunks: normalizeWhisperTimestampChunks(parseTimestampChunks(decodedWithTs[0] || '', language), language),
    language,
    tokenIds,
  };
}

async function decodeWhisperTimestampChunks(output) {
  return (await decodeWhisperAsrResult(output)).chunks;
}

/**
 * 按停顿、长度和常见连接词将时间戳片段整理成更可读的分段
 * 目标不是做正式字幕，而是让 TXT 导出更接近自然语义断句
 * @param {Array<{text: string, timestamp: [number, number]}>} chunks
 * @returns {Array<{text: string, timestamp: [number, number]}>}
 */
function buildReadableChunksFromTimestamps(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];

  const sortedChunks = [...chunks]
    .filter((chunk) => chunk?.text && Array.isArray(chunk?.timestamp) && typeof chunk.timestamp[0] === 'number')
    .sort((a, b) => a.timestamp[0] - b.timestamp[0]);

  if (sortedChunks.length === 0) return [];

  const STRONG_BREAK_GAP = 0.78;
  const SOFT_BREAK_GAP = 0.36;
  const TARGET_CHARS = 18;
  const MAX_CHARS = 22;
  const MAX_DURATION = 5.2;
  const sentenceStarters = ['但是', '不过', '所以', '因此', '另外', '后来', '最后', '与此同时', '总之', '接下来', '然后', '那'];

  const result = [];
  let current = null;

  for (const chunk of sortedChunks) {
    const text = cleanTranscriptionText(chunk.text);
    if (!text) continue;

    const [start, end] = chunk.timestamp;

    if (!current) {
      current = {
        text,
        timestamp: [start, end],
      };
      continue;
    }

    const gap = Math.max(0, start - current.timestamp[1]);
    const currentDuration = Math.max(0, current.timestamp[1] - current.timestamp[0]);
    const currentText = current.text;
    const shouldBreakBefore =
      /[。！？!?；;]$/.test(currentText) ||
      gap >= STRONG_BREAK_GAP ||
      currentText.length >= MAX_CHARS ||
      currentDuration >= MAX_DURATION ||
      (gap >= SOFT_BREAK_GAP && currentText.length >= TARGET_CHARS) ||
      (gap >= 0.22 && currentText.length >= 16 && sentenceStarters.some((starter) => text.startsWith(starter)));

    if (shouldBreakBefore) {
      result.push(current);
      current = {
        text,
        timestamp: [start, end],
      };
      continue;
    }

    current.text = joinReadableChunkText(current.text, text);
    current.timestamp[1] = Math.max(current.timestamp[1], end);
  }

  if (current) {
    result.push(current);
  }

  return polishReadableChunks(mergeShortReadableChunks(result));
}

/**
 * 连接两个转写片段文本
 * 中文默认直接拼接，英文/数字边界补一个空格避免粘连
 * @param {string} previousText
 * @param {string} currentText
 * @returns {string}
 */
function joinReadableChunkText(previousText, currentText) {
  if (!previousText) return currentText;
  if (!currentText) return previousText;

  const prevLastChar = previousText.slice(-1);
  const currentFirstChar = currentText[0];
  const needsSpace = /[A-Za-z0-9]$/.test(prevLastChar) && /^[A-Za-z0-9]/.test(currentFirstChar);

  return `${previousText}${needsSpace ? ' ' : ''}${currentText}`;
}

/**
 * 合并过短的可读分段，避免导出时出现碎片化短句
 * @param {Array<{text: string, timestamp: [number, number]}>} chunks
 * @returns {Array<{text: string, timestamp: [number, number]}>}
 */
function mergeShortReadableChunks(chunks) {
  if (!Array.isArray(chunks) || chunks.length <= 1) return chunks;

  const result = [];
  for (const chunk of chunks) {
    const last = result[result.length - 1];
    const gap = last ? Math.max(0, chunk.timestamp[0] - last.timestamp[1]) : 0;

    if (last && chunk.text.length <= 8 && gap < 0.28 && !/[。！？!?；;]$/.test(last.text)) {
      last.text = joinReadableChunkText(last.text, chunk.text);
      last.timestamp[1] = Math.max(last.timestamp[1], chunk.timestamp[1]);
      continue;
    }

    result.push({
      text: chunk.text,
      timestamp: [...chunk.timestamp],
    });
  }

  return result;
}

/**
 * 再做一层语义修整，把明显孤立的短句并回前后语境
 * 例如“与视觉”“放开下手”“最后我们来看一下”这类不应单独成行的片段
 * @param {Array<{text: string, timestamp: [number, number]}>} chunks
 * @returns {Array<{text: string, timestamp: [number, number]}>}
 */
function polishReadableChunks(chunks) {
  if (!Array.isArray(chunks) || chunks.length <= 1) return chunks;

  const result = [];
  for (let i = 0; i < chunks.length; i++) {
    const current = {
      text: chunks[i].text,
      timestamp: [...chunks[i].timestamp],
    };
    const previous = result[result.length - 1];
    const next = chunks[i + 1];

    if (previous && shouldMergeReadableChunkBackward(previous, current)) {
      previous.text = joinReadableChunkText(previous.text, current.text);
      previous.timestamp[1] = Math.max(previous.timestamp[1], current.timestamp[1]);
      continue;
    }

    if (next && shouldMergeReadableChunkForward(current, next, previous)) {
      result.push({
        text: joinReadableChunkText(current.text, next.text),
        timestamp: [current.timestamp[0], next.timestamp[1]],
      });
      i++;
      continue;
    }

    result.push(current);
  }

  return result;
}

function shouldMergeReadableChunkBackward(previous, current) {
  if (!previous || !current) return false;
  if (/[。！？!?；;]$/.test(previous.text)) return false;

  const gap = Math.max(0, current.timestamp[0] - previous.timestamp[1]);
  const combinedText = joinReadableChunkText(previous.text, current.text);
  const combinedDuration = Math.max(0, current.timestamp[1] - previous.timestamp[0]);

  if (gap > 0.28 || combinedText.length > 32 || combinedDuration > 6.4) {
    return false;
  }

  return (
    current.text.length <= 6 ||
    startsWithReadableContinuationMarker(current.text) ||
    (current.text.length <= 12 && endsWithReadableWeakCue(previous.text)) ||
    (current.text.length <= 10 && gap < 0.18)
  );
}

function shouldMergeReadableChunkForward(current, next, previous) {
  if (!current || !next) return false;
  if (/[。！？!?；;]$/.test(current.text)) return false;

  const gap = Math.max(0, next.timestamp[0] - current.timestamp[1]);
  const combinedText = joinReadableChunkText(current.text, next.text);
  const combinedDuration = Math.max(0, next.timestamp[1] - current.timestamp[0]);

  if (gap > 0.22 || combinedText.length > 30 || combinedDuration > 6.0) {
    return false;
  }

  return (
    isLikelyReadableIntro(current.text) ||
    (current.text.length <= 8 && (!previous || /[。！？!?；;]$/.test(previous.text)))
  );
}

function startsWithReadableContinuationMarker(text) {
  return /^(与|和|而|并|但|却|还|也|再|又|并且|而且|以及|或者|后面|同时|甚至|包括|比如|像|跟|把|让|给|向|对|从|在|将|就|都|会|要)/.test(text || '');
}

function endsWithReadableWeakCue(text) {
  return /([的地得着了过和与及并而但把让给向对从在为被]|都有|还有|以及|或者|然后|后面|前面|通过|为了|如果|因为|就是|这个|那个)$/.test(text || '');
}

function isLikelyReadableIntro(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || trimmed.length > 14) return false;

  return /^(好|好那|那|然后|接下来|最后|下面|本周|那我们|我们先|我们再|先来看|再来看|来看一下|最后我们来看一下|好那最后)/i.test(trimmed);
}

/**
 * 解析 Whisper 带时间戳的输出
 * @param {string} text - Whisper 输出的带 <|0.00|> 格式时间戳的文本
 * @param {string|null} language
 * @returns {Array<{text: string, timestamp: [number, number]}>}
 */
function parseTimestampChunks(text, language = null) {
  const chunks = [];
  const timestampRegex = /<\|(\d+\.\d+)\|>/g;
  let matches = [];
  let match;
  while ((match = timestampRegex.exec(text)) !== null) {
    matches.push({ time: parseFloat(match[1]), index: match.index, length: match[0].length });
  }

  for (let i = 0; i < matches.length - 1; i += 2) {
    const start = matches[i].time;
    const end = matches[i + 1] ? matches[i + 1].time : start + 1;
    const textStart = matches[i].index + matches[i].length;
    const textEnd = matches[i + 1] ? matches[i + 1].index : text.length;
    const chunkText = cleanTranscriptionText(text.substring(textStart, textEnd).trim(), { language });
    if (chunkText) {
      chunks.push({ text: chunkText, timestamp: [start, end] });
    }
  }
  return chunks;
}

/**
 * 繁体中文转简体中文
 * Whisper 模型有时会输出繁体字，需要后处理转成简体
 * @param {string} text - 包含繁体字的文本
 * @returns {string} 简体中文文本
 */
function traditionalToSimplified(text) {
  if (!text) return text;
  const map = {
    強: '强',
    驚: '惊',
    寫: '写',
    驗: '验',
    錯: '错',
    誤: '误',
    執: '执',
    絕: '绝',
    體: '体',
    嚴: '严',
    穩: '稳',
    總: '总',
    結: '结',
    構: '构',
    創: '创',
    確: '确',
    認: '认',
    壓: '压',
    證: '证',
    權: '权',
    離: '离',
    實: '实',
    調: '调',
    規: '规',
    處: '处',
    將: '将',
    過: '过',
    個: '个',
    當: '当',
    發: '发',
    為: '为',
    對: '对',
    從: '从',
    會: '会',
    時: '时',
    說: '说',
    長: '长',
    開: '开',
    種: '种',
    還: '还',
    進: '进',
    間: '间',
    問: '问',
    無: '无',
    點: '点',
    經: '经',
    動: '动',
    現: '现',
    這: '这',
    樣: '样',
    機: '机',
    電: '电',
    讓: '让',
    該: '该',
    應: '应',
    關: '关',
    斷: '断',
    號: '号',
    業: '业',
    產: '产',
    辦: '办',
    場: '场',
    帶: '带',
    運: '运',
    連: '连',
    選: '选',
    達: '达',
    須: '须',
    據: '据',
    備: '备',
    餘: '余',
    環: '环',
    紀: '纪',
    錄: '录',
    養: '养',
    續: '续',
    語: '语',
    課: '课',
    請: '请',
    論: '论',
    講: '讲',
    謝: '谢',
    護: '护',
    讀: '读',
    變: '变',
    豐: '丰',
    費: '费',
    資: '资',
    質: '质',
    購: '购',
    車: '车',
    軍: '军',
    軟: '软',
    輕: '轻',
    輛: '辆',
    轉: '转',
    輸: '输',
    辨: '辨',
    迴: '回',
    週: '周',
    鈎: '钩',
    銀: '银',
    銅: '铜',
    鏡: '镜',
    鐘: '钟',
    鐵: '铁',
    門: '门',
    閉: '闭',
    陽: '阳',
    際: '际',
    隨: '随',
    險: '险',
    雜: '杂',
    雙: '双',
    雞: '鸡',
    難: '难',
    雲: '云',
    靜: '静',
    靈: '灵',
    響: '响',
    頁: '页',
    頂: '顶',
    項: '项',
    順: '顺',
    預: '预',
    頻: '频',
    題: '题',
    顧: '顾',
    額: '额',
    願: '愿',
    類: '类',
    顏: '颜',
    風: '风',
    飛: '飞',
    飯: '饭',
    飲: '饮',
    饋: '馈',
    館: '馆',
    馬: '马',
    馮: '冯',
    駐: '驻',
    驅: '驱',
    駕: '驾',
    驗: '验',
    骯: '脏',
    髒: '脏',
    體: '体',
    高: '高',
    髮: '发',
    鬥: '斗',
    鬧: '闹',
    鹽: '盐',
    麗: '丽',
    麥: '麦',
    黃: '黄',
    點: '点',
    齊: '齐',
    齒: '齿',
    齡: '龄',
    龍: '龙',
    龜: '龟',
    鑑: '鉴',
    鑒: '鉴',
    鑰: '钥',
    鐵: '铁',
    鎮: '镇',
    鏈: '链',
    鎖: '锁',
    鍊: '链',
    鍋: '锅',
    鍾: '钟',
    鍵: '键',
    鍛: '锻',
    鎢: '钨',
    鎳: '镍',
    鎖: '锁',
    鎮: '镇',
    鐳: '镭',
    鐵: '铁',
    鑄: '铸',
    鑒: '鉴',
    鑰: '钥',
    鑽: '钻',
    鑾: '銮',
    門: '门',
    閃: '闪',
    閉: '闭',
    開: '开',
    閏: '闰',
    閑: '闲',
    閒: '闲',
    間: '间',
    閣: '阁',
    閥: '阀',
    閨: '闺',
    閩: '闽',
    閫: '阃',
    閬: '阆',
    閭: '闾',
    閱: '阅',
    閶: '阊',
    閹: '阉',
    閻: '阎',
    閼: '阏',
    閽: '阍',
    閾: '阈',
    閿: '阌',
    闆: '板',
    闈: '闱',
    闊: '阔',
    闋: '阕',
    闌: '阑',
    闍: '阇',
    闐: '阗',
    闒: '闼',
    闓: '闿',
    闔: '阖',
    闕: '阙',
    闖: '闯',
    闗: '关',
    闘: '斗',
    關: '关',
    闚: '窥',
    闛: '闶',
    關: '关',
    闞: '阚',
    闟: '闿',
    闠: '闳',
    闡: '阐',
    闢: '辟',
    闤: '闳',
    闥: '闼',
    鹵: '卤',
    鹹: '咸',
    麗: '丽',
    麵: '面',
    麻: '麻',
    黃: '黄',
    黌: '黉',
    黎: '黎',
    點: '点',
    齊: '齐',
    齋: '斋',
    齎: '赍',
    齏: '齑',
    齒: '齿',
    齕: '龁',
    齗: '龂',
    齙: '龅',
    齚: '龁',
    齛: '龁',
    齜: '龇',
    齝: '龁',
    齞: '龁',
    齟: '龃',
    齠: '龆',
    齡: '龄',
    齣: '出',
    齦: '龈',
    齧: '啮',
    齨: '龁',
    齩: '咬',
    齪: '龊',
    齬: '龉',
    齮: '龁',
    齯: '龁',
    齲: '龋',
    齳: '龁',
    齴: '龁',
    齵: '龁',
    齶: '腭',
    齷: '龌',
    龍: '龙',
    龐: '庞',
    龑: '龑',
    龔: '龚',
    龕: '龛',
    龗: '龗',
    龘: '龘',
    龜: '龟',
    龠: '龠',
    龢: '和',
    龣: '龣',
    龤: '龤',
    龥: '龥',
    裡: '里',
    後: '后',
    裏: '里',
    於: '于',
    幾: '几',
    與: '与',
    沒: '没',
    來: '来',
    歲: '岁',
    歷: '历',
    書: '书',
    東: '东',
    兩: '两',
    區: '区',
    國: '国',
    報: '报',
    準: '准',
    術: '术',
    條: '条',
    機: '机',
    極: '极',
    標: '标',
    檢: '检',
    欄: '栏',
    歸: '归',
    歷: '历',
    殘: '残',
    殺: '杀',
    殼: '壳',
    毀: '毁',
    每: '每',
    比: '比',
    畢: '毕',
    異: '异',
    當: '当',
    痙: '痉',
    痛: '痛',
    發: '发',
    盡: '尽',
    監: '监',
    盤: '盘',
    目: '目',
    直: '直',
    相: '相',
    省: '省',
    看: '看',
    真: '真',
    著: '着',
    視: '视',
    計: '计',
    討: '讨',
    訓: '训',
    設: '设',
    許: '许',
    訴: '诉',
    診: '诊',
    註: '注',
    評: '评',
    証: '证',
    詞: '词',
    詢: '询',
    試: '试',
    詩: '诗',
    話: '话',
    該: '该',
    詳: '详',
    語: '语',
    誠: '诚',
    誤: '误',
    說: '说',
    誰: '谁',
    課: '课',
    調: '调',
    談: '谈',
    請: '请',
    論: '论',
    諸: '诸',
    諾: '诺',
    謀: '谋',
    謁: '谒',
    謂: '谓',
    謊: '谎',
    謝: '谢',
    講: '讲',
    證: '证',
    識: '识',
    譜: '谱',
    警: '警',
    議: '议',
    護: '护',
    讀: '读',
    變: '变',
    讓: '让',
    豐: '丰',
    豬: '猪',
    貓: '猫',
    財: '财',
    責: '责',
    販: '贩',
    貫: '贯',
    貨: '货',
    質: '质',
    購: '购',
    貪: '贪',
    貧: '贫',
    貫: '贯',
    貳: '贰',
    貴: '贵',
    貶: '贬',
    貸: '贷',
    貿: '贸',
    費: '费',
    賀: '贺',
    賊: '贼',
    賓: '宾',
    賜: '赐',
    賞: '赏',
    賠: '赔',
    賢: '贤',
    賣: '卖',
    賦: '赋',
    賭: '赌',
    賴: '赖',
    賺: '赚',
    賻: '赙',
    購: '购',
    賽: '赛',
    贊: '赞',
    贈: '赠',
    贊: '赞',
    贏: '赢',
    赤: '赤',
    趕: '赶',
    趙: '赵',
    趨: '趋',
    躍: '跃',
    身: '身',
    車: '车',
    軌: '轨',
    軍: '军',
    軟: '软',
    軸: '轴',
    較: '较',
    載: '载',
    輔: '辅',
    輕: '轻',
    輛: '辆',
    輝: '辉',
    輥: '辊',
    輦: '辇',
    輩: '辈',
    輪: '轮',
    輯: '辑',
    輸: '输',
    輻: '辐',
    輳: '辏',
    輾: '辗',
    轄: '辖',
    轅: '辕',
    轉: '转',
    轆: '辘',
    轉: '转',
    轎: '轿',
    轔: '辚',
    轟: '轰',
    轡: '辔',
    轢: '轹',
    轡: '辔',
    轣: '辚',
    轤: '轳',
    車: '车',
  };
  return text
    .split('')
    .map((c) => map[c] || c)
    .join('');
}

/**
 * 清理转写文本：移除 <|X.XX|> 时间戳标记、多余空白
 * @param {string} text - 原始转写文本
 * @param {{language?: string|null}|string|null} options - 文本语言，中文才做繁简转换
 * @returns {string} 清理后的文本
 */
function cleanTranscriptionText(text, options = {}) {
  if (!text) return text;
  const language = typeof options === 'string' ? options : options?.language;

  // 移除 <|X.XX|> 时间戳标记
  let cleaned = text.replace(/<\|\d+\.\d+\|>/g, '');

  if (isLikelyGarbledText(cleaned)) {
    return '';
  }

  // 繁简转换只适用于中文；日文等非中文里存在共用汉字，不能直接套中文映射。
  if (shouldApplyChineseTextNormalization(language)) {
    cleaned = traditionalToSimplified(cleaned);
  }

  // 只剩少量替换符时直接删除，整行明显乱码时上面已经过滤。
  cleaned = cleaned.replace(/\uFFFD/g, '');
  // 移除多余空格
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (isLikelyGarbledText(cleaned)) {
    return '';
  }

  return cleaned;
}

function shouldApplyChineseTextNormalization(language) {
  const normalizedLanguage = normalizeWhisperLanguageCode(language);
  return normalizedLanguage === 'unknown' || normalizedLanguage === 'zh';
}

function isLikelyGarbledText(text) {
  const value = String(text || '').trim();
  if (!value) return false;

  const replacementCount = (value.match(/\uFFFD/g) || []).length;
  if (replacementCount === 0) return false;

  const visibleLength = Math.max(1, value.replace(/\s/g, '').length);
  return (
    /\uFFFD{2,}/.test(value) ||
    replacementCount >= 3 ||
    replacementCount / visibleLength >= 0.2
  );
}

/**
 * 构建文本去重用的标准化索引映射
 * 便于找到“标准化后重叠部分”在原始文本中的裁剪位置
 * @param {string} text
 * @param {string|null} language
 * @returns {{cleaned: string, normalized: string, indexMap: number[]}}
 */
function buildNormalizedTextIndexMap(text, language = null) {
  const cleaned = cleanTranscriptionText(text || '', { language });
  const normalizedChars = [];
  const indexMap = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (/[\s，,。！？!?；;、:："“”'‘’（）()【】\[\]{}·…—\-_]/.test(char)) {
      continue;
    }
    normalizedChars.push(char);
    indexMap.push(i);
  }

  return {
    cleaned,
    normalized: normalizedChars.join(''),
    indexMap,
  };
}

/**
 * 计算两段文本公共前缀长度
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function getCommonPrefixLength(a, b) {
  const maxLength = Math.min(a.length, b.length);
  let i = 0;
  while (i < maxLength && a[i] === b[i]) {
    i++;
  }
  return i;
}

/**
 * 查找相邻音频块文本的重叠长度
 * 先做精确匹配，再做“公共前缀 + 高相似度”的模糊匹配
 * @param {string} previousNormalized
 * @param {string} currentNormalized
 * @returns {number}
 */
function findChunkTextOverlapLength(previousNormalized, currentNormalized) {
  const MIN_EXACT_OVERLAP = 10;
  const MIN_FUZZY_OVERLAP = 14;
  const MAX_OVERLAP_SCAN = 160;
  const FUZZY_SIMILARITY_THRESHOLD = 0.86;

  if (!previousNormalized || !currentNormalized) return 0;

  const maxOverlap = Math.min(previousNormalized.length, currentNormalized.length, MAX_OVERLAP_SCAN);
  if (maxOverlap < MIN_EXACT_OVERLAP) return 0;

  for (let len = maxOverlap; len >= MIN_EXACT_OVERLAP; len--) {
    const previousSuffix = previousNormalized.slice(-len);
    const currentPrefix = currentNormalized.slice(0, len);

    if (previousSuffix === currentPrefix) {
      return len;
    }

    if (len >= MIN_FUZZY_OVERLAP) {
      const commonPrefixLength = getCommonPrefixLength(previousSuffix, currentPrefix);
      if (commonPrefixLength >= Math.min(10, len - 2)) {
        const similarity = computeTextSimilarity(previousSuffix, currentPrefix);
        if (similarity >= FUZZY_SIMILARITY_THRESHOLD) {
          return len;
        }
      }
    }
  }

  return 0;
}

/**
 * 裁剪当前音频块开头与上一块重叠的文本
 * 在 6 秒重叠不变的前提下，尽量减少 TXT 中的重复内容
 * @param {string} previousText
 * @param {string} currentText
 * @param {string|null} language
 * @returns {string}
 */
function trimLeadingOverlapText(previousText, currentText, language = null) {
  const previousIndexMap = buildNormalizedTextIndexMap((previousText || '').slice(-320), language);
  const currentIndexMap = buildNormalizedTextIndexMap(currentText, language);

  if (!previousIndexMap.normalized || !currentIndexMap.normalized) {
    return currentIndexMap.cleaned;
  }

  const overlapLength = findChunkTextOverlapLength(previousIndexMap.normalized, currentIndexMap.normalized);
  if (overlapLength <= 0) {
    return currentIndexMap.cleaned;
  }

  if (overlapLength >= currentIndexMap.indexMap.length) {
    console.log(`TXT重叠裁剪: 当前块完全重复，跳过 ${overlapLength} 个归一化字符`);
    return '';
  }

  const cutIndex = currentIndexMap.indexMap[overlapLength - 1] + 1;
  const trimmed = currentIndexMap.cleaned.slice(cutIndex).trim();

  if (trimmed) {
    console.log(`TXT重叠裁剪: 删除 ${overlapLength} 个归一化字符`);
  }

  return trimmed;
}

/**
 * 基于时间戳对重叠区域的转写片段去重
 * 当多个音频块有重叠时，同一段语音可能被转写两次，需要去除重复
 * @param {Array<{text: string, timestamp: [number, number]}>} chunks
 * @returns {Array} 去重后的片段数组
 */
function deduplicateChunksByTime(chunks) {
  if (!chunks || chunks.length <= 1) return chunks;

  // 按开始时间排序
  const sorted = [...chunks].sort((a, b) => a.timestamp[0] - b.timestamp[0]);
  const result = [];

  for (const chunk of sorted) {
    const start = chunk.timestamp[0];
    const end = chunk.timestamp[1];
    const duration = end - start;

    // 跳过无效片段（时长为0或负数）
    if (duration <= 0) continue;

    // 检查是否与已添加的片段有超过 50% 的时间重叠
    let isDuplicate = false;
    for (let i = result.length - 1; i >= 0; i--) {
      const existing = result[i];
      // 只检查时间接近的片段（优化性能）
      if (existing.timestamp[1] < start - 2) break;

      const overlapStart = Math.max(start, existing.timestamp[0]);
      const overlapEnd = Math.min(end, existing.timestamp[1]);
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);

      // 如果重叠超过片段时长的 50%，认为是重复
      if (duration > 0 && overlapDuration / duration > 0.5) {
        // 如果新片段文本更长，替换旧的
        if (chunk.text.length > existing.text.length) {
          result[i] = chunk;
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(chunk);
    }
  }

  console.log(`去重: ${chunks.length} 个片段 → ${result.length} 个片段`);
  return result;
}

/**
 * 去除 Whisper 幻觉产生的重复片段
 * Whisper 常见幻觉模式：在块末尾重复已输出的文本，或输出前缀重叠的内容
 * @param {Array<{text: string, timestamp: [number, number]}>} chunks
 * @returns {Array} 去重后的片段
 */
function removeWhisperDuplicates(chunks) {
  if (!chunks || chunks.length <= 1) return chunks;
  const result = [chunks[0]];
  const normalize = (t) => t.replace(/[，,。！？!?；;、\s]/g, '');

  for (let i = 1; i < chunks.length; i++) {
    const current = chunks[i];
    const prev = result[result.length - 1];
    const currText = current.text.trim();
    const prevText = prev.text.trim();
    const currNorm = normalize(currText);
    const prevNorm = normalize(prevText);

    // 1. 完全相同（原文或标准化后）
    if (currText === prevText || (currNorm === prevNorm && currNorm.length >= 4)) {
      console.log('Whisper去重: 完全重复:', currText.substring(0, 30));
      continue;
    }

    // 长度比率（避免长文本误杀短文本）
    const minLen = Math.min(currNorm.length, prevNorm.length);
    const maxLen = Math.max(currNorm.length, prevNorm.length);
    const lenRatio = minLen / maxLen;

    // 2. 子串包含：仅当短文本占长文本 60% 以上
    if (minLen >= 6 && lenRatio > 0.6) {
      if (currNorm.includes(prevNorm)) {
        console.log('Whisper去重: 用更长的片段替换');
        result[result.length - 1] = current;
        continue;
      }
      if (prevNorm.includes(currNorm)) {
        console.log('Whisper去重: 保留更长的已有片段');
        continue;
      }
    }

    // 3. 模糊匹配：仅当长度接近（比率>0.5）且都 >= 8 字符，阈值 0.8
    if (minLen >= 8 && lenRatio > 0.5) {
      const similarity = computeTextSimilarity(currNorm, prevNorm);
      if (similarity > 0.8) {
        console.log('Whisper去重: 模糊匹配:', similarity.toFixed(2), currText.substring(0, 20));
        if (currText.length >= prevText.length) {
          result[result.length - 1] = current;
        }
        continue;
      }
    }

    result.push(current);
  }

  return result;
}

/**
 * 去除文本中连续重复的行（TXT 导出的安全网）
 * @param {string} text
 * @returns {string}
 */
function removeDuplicateTextLines(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const result = [];
  const normalizedResults = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push('');
        normalizedResults.push('');
      }
      continue;
    }

    // 标准化：去除所有标点和空格
    const normalized = trimmed.replace(/[，,。！？!?；;、\s\n:：""''""''（）()\【】[\]{}·…—\-_]/g, '');
    if (!normalized) {
      result.push(line);
      normalizedResults.push(normalized);
      continue;
    }

    let isDuplicate = false;

    // 只检查最近 3 行（避免长文本误杀远处的短句）
    const windowStart = Math.max(0, result.length - 3);
    for (let j = result.length - 1; j >= windowStart; j--) {
      const prevNormalized = normalizedResults[j];
      if (!prevNormalized || prevNormalized.length < 4) continue;

      // 1. 标准化后完全相同 → 一定是重复
      if (normalized === prevNormalized) {
        isDuplicate = true;
        break;
      }

      // 计算长度比率（短/长），只有长度接近才做子串和模糊匹配
      const minLen = Math.min(normalized.length, prevNormalized.length);
      const maxLen = Math.max(normalized.length, prevNormalized.length);
      const lenRatio = minLen / maxLen;

      // 2. 子串包含：仅当短文本占长文本 70% 以上时才视为重复
      //    这样可以避免100字长行包含8字短句被误删
      if (minLen >= 10 && lenRatio > 0.7) {
        if (prevNormalized.includes(normalized)) {
          isDuplicate = true;
          break;
        }
        if (normalized.includes(prevNormalized)) {
          result[j] = line;
          normalizedResults[j] = normalized;
          isDuplicate = true;
          break;
        }
      }

      // 3. 模糊匹配：仅当长度比率 > 0.6 且都 >= 10 字符
      if (minLen >= 10 && lenRatio > 0.6) {
        const similarity = computeTextSimilarity(normalized, prevNormalized);
        if (similarity > 0.8) {
          if (trimmed.length >= result[j].trim().length) {
            result[j] = line;
            normalizedResults[j] = normalized;
          }
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      result.push(line);
      normalizedResults.push(normalized);
    }
  }

  return result.join('\n');
}

/**
 * 计算两段文本的字符级相似度（基于字符频率的交集）
 * 用于检测 Whisper 输出中只有个别字符差异的重复句
 * @param {string} a
 * @param {string} b
 * @returns {number} 0~1 的相似度
 */
function computeTextSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aChars = [...a];
  const bChars = [...b];
  // 统计字符频率
  const freqA = {};
  for (const c of aChars) freqA[c] = (freqA[c] || 0) + 1;
  const freqB = {};
  for (const c of bChars) freqB[c] = (freqB[c] || 0) + 1;
  // 计算交集
  let common = 0;
  for (const c in freqA) {
    if (freqB[c]) common += Math.min(freqA[c], freqB[c]);
  }
  return common / Math.max(aChars.length, bChars.length);
}
