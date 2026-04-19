# SubBatch 音频转字幕功能开发文档

## 功能目标

为 SubBatch 扩展添加"音频转字幕"功能，通过以下方式实现：

- 调用 B站 `/x/player/wbi/playurl` 接口获取视频的音频流 URL（m4s 格式）
- 使用预打包在扩展内的 Whisper 模型（Transformers.js + whisper-base）在浏览器本地进行语音转写
- 输出 SRT 格式字幕，不使用任何云服务器

**关键约束**：

- 用户群体是普通小白，要求一键安装即可使用
- 模型必须预打包，不依赖 CDN 下载a
- 最大支持 30 分钟视频，超过则提示不支持
- 音频流有效期 120 分钟

---

## 当前进度

**状态**：核心功能代码已完成，但音频下载环节遇到 CORS/403 问题，正在调试中。

---

## 代码修改清单

### 1. manifest.json

**修改内容**：

- 添加 `offscreen` 权限
- 添加 `*.bilivideo.com` 到 host_permissions
- 添加 `web_accessible_resources` 配置（models/_, libs/_, offscreen.html）

**修改行数**：+10 行

```json
"permissions": ["sidePanel", "activeTab", "tabs", "storage", "scripting", "cookies", "offscreen"],
"host_permissions": [
  ...
  "https://*.bilivideo.com/*",
  ...
],
"web_accessible_resources": [
  {
    "resources": ["models/*", "libs/*", "offscreen.html"],
    "matches": ["<all_urls>"]
  }
]
```

---

### 2. background.js

**修改内容**（+750 行）：

#### 2.1 transcribeAudio 消息处理（约 130 行）

- 接收 `bvid`, `cid`, `tabId` 参数
- 协调整个音频转写流程
- 发送进度更新到前端

#### 2.2 fetchAudioStreamUrl 函数（约 80 行）

- 获取 WBI 签名密钥
- 调用 `https://api.bilibili.com/x/player/wbi/playurl` API
- 解析 DASH 格式获取音频流 URL
- 返回 `audioUrl`, `duration`, `mimeType`

#### 2.3 downloadViaContentScript 函数（约 150 行）

- 通过 content script 在 B站页面中执行
- 尝试从 `__playinfo__` 或 `H5Player` 获取音频 URL
- 使用 `chrome.runtime.sendMessage` 回调方式返回结果

#### 2.4 downloadAudioDirectly 函数（约 40 行）

- 直接使用 fetch 下载音频
- 带上 Cookie 和必要的请求头
- 作为 content script 失败的回退方案

#### 2.5 fetchAndDecodeAudio 函数（约 100 行）

- 协调音频下载和解码
- 优先使用 content script 方式
- 回退到直接下载
- 尝试使用 AudioContext 解码

#### 2.6 WhisperTranscriber 类（约 100 行）

- 初始化 Transformers.js
- 加载本地 whisper-base 模型
- 执行语音转写

#### 2.7 audioBufferTo16kHzMono 函数（约 40 行）

- 将 AudioBuffer 转换为 16kHz 单声道 Float32Array
- 使用线性插值进行重采样

#### 2.8 convertToSRT 函数（约 50 行）

- 将转写结果转换为 SRT 格式

---

### 3. sidepanel.html

**修改内容**（+12 行）：

- 添加"音频转字幕"按钮（紫色渐变背景）
- 位于"获取字幕"按钮右侧

```html
<button
  id="transcribeAudioBtn"
  class="action-btn"
  style="background: linear-gradient(to right, #722ed1, #722ed1); color: white; margin-left: 8px;"
>
  <svg viewBox="0 0 24 24">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z..." />
  </svg>
  音频转字幕
</button>
```

---

### 4. script.js

**修改内容**（+380 行）：

#### 4.1 transcribeAudioBtn 事件监听（约 120 行）

- 检查视频列表和时长限制
- 获取 B站标签页 ID
- 发送 `transcribeAudio` 消息到后台
- 处理转写结果和进度更新

#### 4.2 监听转写进度消息（约 10 行）

- 监听 `transcribeProgress` 消息
- 更新前端进度条

#### 4.3 decodeAudioInFrontend 函数（约 30 行）

- 在前端使用 AudioContext 解码音频

#### 4.4 audioBufferTo16kHzMono 函数（约 40 行）

- 前端版音频重采样

#### 4.5 formatSRTTime 函数（约 15 行）

- SRT 时间格式转换

#### 4.6 convertToSRT 函数（约 50 行）

- 将转写结果转换为 SRT

#### 4.7 initFrontendWhisper 函数（约 50 行）

- 动态加载 Transformers.js
- 初始化 Whisper pipeline

#### 4.8 transcribeAudioInFrontend 函数（约 60 行）

- 在前端执行音频转写

---

### 5. 新增文件

#### 5.1 libs/transformers.min.js

- Transformers.js 库文件
- 大小：~898KB

#### 5.2 models/whisper-base/

- whisper-base 量化模型文件（~78MB）
- 包含：encoder_model_quantized.onnx, decoder_model_merged_quantized.onnx, config.json, tokenizer.json 等

#### 5.3 offscreen.html

- Offscreen API 文档（当前未使用，保留备用）

---

## 技术方案

### 流程图

```
用户点击"音频转字幕"按钮
    ↓
script.js: 获取 B站标签页 ID，发送 transcribeAudio 消息
    ↓
background.js: 1) fetchAudioStreamUrl() 获取音频流 URL
    ↓
background.js: 2) downloadViaContentScript() 或 downloadAudioDirectly() 下载音频
    ↓
background.js: 3) AudioContext.decodeAudioData() 解码音频
    ↓
background.js: 4) WhisperTranscriber 初始化并转写
    ↓
background.js: 5) convertToSRT() 转换为 SRT 格式
    ↓
script.js: 保存结果到视频对象，更新表格
```

### 音频下载方案（遇到问题）

**尝试过的方案**：

1. **Service Worker 直接 fetch** → CORS 403 错误
   - CDN 不允许跨域请求

2. **Content Script XMLHttpRequest + withCredentials** → "Failed to fetch"
   - 可能被 B站页面拦截

3. **从页面 `__playinfo__` 或 `H5Player` 获取音频 URL** → 当前方案
   - 需要视频正在播放才能获取
   - 但下载时仍然遇到 403

4. **直接 fetch + Cookie** → HTTP 403
   - CDN 需要特定 Cookie（如动态的 buvid）

---

## 遇到的问题

### 主要问题：音频下载 403 错误

**现象**：

- B站音频 CDN 返回 403 Forbidden
- 音频 URL 带有签名和有效期

**可能原因**：

1. CDN 需要特定的 Cookie（如动态生成的 `buvid`）
2. 音频 URL 已过期
3. CORS 策略限制

**已尝试的解决**：

- ✅ 使用 `credentials: 'include'`
- ✅ 添加完整的 Cookie
- ✅ 使用 Content Script 在页面上下文执行
- ✅ 使用 XMLHttpRequest + withCredentials
- ✅ 从页面 `__playinfo__` 获取音频信息
- ❌ 仍未解决 403 问题

---

## 调试日志（最近一次）

```
收到转写进度: {progress: 5, stage: 'downloading', message: '准备下载...'}
收到 content script 消息: {action: 'audioDownloadError', error: 'Network error'}
Content script 下载失败，尝试直接下载: Network error
直接下载音频: https://upos-sz-mirrorcos.bilivideo.com/upgcxcode/...
下载和解码音频出错: Error: 下载音频失败: HTTP 403
```

---

## 待解决问题

1. **音频下载 CORS/403 问题**（优先级：高）
   - 需要找到正确获取音频的方式
   - 可能需要复用 B站播放器的音频请求

2. **Service Worker 中 AudioContext 可能不可用**
   - 需要确保 fallback 到前端解码

3. **实际测试完整流程**
   - 音频下载成功后，还需验证 Whisper 转写是否正常

---

## 相关链接

- [Transformers.js 文档](https://huggingface.co/docs/transformers.js)
- [Whisper 模型列表](https://huggingface.co/Xenova/whisper-base)
- [B站视频流 API](./TODO/API/videostream_url.md)

---

## 更新记录

| 日期       | 更新内容                                                                      |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-04-10 | 初始实现：添加 Whisper 模型、Transformers.js、background.js 和 script.js 修改 |
| 2026-04-10 | 调试音频下载问题，尝试多种 CORS 解决方案                                      |
