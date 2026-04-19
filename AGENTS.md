# Repository Guidelines

## 项目定位
`SubBatch` 是一个 Chrome Manifest V3 扩展，做两件事：

1. 批量获取 B 站字幕。
2. 对无字幕视频做本地 Whisper 音频转字幕。

这是给 AI 用的工作手册，不是产品介绍。目标是让后续改动先知道入口、接口、字段、风险点。

## 核心文件
- `manifest.json`：权限、Side Panel、Background、资源暴露。
- `background.js`：B 站 API、WBI 签名、Cookie、音频流获取、后台转写调度。
- `script.js`：侧边栏交互、表格、导出、前端转写、状态更新。
- `sidepanel.html`：侧边栏 DOM。
- `offscreen.html`：后台音频或转写辅助页面。
- `libs/`：`transformers.min.js`、ONNX Runtime 运行时。
- `models/`：`whisper-large-v3-turbo` 主模型，`whisper-small` 降级模型。
- `REAEME-AI.md`：更完整的技术分析。

## 运行结构
- Side Panel：`sidepanel.html` + `script.js`
- Background：`background.js`
- 通信方式：`chrome.runtime.sendMessage()`

高频 `action`：
- `fetchBilibiliInfo`
- `fetchBilibiliSubtitle`
- `fetchFavoriteList`
- `fetchCollectionList`
- `fetchUserCard`
- `fetchUserVideoList`
- `fetchVideoParts`
- `transcribeAudio`
- `getCookie` / `setCookie` / `updateCookie`
- `transcribeProgress`

## 核心流程
字幕路径：
1. 解析 URL 或批量导入结果。
2. 调 `/x/web-interface/view` 补 `aid`、`cid`。
3. 优先调 WBI 字幕接口。
4. 失败时降级到非 WBI 字幕接口。
5. 若外挂字幕为空，再查 AI 字幕。
6. 下载 `subtitle_url`，统一转成 `subtitleText` / `subtitles`。

转写路径：
1. 调音频流接口取 DASH 音频地址。
2. 下载音频，解码并转 16kHz 单声道。
3. 分块送入 Whisper。
4. 合并时间戳并去重。
5. 导出 `SRT` / `TXT`。

## B站接口速查
### 视频基础信息
- `GET /x/web-interface/view?bvid={bvid}` 或 `?aid={aid}`
- 用途：补齐视频元数据，尤其是 `aid`、`cid`
- 关键字段：`data.title`、`data.owner.name`、`data.bvid`、`data.aid`、`data.cid`、`data.pages[0].cid`、`data.duration`、`data.pubdate`
- 入口：`background.js#getBilibiliVideoInfo`

### WBI 密钥
- `GET /x/web-interface/nav`
- 关键字段：`data.wbi_img.img_url`、`data.wbi_img.sub_url`
- 入口：`background.js#getWbiKeys`

### 字幕主接口
- `GET /x/player/wbi/v2?aid={aid}&cid={cid}`
- 需要 WBI：是
- 关键入参：`aid`、`cid`、`wts`、`w_rid`
- 关键字段：`data.subtitle.subtitles[]`、`subtitles[].lan`、`subtitles[].lan_doc`、`subtitles[].subtitle_url`
- 入口：`background.js#getBilibiliSubtitle`
- 备注：返回 `-400` 时代码会尝试补 `isGaiaAvoided=false`

### 字幕备用接口
- `GET /x/player/v2?cid={cid}&bvid={bvid}`
- 需要 WBI：否
- 关键字段：`data.subtitle.subtitles[]`
- 作用：主路径失败时兜底

### AI 字幕检索
- `GET /x/player/v2/ai/subtitle/search/stat?aid={aid}&cid={cid}`
- 关键字段：`data.subtitle_url`
- 作用：外挂字幕为空时检查 AI 字幕

### 字幕内容 JSON
- 来源：接口返回的 `subtitle_url`
- 普通结构：`body[].from`、`body[].to`、`body[].content`
- AI 结构：`type === 'AIsubtitle'` 且有 `body[]`
- 统一输出：`metadata`、`subtitles`、`subtitleText`
- 关键点：`subtitleText` 是导出、预览、复制、状态更新的主字段

### 音频流接口
- `GET /x/player/wbi/playurl?...`
- 需要 WBI：是
- 关键入参：`avid`、`cid`、`fnval=16`、`fourk=1`、`wts`、`w_rid`
- 关键字段：`data.dash.audio[0].baseUrl`、`backupUrl`
- 入口：`background.js#fetchAudioStreamUrl`
- 备注：拿到 URL 后仍可能受 CDN 来源限制

### 收藏夹
- `GET /x/v3/fav/resource/list?media_id={mediaId}&pn={page}&ps={pageSize}...`
- 关键字段：`data.medias[]`、`medias[].title`、`bvid`、`cover`、`upper.name`

### 合集/系列
- `GET /x/polymer/web-space/seasons_archives_list?mid={mid}&season_id={seasonId}&page_num={page}&page_size={pageSize}...`
- 关键字段：`data.archives[]`

### UP 主信息
- `GET /x/web-interface/card?mid={mid}&photo={photo}`
- 关键字段：`data.card`

### UP 主投稿
- `GET /x/space/wbi/arc/search?...`
- 需要 WBI：是
- 关键字段：`data.list.vlist[]`

### 多 P 视频
- `GET /x/player/pagelist?bvid={bvid}`
- 关键字段：`data[].cid`、`data[].page`、`data[].part`

## WBI 与 Cookie
WBI 关键函数在 `background.js`：
- `md5`
- `getMixinKey`
- `encWbi`
- `getWbiKeys`

签名流程：取 `img_key` + `sub_key`，混淆重排得 `mixin_key`，注入 `wts`，排序参数，算 `w_rid`。

Cookie 关键字段：
- `SESSDATA`
- `bili_jct`
- `DedeUserID`

Cookie 读取顺序：
1. 内存中的 `bilibiliCookie`
2. `chrome.storage.local`
3. 页面内 `document.cookie`
4. `chrome.cookies.getAll`

统一请求入口是 `background.js#fetchWithHeaders`。改 API 逻辑时优先检查这里，不要绕开它单独拼请求头。

## 数据结构
### `videoList` 单项
- `id`
- `bvid`
- `aid`
- `cid`
- `title`
- `author`
- `mid`
- `duration`
- `publishDate`
- `subtitleStatus`
- `subtitleText`

`subtitleStatus` 常见值：
- `未获取`
- `获取中`
- `获取成功`
- `无外挂字幕`
- `信息不完整`
- `获取出错: ...`

### 字幕返回结构
- `success`
- `subtitleText`
- `subtitles`
- `metadata`
- `message`

## 改动入口
- 改 API、WBI、Cookie：先看 `background.js`
- 改表格、导出、按钮、状态：先看 `script.js`
- 改侧边栏结构：先看 `sidepanel.html`
- 改模型加载、分块、去重、SRT/TXT 生成：主要看 `script.js`
- 改权限或资源暴露：先看 `manifest.json`

## 高风险点
- WBI 签名逻辑
- `fetchWithHeaders()` 的 Cookie 注入
- 字幕主接口与备用接口切换
- `subtitle_url` 下载与格式兼容
- 音频流 URL 拿到后的 CDN 下载方式
- `libs/`、`models/` 与 `web_accessible_resources`
- `subtitleText` 的统一格式

## 开发与验证
本仓库无构建步骤，直接在 `chrome://extensions` 里以“已解压扩展”加载。

注意：
- `npm test` 只是占位脚本，不是真测试。
- 修改后要手动刷新扩展。
- 回归至少覆盖：单视频字幕、批量字幕、收藏夹/合集导入、`SRT`/`TXT` 导出、Cookie 流程、音频转字幕、失败提示。

## 代码约定
- 原生 JavaScript / HTML / Chrome Extension API
- 2 空格缩进、分号、单引号
- camelCase 命名
- UI 文案默认中文
- 优先增量修改，不轻易重构 `background.js` 和 `script.js`
- 不要随意删除 `libs/` 或 `models/` 资源

## 提交约定
沿用现有前缀：
- `feat:`
- `fix:`
- `perf:`
- `docs:`
- `chore:`

如果需要更完整背景，再看 `REAEME-AI.md`；如果只是改代码，先以本文件为准。
