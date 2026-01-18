# 获取分 P 列表

- 名字:查询视频分P列表 (avid/bvid转cid)
  API 地址: https://api.bilibili.com/x/player/pagelist

请求方式：GET

url参数：

参数名 类型 内容 必要性 备注
aid num 稿件avid 必要（可选） avid与bvid任选一个
bvid str 稿件bvid 必要（可选） avid与bvid任选一个
json回复：

根对象：

字段 类型 内容 备注
code num 返回值 0：成功
-400：请求错误
-404：无视频
message str 错误信息 默认为0
ttl num 1
data array 分P列表
数组data：

项 类型 内容 备注
0 obj 1P内容 无分P仅有此项
n obj (n+1)P内容
…… obj …… ……
数组data中的对象：

字段 类型 内容 备注
cid num 当前分P cid
page num 当前分P
from str 视频来源 vupload：普通上传（B站）
hunan：芒果TV
qq：腾讯
part str 当前分P标题
duration num 当前分P持续时间 单位为秒
vid str 站外视频vid
weblink str 站外视频跳转url
dimension obj 当前分P分辨率 有部分视频无法获取分辨率
first_frame str 分P封面
数组data中的对象中的dimension对象：

字段 类型 内容 备注
width num 当前分P 宽度
height num 当前分P 高度
rotate num 是否将宽高对换 0：正常
1：对换
示例：

查询视频av13502509/BV1ex411J7GE的分P列表

avid方式：

curl -G 'https://api.bilibili.com/x/player/pagelist' \
--data-urlencode 'aid=13502509'
bvid方式：

curl -G 'https://api.bilibili.com/x/player/pagelist' \
--data-urlencode 'bvid=BV1ex411J7GE'

[响应示例]
{
"code": 0,
"message": "0",
"ttl": 1,
"data": [{
"cid": 66445301,
"page": 1,
"from": "vupload",
"part": "00. 宣传短片",
"duration": 33,
"vid": "",
"weblink": "",
"dimension": {
"width": 1920,
"height": 1080,
"rotate": 0
}
}, {
"cid": 35039663,
"page": 2,
"from": "vupload",
"part": "01. 火柴人与动画师",
"duration": 133,
"vid": "",
"weblink": "",
"dimension": {
"width": 1484,
"height": 1080,
"rotate": 0
}
}, {
"cid": 35039678,
"page": 3,
"from": "vupload",
"part": "02. 火柴人与动画师 II",
"duration": 210,
"vid": "",
"weblink": "",
"dimension": {
"width": 1484,
"height": 1080,
"rotate": 0
}
}, {
"cid": 35039693,
"page": 4,
"from": "vupload",
"part": "03. 火柴人与动画师 III",
"duration": 503,
"vid": "",
"weblink": "",
"dimension": {
"width": 992,
"height": 720,
"rotate": 0
}
}]
}
