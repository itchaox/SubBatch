document.addEventListener('DOMContentLoaded', function () {
  const getUrlBtn = document.querySelector('.get-url-btn');
  const tableUrlInput = document.getElementById('tableUrl');
  const clearBtn = document.querySelector('.clear-btn');
  const hideSidebarCheckbox = document.getElementById('hideSidebar');
  const hideHeaderCheckbox = document.getElementById('hideHeader');
  const hideViewCreateCheckbox = document.getElementById('hideViewCreate');
  const openMarketCheckbox = document.getElementById('openMarket');
  const sidebarWidthInput = document.getElementById('sidebarWidth');
  const pluginsTableBody = document.getElementById('pluginsTableBody');
  const pluginSearchInput = document.getElementById('pluginSearch');
  const searchClearBtn = document.querySelector('.search-clear-btn');
  const totalCountElement = document.getElementById('totalCount');
  const generateUrlBtn = document.getElementById('generateUrlBtn');
  const previewBtn = document.getElementById('previewBtn');
  const copyBtn = document.getElementById('copyBtn');
  const previewCopyGroup = document.querySelector('.preview-copy-group');
  const sponsorBtn = document.getElementById('sponsorBtn');
  const errorToast = document.getElementById('errorToast');
  const followBtn = document.getElementById('followBtn');
  const successToast = document.getElementById('successToast');
  const selectedPluginElement = document.getElementById('selectedPlugin');
  const selectedPluginNameElement = document.getElementById('selectedPluginName');
  const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');

  let plugins = window.data || [];
  let filteredPlugins = [...plugins];
  let selectedPluginId = null;
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

  // 更新总条数显示
  function updateTotalCount() {
    totalCountElement.textContent = filteredPlugins.length;
  }

  // 清空搜索
  function clearSearch() {
    pluginSearchInput.value = '';
    filteredPlugins = [...plugins];
    renderPluginsTable();
    // 清空后自动聚焦输入框
    pluginSearchInput.focus();
  }

  // 渲染插件表格
  function renderPluginsTable() {
    pluginsTableBody.innerHTML = '';
    const emptyState = document.querySelector('.empty-state');
    const pluginsTable = document.querySelector('.plugins-table');

    if (filteredPlugins.length === 0) {
      // 显示空状态
      emptyState.classList.add('show');
      pluginsTable.style.display = 'none';
    } else {
      // 显示表格
      emptyState.classList.remove('show');
      pluginsTable.style.display = 'table';

      filteredPlugins.forEach((plugin, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', plugin.id);
        tr.innerHTML = `
          <td>
            <input type="radio" name="plugin" class="radio-input" value="${plugin.id}" ${
          plugin.id === selectedPluginId ? 'checked' : ''
        }>
          </td>
          <td>${index + 1}</td>
          <td>${plugin.name}</td>
        `;

        // 添加选中状态的样式
        if (plugin.id === selectedPluginId) {
          tr.classList.add('selected');
        }

        // 点击整行时选中或取消选中
        tr.addEventListener('click', () => {
          if (selectedPluginId === plugin.id) {
            selectPlugin(null); // 如果已选中，则取消选中
          } else {
            selectPlugin(plugin.id); // 如果未选中，则选中
          }
        });

        pluginsTableBody.appendChild(tr);
      });
    }
    updateTotalCount();
  }

  // 选中插件
  function selectPlugin(pluginId) {
    selectedPluginId = pluginId;
    renderPluginsTable();
    previewCopyGroup.classList.remove('show');

    // 更新已选插件显示
    if (pluginId) {
      const selectedPlugin = plugins.find((p) => p.id === pluginId);
      if (selectedPlugin) {
        selectedPluginNameElement.textContent = selectedPlugin.name;
        selectedPluginNameElement.style.color = '#333'; // 正常颜色
        selectedPluginNameElement.style.fontWeight = 700;
        cancelSelectionBtn.style.display = 'flex'; // 显示叉叉按钮
      }
    } else {
      selectedPluginNameElement.textContent = '无';
      selectedPluginNameElement.style.color = '#ccc'; // 不显眼颜色
      cancelSelectionBtn.style.display = 'none'; // 隐藏叉叉按钮
    }
    selectedPluginElement.classList.remove('hidden');
  }

  // 搜索插件
  function searchPlugins(keyword) {
    if (!keyword.trim()) {
      filteredPlugins = [...plugins];
    } else {
      keyword = keyword.toLowerCase();
      filteredPlugins = plugins.filter((plugin) => plugin.name.toLowerCase().includes(keyword));
    }
    renderPluginsTable();
  }

  // 生成URL
  function generateUrl() {
    const baseUrl = tableUrlInput.value.trim();
    if (!baseUrl) {
      showError('请先填写多维表格地址！');
      return '';
    }

    let url = baseUrl;
    const params = [];

    if (hideSidebarCheckbox.checked) {
      params.push('hideSidebar=1');
    }

    if (hideHeaderCheckbox.checked) {
      params.push('hideHeader=1');
    }

    if (hideViewCreateCheckbox.checked) {
      params.push('vc=true');
    }

    if (openMarketCheckbox.checked) {
      params.push('extension_market_spread=1');
    }

    const width = sidebarWidthInput.value;
    if (width) {
      params.push(`extension_market_spread_width=${width}`);
    }

    if (selectedPluginId) {
      params.push(`extension_market_extension_id=${selectedPluginId}`);
    }

    if (params.length > 0) {
      url += (url.includes('?') ? '&' : '?') + params.join('&');
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

  // 事监听器
  clearBtn.addEventListener('click', () => {
    tableUrlInput.value = '';
    previewCopyGroup.classList.remove('show');
    // 清空后自动聚焦输入框
    tableUrlInput.focus();
  });

  searchClearBtn.addEventListener('click', clearSearch);

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

  hideSidebarCheckbox.addEventListener('change', () => {
    previewCopyGroup.classList.remove('show');
  });

  openMarketCheckbox.addEventListener('change', () => {
    previewCopyGroup.classList.remove('show');
  });

  sidebarWidthInput.addEventListener('input', () => {
    previewCopyGroup.classList.remove('show');
  });

  pluginSearchInput.addEventListener('input', (e) => {
    searchPlugins(e.target.value);
  });

  hideHeaderCheckbox.addEventListener('change', () => {
    previewCopyGroup.classList.remove('show');
  });

  hideViewCreateCheckbox.addEventListener('change', () => {
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

  // 定位到选中的插件
  function scrollToSelectedPlugin() {
    if (selectedPluginId) {
      const selectedRow = document.querySelector(`.plugins-table tbody tr[data-id="${selectedPluginId}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 添加闪烁效果
        selectedRow.style.animation = 'none';
        selectedRow.offsetHeight; // 触发重绘
        selectedRow.style.animation = 'highlight 1s ease';
      }
    }
  }

  // 添加定位按钮点击事件
  // cancelSelectionBtn.addEventListener('click', scrollToSelectedPlugin);

  // 添加高亮动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes highlight {
      0% {
        background-color: #eef3ff;
      }
      50% {
        background-color: #d4e4ff;
      }
      100% {
        background-color: #eef3ff;
      }
    }
  `;
  document.head.appendChild(style);

  // 处理数字输入框的上下按钮
  const numberUpBtn = document.querySelector('.number-up-btn');
  const numberDownBtn = document.querySelector('.number-down-btn');

  function updateNumberInput(increment) {
    const currentValue = parseInt(sidebarWidthInput.value) || 0;
    const newValue = currentValue + increment;
    if (newValue >= 0) {
      // 确保值不小于0
      sidebarWidthInput.value = newValue;
      sidebarWidthInput.dispatchEvent(new Event('input')); // 触发input事件
    }
  }

  numberUpBtn.addEventListener('click', () => {
    updateNumberInput(10); // 每次增加10
  });

  numberDownBtn.addEventListener('click', () => {
    updateNumberInput(-10); // 每次减少10
  });

  // 初始化已选插件显示
  selectPlugin(selectedPluginId);

  // 初始化
  renderPluginsTable();

  // 添加叉叉按钮点击事件
  cancelSelectionBtn.addEventListener('click', () => {
    selectPlugin(null); // 取消选择的插件
    selectedPluginNameElement.textContent = '无';
    selectedPluginNameElement.style.color = '#ccc'; // 不显眼颜色

    if (selectedPluginNameElement.textContent === '无') {
      cancelSelectionBtn.style.display = 'none'; // 隐藏叉叉按钮
    }

    // 取消选中状态和高亮效果
    const selectedRow = document.querySelector(`.plugins-table tbody tr.selected`);
    if (selectedRow) {
      selectedRow.classList.remove('selected');
      selectedRow.style.backgroundColor = '';
    }

    // 更新 URL
    const baseUrl = tableUrlInput.value.split('?')[0];
    tableUrlInput.value = baseUrl; // 去掉参数
  });
});
