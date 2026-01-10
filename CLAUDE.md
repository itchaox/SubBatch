# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SubBatch is a Chrome Extension (Manifest V3) for batch downloading and exporting Bilibili (B站) video subtitles. No build system - pure vanilla JavaScript loaded directly by the browser.

## Tech Stack

- Vanilla JavaScript (ES6+)
- Chrome Extension APIs (sidePanel, storage, scripting, tabs, cookies)
- JSZip for ZIP export (bundled as `jszip.min.js`)
- Bilibili Web APIs with custom WBI signature handling

## Development

No build commands. Load the extension directly in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory

## Architecture

### Three-Layer Structure

| Layer | File | Responsibility |
|-------|------|----------------|
| Background Service | `background.js` | Service Worker - API calls, Cookie management, Bilibili data fetching |
| Presentation | `sidepanel.html` + `script.js` | Side panel UI, user interactions, export handling |
| Data | `chrome.storage.local` | Cookie persistence, video list state |

### Communication Flow

Side panel sends messages to background worker via `chrome.runtime.sendMessage()`:
- `fetchBilibiliInfo` - Get video metadata
- `fetchBilibiliSubtitle` - Get subtitle content
- `fetchFavoriteList` - Get favorites videos (paginated)
- `fetchCollectionList` - Get collection/season videos
- `fetchUserCard` - Get UP主 info
- `getCookie` - Extract cookie from current Bilibili page
- `setCookie` / `updateCookie` - Save cookie to storage

## Key Files

- `manifest.json` - Extension configuration, permissions, host permissions
- `background.js` - Service Worker with all Bilibili API logic
- `sidepanel.html` - UI structure with embedded CSS
- `script.js` - Frontend logic, DOM manipulation, export functionality
- `jszip.min.js` - Third-party library for ZIP generation
- `data.js` - Additional data/configuration

## Bilibili API Patterns

### Required Headers for All Requests
```javascript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Origin': 'https://www.bilibili.com',
  'Referer': 'https://www.bilibili.com/',
  'Cookie': bilibiliCookie  // Required for authenticated endpoints
}
```

### Key Endpoints
- Video info: `https://api.bilibili.com/x/web-interface/view?bvid=XXX`
- Subtitle: `https://api.bilibili.com/x/player/wbi/v2?aid=XXX&cid=XXX`
- Favorites: `https://api.bilibili.com/x/v3/fav/resource/list?media_id=XXX`
- Collection: `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=XXX&season_id=XXX`
- User card: `https://api.bilibili.com/x/web-interface/card?mid=XXX`
- Personal homepage videos: `https://api.bilibili.com/x/space/wbi/arc/search?mid=XXX` (requires WBI signature)

### Personal Homepage MID

From a personal homepage URL like `https://space.bilibili.com/521041866`, the `mid` (user ID) is `521041866`. This is used for fetching user videos and information.

### Cookie Requirements
Cookie must contain: `SESSDATA=`, `bili_jct=`, `DedeUserID=` for most operations.

### Request Intervals
Use 500ms delay between requests to avoid rate limiting. Maximum 2 retries on failure.

### WBI Signature

Bilibili uses WBI (Web Browser Interface) signature for certain API endpoints as an anti-scraping measure. WBI-signed requests require `w_rid` and `wts` query parameters.

**Key points:**

- Most subtitle APIs require WBI signature
- The signature parameters are generated from `img_key` and `sub_key` tokens
- These keys can be obtained from `https://api.bilibili.com/x/web-interface/nav` endpoint
- The keys are returned in `wbi_img.img_url` and `wbi_img.sub_url` (extract filename from URL)
- Keys are site-wide and typically change daily

**Implementation notes:**

- The `background.js` handles WBI requests automatically via `fetchWbiRequest()`
- Standard mixin key permutation table is used for signature generation
- Parameters are sorted alphabetically before signing
- MD5 hash is computed on the sorted query string + mixin key

## Video Data Structure

```javascript
{
  id, bvid, aid, cid, title, author,
  subtitleStatus: '未获取' | '获取中' | '获取成功' | '获取失败' | '无字幕文件',
  subtitleText: null | string,
  view_count, like_count, mid
}
```

## Export Formats

- **SRT**: Standard format with timestamps (HH:MM:SS,mmm)
- **TXT**: Plain text only, suitable for AI knowledge bases like NotebookLM

## UI Components

### Custom Dropdown (`custom-select-container`)

The side panel uses a custom dropdown implementation (not native `<select>`) for the URL type selector:

- `.custom-select-trigger` - The visible trigger element
- `.custom-select-dropdown` - The dropdown options list
- `.custom-select-option` - Individual options with `data-value` attribute
- Current selection tracked via `currentUrlType` variable
- Supports both mouse and touch events

### Video Table Structure

The video list table uses a split-header design for synchronized scrolling:

- `#tableHeaderContainer` - Fixed header with column titles
- `#tableBodyContainer` - Scrollable body with video rows
- Horizontal scroll events from body sync to header
- Table uses `table-layout: fixed` with defined column widths

## Development Rules

- Do not create temporary files
- Follow existing code style (ES6+, Chinese comments)
- Use message passing between side panel and background
- Add 500ms delays between Bilibili API requests

## Common Tasks

### Add New Bilibili API Endpoint
1. Add handler in `background.js` `chrome.runtime.onMessage` listener
2. Create request function with proper headers and error handling
3. Add message type constant if needed in `script.js`
4. Test with actual Bilibili content

### Modify Export Format
1. Update `convertToSrtFormat()` or `convertToTxtFormat()` in `script.js`
2. Update format selection dialog if needed

### Debug Cookie Issues

The extension includes built-in cookie diagnostics:

- `logCookieStatus()` - Logs current cookie status
- `diagnoseCookie()` - Runs comprehensive cookie validation
- Check browser DevTools console for detailed cookie logs
