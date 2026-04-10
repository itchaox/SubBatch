通过音频转写文本获取字幕
音频接口 @API/videostream_url.md

使用第三方工具：whisper

- 地址：https://github.com/openai/whisper

接下来我会给你这个视频音频的一个地址。 你只需要获取这个 https://api.bilibili.com/x/player/wbi/playurl 接口里面返回的 data 里面的 dash 的 audio 数组的第一个元素的 baseUrl 即为我们这次要获取的 m4s 格式的音频文件，拿到这个音频文件再用相关的第三方工具做音频解析为字幕的操作，这个第三方工具到时候会直接内置到用户浏览器里面去的，我们不使用第三方云服务器来处理的方式。
