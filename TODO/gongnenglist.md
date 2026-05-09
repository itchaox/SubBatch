1. 接入语音识别 APi, 卖 API 调用，速度更快，更稳定~

[]

SenseVoiceSmall INT8 的转写速度可能比 whisper-large-v3-turbo 更快，后续可以尝试接入 SenseVoiceSmall INT8 模型，查看是否能提高转写速度。

# MVP 音频转字幕模型策略

## Summary

MVP 第一版继续使用现有 `whisper-large-v3-turbo q4f16`，暂不接入 SenseVoiceSmall INT8。先把“音频转字幕可用、稳定、准确”上线，再把 SenseVoice 作为下一版性能优化分支验证。

## Key Changes

- 本次 MVP 不替换模型，不改核心转写架构。
- 保留现有 `whisper-large-v3-turbo q4f16` 作为默认音频转字幕模型。
- UI 文案上弱化速度预期，例如提示“本地转写较耗时，请勿关闭侧边栏”。
- 先不新增模型选择器，避免 MVP 复杂度膨胀。
- 下一阶段单独开 SenseVoice 技术验证分支，只验证中/英/粤/日/韩快速转写，不混入主线功能。

## Why

- Whisper 当前准确率和流程已经可接受，适合 MVP 首发。
- SenseVoice 的接入不是简单模型替换，预计需要重做或适配一层新的推理引擎。
- 最大风险在音频转字幕链路本身：模型加载、WASM、CSP、时间戳、长音频切分、SRT 生成。
- MVP 阶段速度慢一点，比引入新模型导致功能不稳定更可控。
- 7 分钟转 3 分钟虽然体验不完美，但用户能理解“本地 AI 转写需要时间”；转写失败、时间戳乱、导出异常更伤首版信任。

## Next Step

- MVP 上线后收集真实反馈：用户是否主要抱怨速度，还是准确率、失败率、导出质量。
- 准备 20-30 个 B 站真实样本，对比 Whisper 和 SenseVoice。
- 如果 SenseVoice 在主语言样本里准确率接近、速度稳定快 2 倍以上，再把它做成默认快速模型。
- 到那时推荐架构是：`SenseVoiceSmall INT8` 做默认快速模型，`whisper-large-v3-turbo` 做高准确率/全语言兜底模型。

## Assumptions

- 当前目标是插件第一次上线音频转字幕，而不是立刻做性能最优版本。
- 你希望尽量降低调试成本和首版翻车概率。
- 主要语言虽然集中在中/英/粤/日/韩，但首版仍然需要保留更强的通用性和稳定性。
