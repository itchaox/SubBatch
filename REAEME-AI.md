# SubBatch - B站字幕批量处理工具 (AI技术分析)

## 项目概述

**SubBatch** 是一个 Chrome 浏览器扩展（Manifest V3），核心能力有两项：

1. **B站字幕批量获取** — 通过 B站 API 批量提取视频字幕，支持收藏夹/合集/UP主主页等多种导入方式
2. **本地音频转字幕** — 在浏览器内直接运行 Whisper 语音识别模型，对无字幕视频进行本地转录，无需服务器

- **版本**: 1.6.0
- **架构**: Chrome Extension Manifest V3（Service Worker + Side Panel）
- **本地推理**: Transformers.js + ONNX Runtime（WebGPU / WASM）
- **应用场景**: AI 知识库建设（NotebookLM）、学习笔记整理、视频内容分析

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 扩展框架 | Chrome Extension Manifest V3 | Service Worker 后台 + Side Panel UI |
| UI | HTML5 + CSS3 + Vanilla JS (ES6+) | 自定义下拉框、SVG 进度环、Toast 通知 |
| B站 API | WBI 签名 + Cookie 认证 | 15+ 个 API 端点，含 DASH 音频流获取 |
| 语音识别 | Transformers.js + ONNX Runtime | WebGPU 优先，WASM 降级 |
| 模型 | whisper-large-v3-turbo (q4f16) | WebGPU 推理，编码器 370MB + 解码器 194MB |
| 降级模型 | whisper-small (quantized) | WASM/CPU 推理，兼容无 WebGPU 的设备 |
| 文件处理 | JSZip + Blob API | ZIP 批量导出 |

### 第三方依赖

| 文件 | 位置 | 用途 |
|------|------|------|
| `transformers.min.js` | `libs/` | Transformers.js 库，加载 Whisper 模型 |
| `ort-wasm-simd-threaded.jsep.wasm` | `libs/` | ONNX Runtime WebAssembly 引擎（SIMD + JSEP） |
| `ort-wasm-simd-threaded.jsep.mjs` | `libs/` | ONNX Runtime JSEP 绑定（WebGPU 后端） |
| `ort-wasm-simd-threaded.wasm` | `libs/` | ONNX Runtime 纯 WASM 后端（极小，96B，仅做 loader） |
| `jszip.min.js` | 根目录 | ZIP 文件生成 |

## 项目结构

```
SubBatch/
├── manifest.json              # 扩展配置 (Manifest V3)
├── background.js              # Service Worker — B站 API、音频下载、Whisper 转写
├── sidepanel.html             # 侧边栏 UI
├── script.js                  # 前端逻辑 — 表格管理、导出、前端 Whisper 推理
├── data.js                    # 功能列表数据（129 个工具条目）
├── jszip.min.js               # JSZip 库
├── libs/
│   ├── transformers.min.js    # Transformers.js v3
│   ├── ort-wasm-simd-threaded.jsep.mjs   # ONNX Runtime JSEP 绑定
│   ├── ort-wasm-simd-threaded.jsep.wasm  # ONNX Runtime WASM (24MB, SIMD)
│   └── ort-wasm-simd-threaded.wasm       # WASM loader stub
├── models/
│   ├── whisper-large-v3-turbo/  # WebGPU 推理模型 (q4f16)
│   │   ├── config.json, generation_config.json, preprocessor_config.json
│   │   ├── tokenizer.json, tokenizer_config.json
│   │   ├── special_tokens_map.json, added_tokens.json, vocab.json
│   │   ├── quantize_config.json
│   │   └── onnx/
│   │       ├── encoder_model_q4f16.onnx          (370MB)
│   │       └── decoder_model_merged_q4f16.onnx    (194MB)
│   └── whisper-small/           # WASM 降级模型 (quantized)
│       ├── config.json, generation_config.json, ...
│       └── onnx/
│           ├── encoder_model_quantized.onnx
│           └── decoder_model_merged_quantized.onnx
└── offscreen.html             # Offscreen Document（后台 Whisper 推理）
```

## 系统架构

### 三层架构

```
┌─────────────────────────────────────────────────────┐
│  Presentation Layer (script.js + sidepanel.html)    │
│  ─ Side Panel UI、视频表格管理、导出逻辑            │
│  ─ 前端 Whisper 推理（WebGPU/WASM）                 │
│  ─ 音频解码、分块、去重、SRT/TXT 格式化             │
├─────────────────────────────────────────────────────┤
│  Background Layer (background.js)                   │
│  ─ Service Worker — B站 API 全部调用逻辑            │
│  ─ WBI 签名生成、Cookie 管理                        │
│  ─ DASH 音频流获取、CDN 下载（Content Script 注入） │
│  ─ WhisperTranscriber 类（Offscreen 模式推理）      │
├─────────────────────────────────────────────────────┤
│  Data Layer                                         │
│  ─ chrome.storage.local — Cookie、用户设置持久化    │
│  ─ models/ — 本地 ONNX 模型文件                     │
│  ─ JSZip — ZIP 文件导出                             │
└─────────────────────────────────────────────────────┘
```

### 通信方式

Side Panel 与 Background Worker 通过 `chrome.runtime.sendMessage()` 通信：

| 消息类型 | 方向 | 用途 |
|---------|------|------|
| `fetchBilibiliInfo` | Panel → BG | 获取视频元数据 |
| `fetchBilibiliSubtitle` | Panel → BG | 获取字幕内容 |
| `fetchFavoriteList` | Panel → BG | 获取收藏夹视频（分页） |
| `fetchCollectionList` | Panel → BG | 获取合集/系列视频 |
| `fetchUserCard` | Panel → BG | 获取 UP主信息 |
| `fetchUserVideoList` | Panel → BG | 获取 UP主视频列表（WBI 签名） |
| `fetchVideoParts` | Panel → BG | 获取视频分P列表 |
| `transcribeAudio` | Panel → BG | 音频转字幕（完整流程） |
| `getCookie` / `setCookie` / `updateCookie` | Panel ↔ BG | Cookie 管理 |
| `transcribeProgress` | BG → Panel | 转写进度推送 |

## B站 API 调用详解

### API 端点列表

| 端点 | 用途 | WBI 签名 |
|------|------|---------|
| `/x/web-interface/view` | 获取视频信息（BV/AV号） | 否 |
| `/x/web-interface/nav` | 获取 WBI 签名密钥 | 否 |
| `/x/web-interface/card` | 获取用户信息 | 否 |
| `/x/player/wbi/v2` | 获取字幕元数据（首选） | 是 |
| `/x/player/v2` | 获取字幕元数据（备用） | 否 |
| `/x/player/v2/ai/subtitle/search/stat` | 获取 AI 生成字幕 | 否 |
| `/x/player/pagelist` | 获取视频分P列表 | 否 |
| `/x/player/wbi/playurl` | 获取 DASH 音频流地址 | 是 |
| `/x/v3/fav/resource/list` | 获取收藏夹视频列表 | 否 |
| `/x/polymer/web-space/seasons_archives_list` | 获取合集/系列视频 | 否 |
| `/x/space/wbi/arc/search` | 获取 UP主视频列表 | 是 |

### WBI 签名实现

B站 WBI（Web Browser Interface）签名是反爬虫机制，部分 API 必须签名才能调用。

**签名流程：**
1. 从 `/x/web-interface/nav` 获取 `img_key` 和 `sub_key`
2. 拼接 `img_key + sub_key`，通过 64 位混淆表 `mixinKeyEncTab` 重排字符，取前 32 位得到 `mixin_key`
3. 在请求参数中注入 `wts`（当前 Unix 时间戳）
4. 按参数名字母排序，过滤 `!'()*` 字符，URL 编码
5. 拼接为 query string，计算 `w_rid = md5(queryString + mixin_key)`

**核心代码位置：** `background.js` 第 19-254 行
- `md5()` — 纯 JS 实现的 MD5 哈希（第 19-204 行）
- `mixinKeyEncTab` — 64 位混淆表（第 206-210 行）
- `getMixinKey(orig)` — 密钥重排（第 212-218 行）
- `encWbi(params, img_key, sub_key)` — 参数签名（第 220-236 行）
- `getWbiKeys()` — 获取签名密钥（第 239-254 行）

### Cookie 管理

**必需字段：** `SESSDATA`、`bili_jct`、`DedeUserID`

**获取策略（两级）：**
1. `chrome.scripting.executeScript` 从 B站页面读取 `document.cookie`
2. 降级到 `chrome.cookies.getAll` 跨 4 个域名收集（含 httpOnly Cookie 如 `buvid3`/`buvid4`）

**持久化：** `chrome.storage.local` 键 `bilibiliCookie`

### 字幕获取策略

```
getBilibiliSubtitle(cid, bvid)
  ├─ 尝试 /x/player/wbi/v2?aid=X&cid=Y（WBI 签名）
  ├─ 失败 → /x/player/v2?cid=X&bvid=Y（非签名备用）
  ├─ 检查 AI 字幕 → /x/player/v2/ai/subtitle/search/stat
  ├─ 下载字幕 JSON → 解析为统一格式
  └─ 最多重试 3 次，间隔 1 秒
```

## 音频转字幕功能详解

### 整体流程

```
用户点击"音频转字幕"
  → background.js 获取音频流 URL（DASH 格式，WBI 签名）
  → 通过 Content Script 在 B站页面内下载音频（绕过 CDN Origin 检查）
  → 解码为 AudioBuffer → 重采样为 16kHz 单声道
  → 分块（30 秒/块，6 秒重叠）
  → 逐块：特征提取 → Whisper 推理 → 解码 → 单块去重
  → 合并所有块：时间戳去重 + TXT 边界重叠裁剪
  → 生成 SRT/TXT
```

### 1. 音频流获取

B站使用 DASH 格式分离音视频，需要专门的 API 获取音频流：

```javascript
// background.js - fetchAudioStreamUrl()
// 请求 DASH 格式（fnval=16），WBI 签名
const url = 'https://api.bilibili.com/x/player/wbi/playurl?' + signedParams;
// 返回 dashData.audio[0].baseUrl（最高音质）
```

### 2. 音频下载（双世界 Content Script 注入）

B站 CDN 会检查 `Origin` 头，拒绝 `chrome-extension://` 来源的请求（返回 403）。解决方案是注入两层脚本：

```
ISOLATED World（扩展上下文）
  └─ 监听 window.postMessage → chrome.runtime.sendMessage 转发

MAIN World（页面上下文）
  └─ 从 B站页面发起 fetch() → CDN 接受 → 分块 postMessage 回传
```

数据以 2MB 为单位分块传输，避免消息大小限制。总超时 3 分钟。

### 3. 模型加载（WebGPU 优先，WASM 降级）

```javascript
// script.js - initFrontendWhisper()
if (await isWebGPUAvailable()) {
  // WebGPU 路径：whisper-large-v3-turbo，q4f16 量化
  model = await AutoModelForSpeechSeq2Seq.from_pretrained(gpuModelPath, {
    device: 'webgpu',
    dtype: 'q4f16',  // 编码器 q4 + 解码器 f16
  });
} else {
  // WASM 降级：whisper-small
  model = await AutoModelForSpeechSeq2Seq.from_pretrained(cpuModelPath);
}
```

**强制中文设置（三层保险）：**
1. `generation_config.forced_decoder_ids = [[1, 50260], [2, 50359]]` — 强制中文转写
2. `_retrieve_init_tokens` monkey-patch — 防止 v3 API 忽略 forced_decoder_ids
3. `generate()` 参数中传入 `language: 'chinese', task: 'transcribe'`

### 4. 音频分块与推理

```javascript
const CHUNK_SECONDS = 30;   // Whisper 最大输入
const STRIDE_SECONDS = 6;   // 块间重叠（减少边界吞字）
// 实际步进 = 30 - 6 = 24 秒

for (let i = 0; i < numChunks; i++) {
  const audioChunk = monoAudio.slice(i * stepSamples, ...);
  const { input_features } = await processor(audioChunk);    // 梅尔频谱提取
  const output = await model.generate({ input_features }, {  // Whisper 推理
    max_new_tokens: 448,           // 模型 max_target_positions 限制
    return_timestamps: true,        // 输出时间戳
    num_beams: 1,                   // 贪心解码（最快）
    do_sample: false,
  });
  // 解码 + 解析时间戳 + 去重
}
```

**关键优化 — 单次推理：** 只跑一次 `generate()`，如果时间戳解析失败，直接从首次 output 提取纯文本，不再 fallback 重新推理（之前每个块跑两次，速度慢一倍）。

### 5. 去重流水线

| 阶段 | 函数 | 机制 |
|------|------|------|
| 单块内去重 | `removeWhisperDuplicates()` | 精确匹配 + 子串包含 + 模糊匹配（相似度 > 0.8） |
| 跨块去重 | `deduplicateChunksByTime()` | 按时间戳排序，50%+ 时长重叠则去重 |
| TXT 边界去重 | `trimLeadingOverlapText()` | 只比较“上一块尾部 vs 当前块开头”，命中后裁掉当前块前缀重复段 |
| 文本行去重 | `removeDuplicateTextLines()` | TXT 导出的安全网，滑动窗口检查连续重复行 |
| 繁简转换 | `traditionalToSimplified()` | 1000+ 字符映射表，处理 Whisper 输出的繁体字 |

#### TXT 边界去重算法说明

这套去重的目标不是“全文搜索相似句然后删除”，而是专门处理 **30 秒分块 + 6 秒重叠** 带来的块边界重复。因为重复通常都集中在“上一块的结尾”和“下一块的开头”，所以算法只盯这一个位置，精度会比全局模糊去重高很多。

**核心思路：**

1. **只在块边界处理**
   合并长音频文本时，不直接把 `chunkResult.text` 追加到总文本后面，而是先拿“已合并文本的尾部”和“当前块文本的开头”做一次重叠检测。

2. **先标准化，再匹配**
   `buildNormalizedTextIndexMap()` 会先对文本做轻量清洗：移除时间戳、空格和常见标点，但保留字符顺序；同时记录每个“标准化字符”在原文中的位置索引 `indexMap`。

3. **优先精确匹配**
   `findChunkTextOverlapLength()` 会从长到短扫描“上一块后缀”和“当前块前缀”，只要发现大段完全一致，就直接判定为重叠。

4. **精确命不中，再做高阈值模糊匹配**
   对 Whisper 常见的轻微错字、漏字场景，算法会再检查：
   - 两段文本前缀已经对上较长一段
   - 字符频率相似度 `>= 0.86`

   只有同时满足，才认为这是同一段被重复转写，而不是两句真的不同的话。

5. **匹配用标准化文本，裁剪用原始文本**
   一旦找到重叠长度，就利用 `indexMap` 反推回原始文本的切割位置，只裁掉“当前块开头已经出现过的部分”，后面的新内容全部保留。

**为什么这套方案会比较准：**

- 它只处理“块边界重复”，不会在全文里到处删相似句，所以不容易误删正文里真实存在的重复表达。
- 它删的是“当前块开头的重复前缀”，不是整句替换，也不是全局改写，因此能保住原有语义和顺序。
- 它对 Whisper 常见的“小范围错字但整体内容相同”比较宽容，所以像“上一块尾巴和下一块开头大段一致、仅个别字不同”的情况也能命中。

**简化示例：**

```text
上一块尾部：
其代表作有串联酒精灯火箭暴力......博主在B站有两个账号

下一块开头：
其代表作有串联酒精灯火箭暴力......博主在B站有两个账号大号是......
```

算法不会删除整块，而是只裁掉下一块开头那段已重复的前缀，最终只保留：

```text
大号是......
```

这也是它在 TXT 导出场景下效果特别好的原因：去掉了分块重叠导致的重复，但不会破坏正文逻辑。

### 6. SRT/TXT 导出

**SRT 格式：** 标准序号 + `HH:MM:SS,mmm --> HH:MM:SS,mmm` + 文本

**TXT 格式：** 纯文本，移除时间戳和序号；中文路径下会额外做“可读但不过度加工”的换行增强，可选附加视频信息前缀（标题 + 链接）

**批量导出：** JSZip 打包为 `SubBatch_YYYY-MM-DD-HH-MM-SS_FMT.zip`

#### 中文 TXT 换行优化（已实现）

这部分的目标不是把 TXT 做成正式字幕，而是让 **音频转文字结果在导出为 TXT 后，既能被 AI 顺畅读取，也能让人类做轻量复核时不至于太难看**。

产品上的优先级是：

1. **识别准确率**
2. **内容完整性**
3. **基础可读性**
4. **字幕观感**

因此，TXT 换行只做到“可读增强”，不会为了追求像 B 站 AI 字幕那样的观感而做过重的文本改写。

##### 设计边界

- **不改动** `30 秒分块 + 6 秒重叠`
- **不改动** 时间戳主链路
- **不改动** TXT 去重逻辑
- **只处理** TXT 导出时的中文阅读体验
- **不针对单条视频做特判**，只接受能泛化到大多数中文口播视频的规则

##### 为什么不继续深挖“像正式字幕一样换行”

在实际调试中发现，中文 Whisper 转写里最影响体验的并不全是换行：

- 一部分问题是坏断点，例如 `去挖 / 掘`、`科 / 普`
- 另一部分其实是 ASR 错词，例如 `商丹`、`底继`、`互成合`

换行继续深挖的边际收益很快会变小，因为它最多只是把“已经识别错的句子”排得更好看一点；而对 AI 知识库场景来说，真正更重要的是识别率和内容完整性。

所以这套方案的目标最终收敛为：

- **中文 TXT 基础可读**
- **尽量不破坏原始识别内容**
- **不过度为某一条样例视频调参**
- **后续优化重心回到识别率**

##### 已实现的换行策略

当前中文 TXT 的换行链路分成两层：

**第一层：时间戳片段整理为“可读语义段”**

- 函数：`buildReadableChunksFromTimestamps()`
- 职责：把 Whisper 返回的小时间戳片段，按停顿、长度、常见连接词整理成较稳定的“语义段”
- 注意：这一步的目标不是直接产出最终字幕行，而只是避免时间戳层过早切出大量 6~10 字碎片

**第二层：TXT 最终换行**

- 函数：`formatReadableChunksForTxt()`
- 内部链路：
  - `splitTextToSentences()`
  - `softWrapTextByMeaning()`
  - `findBestWrapIndex()`
  - `repairWrappedLines()`
- 职责：在单个语义段内部，再决定“具体在哪个位置折行更像中文口播”

##### 具体采用的通用规则

1. **通用短语保护**

   不允许在常见功能短语中间断开，例如：

   - `只有`
   - `因为`
   - `如果`
   - `但是`
   - `不过`
   - `我们`
   - `你们`
   - `大家`

   这些规则是通用中文规则，不依赖视频主题。

2. **中英混排保护**

   不允许在常见中英混合 token 中间断开，例如：

   - `AI`
   - `AI工具`
   - `B站`
   - `UP主`
   - `YouTube`
   - `Python`
   - `ChatGPT`
   - `AIGC`

3. **单字尾巴保护**

   不允许让一行结尾挂住明显的动作字或弱连接字，例如：

   - 动作尾字：`去 / 点 / 看 / 说 / 做 / 开 / 找 / 拿 / 问 / 提 / 学 / 讲 / 写 / 读 / 听 / 想 / 用 / 带 / 发`
   - 弱尾字：`只 / 很 / 太 / 更 / 最 / 把 / 被 / 给 / 向 / 跟 / 和 / 与 / 在 / 对 / 的 / 了 / 着 / 过 / 地 / 得`

   这类保护主要是为了解决：

   - `去挖 / 掘`
   - `点开主页 / 你可能以为`
   - `日常化的 / 一面`

4. **孤行修复**

   如果最终换行后出现明显不自然的孤行，会再做一次轻量回收：

   - 1~2 个字的孤行，优先并回前后文
   - 3~4 个字的连接词残句，优先并到后一行
   - 行首是虚词、行尾是弱连接字时，优先修复

##### 断点选择方式

当前实现不是“到最大字数就硬切”，而是：

1. 优先枚举 **中文词边界**
2. 再对这些候选断点打分
3. 尽量选择更接近 `16~18` 字、且两边读起来更自然的位置
4. 如果拿不到可靠词边界，再退回到较保守的字符级兜底

中文词边界优先使用浏览器内建的 `Intl.Segmenter('zh-CN', { granularity: 'word' })`，这样能比纯字符规则更少出现：

- `挖 / 掘`
- `科 / 普`
- `创作 / 者`
- `粉 / 丝`

这也是后期这套方案里最关键的一次升级：从“字符级打补丁”走向“优先按词边界断行”。

##### 这套方案的结论

对于当前插件的主要场景，也就是 **中文 B 站视频 → TXT → AI 知识库**，这套换行已经达到一个合理平衡点：

- 比纯粹按字数截断更可读
- 不会为了观感过度改写原始识别文本
- 不需要针对单条视频维护特判
- 再继续深挖换行，收益已经明显变小

因此，后续优先级建议明确为：

1. **识别准确率**
2. **内容完整性**
3. **TXT 基础可读性**
4. **正式字幕观感**

##### 多语言扩展策略

仓库中的 `whisper-large-v3-turbo` 和 `whisper-small` 都是 **多语言模型**，配置文件里有 `is_multilingual: true` 和完整的 `lang_to_id`。

但当前前端实现是**强制中文转写**：

- `forced_decoder_ids` 强制写入中文 token
- `_retrieve_init_tokens` 被 patch 为中文
- `generate()` 也显式传入 `language: 'chinese'`

所以：

- **模型能力上**：支持英文、日文、韩文等多语言
- **当前产品实现上**：优先服务中文场景

这也是有意为之。现阶段最合理的产品策略不是“所有语言都做复杂换行优化”，而是：

- **中文**：保留专门换行增强，因为这是主用户群
- **非中文**：未来先做到“能识别”，但只走轻量通用换行，避免把中文规则错误套到英文、日文、韩文上

换句话说，这套换行增强是 **中文优先的体验优化**，而不是一个通用于所有语言的字幕排版系统。

## 音频转字幕技术实现细节

### 关键函数索引

| 函数 | 文件 | 行号 | 用途 |
|------|------|------|------|
| `fetchAudioStreamUrl` | background.js | 2383 | 获取 DASH 音频流 URL |
| `downloadViaContentScript` | background.js | 2491 | 双世界 Content Script 下载音频 |
| `downloadAudioDirectly` | background.js | 2704 | 直接下载降级方案 |
| `fetchAndDecodeAudio` | background.js | 2822 | 音频下载 + 解码编排 |
| `audioBufferTo16kHzMono` | background.js / script.js | 2917 / 3070 | 重采样为 16kHz 单声道 Float32Array |
| `WhisperTranscriber` | background.js | 2959 | 后台 Whisper 推理类（Offscreen 模式） |
| `initFrontendWhisper` | script.js | 3202 | 前端模型加载（WebGPU + WASM 双路径） |
| `isWebGPUAvailable` | script.js | 3188 | WebGPU 支持检测 |
| `transcribeAudioInFrontend` | script.js | 3329 | 前端完整转写流程（分块 + 推理 + 合并） |
| `transcribeSingleChunk` | script.js | 3450 | 单块推理（generate + decode + 去重） |
| `parseTimestampChunks` | script.js | 3511 | 解析 Whisper `<\|X.XX\|>` 时间戳输出 |
| `convertToSRT` | script.js | 3131 | Whisper 输出 → SRT 格式 |
| `convertToSrtFormat` | script.js | 2596 | B站字幕 → SRT 格式 |
| `convertToTxtFormat` | script.js | 2647 | 字幕 → TXT 格式（去时间戳、分句） |
| `cleanTranscriptionText` | script.js | 4010 | 转写文本清理 |
| `buildNormalizedTextIndexMap` | script.js | 4027 | 构建标准化文本与原文位置映射 |
| `findChunkTextOverlapLength` | script.js | 4070 | 计算相邻块文本的重叠长度 |
| `trimLeadingOverlapText` | script.js | 4110 | 裁剪当前块开头的重复前缀 |
| `deduplicateChunksByTime` | script.js | 4144 | 跨块时间戳去重 |
| `removeWhisperDuplicates` | script.js | 4196 | 单块内幻觉去重 |
| `removeDuplicateTextLines` | script.js | 4256 | 文本行去重（TXT 安全网） |
| `computeTextSimilarity` | script.js | 4344 | 字符频率相似度计算 |
| `traditionalToSimplified` | script.js | 3539 | 繁简转换（1000+ 字符映射） |

### 模型配置

**whisper-large-v3-turbo（主模型，WebGPU）：**
```json
// config.json 关键参数
{
  "d_model": 1280,
  "encoder_layers": 32,
  "decoder_layers": 4,           // turbo 版本：解码器仅 4 层
  "encoder_attention_heads": 20,
  "decoder_attention_heads": 20,
  "max_source_positions": 1500,
  "max_target_positions": 448,   // 限制 max_new_tokens 上限
  "vocab_size": 51866,
  "transformers.js_config": {
    "use_external_data_format": { "encoder_model.onnx": true }
  }
}
```

**量化配置：** `quantize_config.json` 指定 `fp16` 基准，Q4F16 量化在保持 fp16 精度的同时压缩模型体积。

### 性能计时

代码内置全链路计时（`console.time` / `performance.now`）：

| 计时标签 | 含义 |
|---------|------|
| `⏱️ 模型加载` | Whisper 模型加载耗时 |
| `⏱️ 转写总耗时` | 从开始到结束的总时间 |
| `[块N] extract_features` | 梅尔频谱特征提取 |
| `[块N] generate` | Whisper 模型推理 |
| `[块N] decode` | 解码 + 时间戳解析 + 去重 |
| `[块N] 后处理` | 文本清理 + 数组操作 |
| `[块N] 🔵 整块总耗时` | 单块完整处理时间 |
| `[块N] ⏱ 块间等待` | 块间 GC 延迟等开销 |

## B站 API 功能实现

### 视频信息获取
```javascript
// background.js - getBilibiliVideoInfo(videoId)
// 支持 BV 号和 AV 号两种查询方式
const url = videoId.startsWith('BV')
  ? `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`
  : `https://api.bilibili.com/x/web-interface/view?aid=${videoId}`;
// 返回: title, author, bvid, aid, cid, duration, view_count, like_count, mid
```

### 批量导入方式

| 方式 | URL 类型 | 实现函数 |
|------|---------|---------|
| 单个视频 | `bilibili.com/video/BV...` | `fetchBilibiliVideoInfo()` |
| 收藏夹 | `bilibili.com/fav/...` | `fetchFavoriteList(mediaId)` — 分页每页 20 |
| 合集/系列 | `space.bilibili.com/MID/lists/SEASON` | `fetchCollectionList(mid, seasonId)` — 分页每页 30 |
| UP主主页 | `space.bilibili.com/MID` | `fetchUserVideoList(mid)` — WBI 签名，分页 |
| 视频分P | 自动检测多P视频 | `fetchVideoParts(videoId)` |

### 视频数据结构
```javascript
{
  id, bvid, aid, cid,
  title, author, mid,
  subtitleStatus: '未获取' | '获取中' | '获取成功' | '获取失败' | '无外挂字幕',
  subtitleText: null | string,
  view_count, like_count,
  publishDate, duration, page
}
```

## 扩展权限

| 权限 | 用途 |
|------|------|
| `sidePanel` | 侧边栏 UI |
| `activeTab` | 访问当前标签页 |
| `tabs` | 标签页操作 |
| `storage` | 数据持久化 |
| `scripting` | 脚本注入（Cookie 获取、音频下载） |
| `cookies` | Cookie 访问 |
| `offscreen` | Offscreen Document（后台推理） |

**Host 权限：** `api.bilibili.com`、`bilibili.com`、`*.bilivideo.com`（CDN）、`hdslb.com`（图片）、`cdn.jsdelivr.net`

**CSP 策略：** `script-src 'self' 'wasm-unsafe-eval'` — `wasm-unsafe-eval` 是 ONNX Runtime WASM 执行所必需的。

## 性能优化

| 优化项 | 实现 |
|--------|------|
| 单次推理 | 消除 generate fallback，每块只推理一次 |
| WebGPU 加速 | 优先使用 GPU 推理，q4f16 量化减少显存占用 |
| 贪心解码 | `num_beams: 1` + `do_sample: false`，最快推理路径 |
| stride 优化 | 块间重叠从 10 秒减为 6 秒，减少重复转录区域 |
| 本地 ONNX Runtime | WASM/JSEP 文件打包在扩展内，避免 CSP 拦截 CDN 下载 |
| 分块 OOM 保护 | try-catch 跳过失败块，每块后 500ms GC 延迟 |
| 繁简转换 | 内置 1000+ 字符映射表，处理 Whisper 输出的繁体字 |
