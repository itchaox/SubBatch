## 功能

通过个人主页地址获取视频

[查询用户投稿视频明细]
API 接口地址: https://api.bilibili.com/x/space/wbi/arc/search

请求方式：GET
鉴权方式：Wbi 签名

## 提示

- 我在个人主页地址是 : https://space.bilibili.com/521041866 的时候,其中 521041866 就是 目标用户 mid

我直接去 B 站后台看到 URL 调用是这个样子的,这个 URL 很长,应该就是做了 Wbi 签名的,具体的方式可以参考后续的 wbi 签名

```
https://api.bilibili.com/x/space/wbi/arc/search?mid=521041866&order=click&ps=25&pn=1&index=1&order_avoided=true&platform=web&web_location=333.1387&dm_img_list=[%7B%22x%22:903,%22y%22:583,%22z%22:0,%22timestamp%22:1344503,%22k%22:126,%22type%22:0%7D,%7B%22x%22:2360,%22y%22:-396,%22z%22:71,%22timestamp%22:1347511,%22k%22:99,%22type%22:0%7D,%7B%22x%22:2511,%22y%22:-245,%22z%22:222,%22timestamp%22:1347611,%22k%22:73,%22type%22:0%7D,%7B%22x%22:2413,%22y%22:-315,%22z%22:132,%22timestamp%22:1350447,%22k%22:103,%22type%22:0%7D,%7B%22x%22:1796,%22y%22:1860,%22z%22:339,%22timestamp%22:1350549,%22k%22:70,%22type%22:0%7D,%7B%22x%22:1496,%22y%22:1778,%22z%22:75,%22timestamp%22:1350649,%22k%22:92,%22type%22:0%7D,%7B%22x%22:1954,%22y%22:2233,%22z%22:542,%22timestamp%22:1350750,%22k%22:96,%22type%22:0%7D,%7B%22x%22:1685,%22y%22:2085,%22z%22:393,%22timestamp%22:1350851,%22k%22:111,%22type%22:0%7D,%7B%22x%22:3243,%22y%22:1831,%22z%22:441,%22timestamp%22:1380085,%22k%22:112,%22type%22:0%7D,%7B%22x%22:3466,%22y%22:2173,%22z%22:675,%22timestamp%22:1380290,%22k%22:97,%22type%22:1%7D,%7B%22x%22:3270,%22y%22:1978,%22z%22:476,%22timestamp%22:1385451,%22k%22:92,%22type%22:0%7D,%7B%22x%22:3742,%22y%22:1987,%22z%22:635,%22timestamp%22:1385553,%22k%22:92,%22type%22:0%7D,%7B%22x%22:3954,%22y%22:2113,%22z%22:806,%22timestamp%22:1385654,%22k%22:118,%22type%22:0%7D,%7B%22x%22:3710,%22y%22:1869,%22z%22:562,%22timestamp%22:1385776,%22k%22:121,%22type%22:1%7D,%7B%22x%22:3643,%22y%22:1802,%22z%22:495,%22timestamp%22:1386009,%22k%22:108,%22type%22:0%7D,%7B%22x%22:4025,%22y%22:1713,%22z%22:657,%22timestamp%22:1386110,%22k%22:87,%22type%22:0%7D,%7B%22x%22:3472,%22y%22:1160,%22z%22:104,%22timestamp%22:1386294,%22k%22:79,%22type%22:1%7D,%7B%22x%22:4201,%22y%22:1882,%22z%22:831,%22timestamp%22:1386736,%22k%22:70,%22type%22:0%7D,%7B%22x%22:3747,%22y%22:1324,%22z%22:367,%22timestamp%22:1386837,%22k%22:80,%22type%22:0%7D,%7B%22x%22:4125,%22y%22:1702,%22z%22:745,%22timestamp%22:1387026,%22k%22:63,%22type%22:1%7D,%7B%22x%22:5418,%22y%22:2994,%22z%22:2041,%22timestamp%22:1387870,%22k%22:120,%22type%22:0%7D,%7B%22x%22:3428,%22y%22:745,%22z%22:690,%22timestamp%22:1387970,%22k%22:122,%22type%22:0%7D,%7B%22x%22:4251,%22y%22:1650,%22z%22:1796,%22timestamp%22:1388070,%22k%22:101,%22type%22:0%7D,%7B%22x%22:4534,%22y%22:1933,%22z%22:2079,%22timestamp%22:1388189,%22k%22:71,%22type%22:0%7D,%7B%22x%22:5621,%22y%22:3017,%22z%22:2439,%22timestamp%22:1388289,%22k%22:119,%22type%22:0%7D,%7B%22x%22:3831,%22y%22:1244,%22z%22:391,%22timestamp%22:1388391,%22k%22:121,%22type%22:0%7D,%7B%22x%22:6278,%22y%22:3691,%22z%22:2838,%22timestamp%22:1388615,%22k%22:113,%22type%22:1%7D,%7B%22x%22:4303,%22y%22:1324,%22z%22:2982,%22timestamp%22:1393026,%22k%22:122,%22type%22:0%7D,%7B%22x%22:3399,%22y%22:373,%22z%22:2219,%22timestamp%22:1393127,%22k%22:86,%22type%22:0%7D,%7B%22x%22:4055,%22y%22:1029,%22z%22:2875,%22timestamp%22:1393329,%22k%22:98,%22type%22:0%7D,%7B%22x%22:2133,%22y%22:-676,%22z%22:1061,%22timestamp%22:1393429,%22k%22:81,%22type%22:0%7D,%7B%22x%22:4184,%22y%22:1377,%22z%22:3106,%22timestamp%22:1393904,%22k%22:106,%22type%22:0%7D,%7B%22x%22:2337,%22y%22:-338,%22z%22:1093,%22timestamp%22:1394005,%22k%22:70,%22type%22:0%7D,%7B%22x%22:2750,%22y%22:-121,%22z%22:1450,%22timestamp%22:1395929,%22k%22:117,%22type%22:0%7D,%7B%22x%22:2776,%22y%22:-155,%22z%22:1587,%22timestamp%22:1396030,%22k%22:92,%22type%22:0%7D,%7B%22x%22:4251,%22y%22:1321,%22z%22:3059,%22timestamp%22:1396442,%22k%22:113,%22type%22:0%7D,%7B%22x%22:1375,%22y%22:-1569,%22z%22:41,%22timestamp%22:1396543,%22k%22:113,%22type%22:0%7D,%7B%22x%22:5574,%22y%22:2801,%22z%22:2991,%22timestamp%22:1399351,%22k%22:62,%22type%22:0%7D,%7B%22x%22:5835,%22y%22:3439,%22z%22:3708,%22timestamp%22:1399454,%22k%22:121,%22type%22:0%7D,%7B%22x%22:2812,%22y%22:580,%22z%22:791,%22timestamp%22:1399555,%22k%22:84,%22type%22:0%7D,%7B%22x%22:2887,%22y%22:655,%22z%22:866,%22timestamp%22:1399737,%22k%22:64,%22type%22:0%7D,%7B%22x%22:4722,%22y%22:3713,%22z%22:2712,%22timestamp%22:1399837,%22k%22:92,%22type%22:0%7D,%7B%22x%22:2396,%22y%22:1655,%22z%22:456,%22timestamp%22:1400950,%22k%22:69,%22type%22:0%7D,%7B%22x%22:1764,%22y%22:532,%22z%22:55,%22timestamp%22:1401052,%22k%22:107,%22type%22:0%7D,%7B%22x%22:5742,%22y%22:4453,%22z%22:4043,%22timestamp%22:1401153,%22k%22:114,%22type%22:0%7D,%7B%22x%22:2295,%22y%22:308,%22z%22:643,%22timestamp%22:1401254,%22k%22:118,%22type%22:0%7D,%7B%22x%22:5779,%22y%22:3626,%22z%22:4119,%22timestamp%22:1401355,%22k%22:90,%22type%22:0%7D,%7B%22x%22:2400,%22y%22:190,%22z%22:750,%22timestamp%22:1401455,%22k%22:86,%22type%22:0%7D,%7B%22x%22:2107,%22y%22:-218,%22z%22:480,%22timestamp%22:1401555,%22k%22:71,%22type%22:0%7D,%7B%22x%22:6854,%22y%22:4521,%22z%22:5228,%22timestamp%22:1401656,%22k%22:76,%22type%22:0%7D]&dm_img_str=V2ViR0wgMS4wIChPcGVuR0wgRVMgMi4wIENocm9taXVtKQ&dm_cover_img_str=QU5HTEUgKEFwcGxlLCBBTkdMRSBNZXRhbCBSZW5kZXJlcjogQXBwbGUgTTEgUHJvLCBVbnNwZWNpZmllZCBWZXJzaW9uKUdvb2dsZSBJbmMuIChBcHBsZS&dm_img_inter=%7B%22ds%22:[%7B%22t%22:2,%22c%22:%22cmFkaW8tZmlsdGVyX19pdGVtIHJhZGlvLWZpbHRlcl9faXRlbS0tYWN0aX%22,%22p%22:[1486,88,1317],%22s%22:[73,399,354]%7D],%22wh%22:[2892,1409,48],%22of%22:[7551,9822,31]%7D&w_rid=bbed8a823480c59c7fb59ba6f61537d4&wts=1764779568
```

## URL 参数

参数名 类型 内容 必要性 备注
mid num 目标用户 mid 必要
order str 排序方式 非必要 默认为 pubdate
最新发布：pubdate
最多播放：click
最多收藏：stow
tid num 筛选目标分区 非必要 默认为 0
0：不进行分区筛选
分区 tid 为所筛选的分区
keyword str 关键词筛选 非必要 用于使用关键词搜索该 UP 主视频稿件
pn num 页码 非必要 默认为 1
ps num 每页项数 非必要 默认为 30

## json 回复

根对象：

字段 类型 内容 备注
code num 返回值 0：成功
-400：请求错误
-412：请求被拦截
message str 错误信息 默认为 0
ttl num 1
data obj 信息本体
data 对象：

字段 类型 内容 备注
list obj 列表信息
page obj 页面信息
episodic_button obj “播放全部“按钮
is_risk bool
gaia_res_type num
gaia_data obj
data 中的 list 对象：

字段 类型 内容 备注
slist array 空数组
tlist obj 投稿视频分区索引
vlist array 投稿视频列表
list 中的 tlist 对象：

字段 类型 内容 备注
{tid} obj 该分区的详情 字段名为存在的分区 tid
…… obj …… 向下扩展
tlist 中的{tid}对象：

字段 类型 内容 备注
count num 投稿至该分区的视频数
name str 该分区名称
tid num 该分区 tid
list 中的 vlist 数组：

项 类型 内容 备注
0 obj 投稿视频 1
n obj 投稿视频（n+1）
…… obj …… ……
list 中的 vlist 数组中的对象：

字段 类型 内容 备注
aid num 稿件 avid
attribute num
author str 视频 UP 主 不一定为目标用户（合作视频）
bvid str 稿件 bvid
comment num 视频评论数
copyright str 视频版权类型
created num 投稿时间 时间戳
description str 视频简介
elec_arc_type num 充电为 1，否则 0 可能还有其他情况
enable_vt num 0 作用尚不明确
hide_click bool false 作用尚不明确
is_avoided num 0 作用尚不明确
is_charging_arc bool 是否为充电视频
is_lesson_video num 是否为课堂视频 0：否
1：是
is_lesson_finished num 课堂是否已完结 0：否
1：是
is_live_playback num 是否为直播回放 0：否
1：是
is_pay num 0 作用尚不明确
is_self_view bool false 作用尚不明确
is_steins_gate num 是否为互动视频 0：否
1：是
is_union_video num 是否为合作视频 0：否
1：是
jump_url str 跳转链接 跳转到课堂的链接，否则为""
length str 视频长度 MM:SS
mid num 视频 UP 主 mid 不一定为目标用户（合作视频）
meta obj 所属合集或课堂 无数据时为 null
pic str 视频封面
play num 视频播放次数
playback_position num 百分比播放进度 封面下方显示的粉色条
review num 0 作用尚不明确
season_id num 合集或课堂编号 都不属于时为 0
subtitle str 空 作用尚不明确
title str 视频标题
typeid num 视频分区 tid
video_review num 视频弹幕数
vt num 0 作用尚不明确
vt_display str 空 作用尚不明确
list 中的 vlist 数组中的对象中的 meta 对象：

字段 类型 内容 备注
attribute num 0 作用尚不明确
cover str 合集封面 URL
ep_count num 合集视频数量
ep_num num 合集视频数量
first_aid num 首个视频 av 号
id num 合集 id
intro str 合集介绍
mid num UP 主 uid 若为课堂，则为 0
ptime num unix 时间(s) 最后更新时间
sign_state num 0 作用尚不明确
stat obj 合集统计数据
title str 合集名称
list 中的 vlist 数组中的对象中的 meta 对象中的 stat 对象：

字段 类型 内容 备注
coin num 合集总投币数
danmaku num 合集总弹幕数
favorite num 合集总收藏数
like num 合集总点赞数
mtime num unix 时间(s) 其他统计数据更新时间
reply num 合集总评论数
season_id num 合集 id
share num 合集总分享数
view num 合集总播放量
vt num 0 作用尚不明确
vv num 0 作用尚不明确
data 中的 page 对象：

字段 类型 内容 备注
count num 总计稿件数
pn num 当前页码
ps num 每页项数
data 中的 episodic_button 对象：

字段 类型 内容 备注
text str 按钮文字
uri str 全部播放页 url

## 接口调用示例

pn（页码）和 ps（每页项数）只改变 vlist 中成员的多少与内容

以每页 2 项查询用户 mid=53456 的第 1 页投稿视频明细

```
curl -G 'https://api.bilibili.com/x/space/arc/search' \
--data-urlencode 'mid=53456' \
--data-urlencode 'ps=2' \
--data-urlencode 'pn=1'
```

## 接口响应示例

```
{
	"code": 0,
	"message": "0",
	"ttl": 1,
	"data": {
		"list": {
			"slist": [],
			"tlist": {
				"1": {
					"tid": 1,
					"count": 3,
					"name": "动画"
				},
				"129": {
					"tid": 129,
					"count": 1,
					"name": "舞蹈"
				},
				"160": {
					"tid": 160,
					"count": 96,
					"name": "生活"
				},
				"177": {
					"tid": 177,
					"count": 4,
					"name": "纪录片"
				},
				"181": {
					"tid": 181,
					"count": 50,
					"name": "影视"
				},
				"188": {
					"tid": 188,
					"count": 444,
					"name": "科技"
				},
				"196": {
					"tid": 196,
					"count": 2,
					"name": "课堂"
				}
			},
			"vlist": [{
				"comment": 985,
				"typeid": 250,
				"play": 224185,
				"pic": "http://i0.hdslb.com/bfs/archive/5e56c10a9bd67f2fcac46fdd0fc2caa8769700c8.jpg",
				"subtitle": "",
				"description": "这一次，我们的样片日记首次来到了西藏，在桃花季开启了藏东样片之旅！这趟“开荒”之旅我们跋山涉水，一路硬刚，多亏有路虎卫士这样的神队友撑全场！这次的素材我们也上传到了官网（ysjf.com/material），欢迎大家去看看~如果你喜欢这期视频，请多多支持我们，并把视频分享给你的朋友们一起看看！",
				"copyright": "1",
				"title": "和朋友去西藏拍样片日记……",
				"review": 0,
				"author": "影视飓风",
				"mid": 946974,
				"created": 1745290800,
				"length": "22:11",
				"video_review": 2365,
				"aid": 114375683741573,
				"bvid": "BV1ac5yzhE94",
				"hide_click": false,
				"is_pay": 0,
				"is_union_video": 1,
				"is_steins_gate": 0,
				"is_live_playback": 0,
				"is_lesson_video": 0,
				"is_lesson_finished": 0,
				"lesson_update_info": "",
				"jump_url": "",
				"meta": {
					"id": 2046621,
					"title": "样片日记",
					"cover": "https://archive.biliimg.com/bfs/archive/e2ca3e5a6672cf35c9e61ac02e8d739cc0aafa8b.jpg",
					"mid": 946974,
					"intro": "",
					"sign_state": 0,
					"attribute": 140,
					"stat": {
						"season_id": 2046621,
						"view": 31755096,
						"danmaku": 171253,
						"reply": 33685,
						"favorite": 409505,
						"coin": 935105,
						"share": 199467,
						"like": 1791607,
						"mtime": 1745309513,
						"vt": 0,
						"vv": 0
					},
					"ep_count": 13,
					"first_aid": 238588630,
					"ptime": 1745290800,
					"ep_num": 13
				},
				"is_avoided": 0,
				"season_id": 2046621,
				"attribute": 16793984,
				"is_charging_arc": false,
				"elec_arc_type": 0,
				"vt": 0,
				"enable_vt": 0,
				"vt_display": "",
				"playback_position": 0,
				"is_self_view": false
			}, {
				"comment": 0,
				"typeid": 197,
				"play": 8506,
				"pic": "https://archive.biliimg.com/bfs/archive/489f3df26a190a152ad479bfe50a73f1cd4c43c5.jpg",
				"subtitle": "",
				"description": "8节课，Tim和青青带你用iPhone拍出电影感",
				"copyright": "1",
				"title": "【影视飓风】只看8节课，用iPhone拍出电影感",
				"review": 0,
				"author": "影视飓风",
				"mid": 946974,
				"created": 1744865737,
				"length": "00:00",
				"video_review": 9,
				"aid": 114351440726681,
				"bvid": "BV1WB5ezxEnz",
				"hide_click": false,
				"is_pay": 0,
				"is_union_video": 0,
				"is_steins_gate": 0,
				"is_live_playback": 0,
				"is_lesson_video": 1,
				"is_lesson_finished": 1,
				"lesson_update_info": "8",
				"jump_url": "https://www.bilibili.com/cheese/play/ss190402215",
				"meta": {
					"id": 190402215,
					"title": "【影视飓风】只看8节课，用iPhone拍出电影感",
					"cover": "https://archive.biliimg.com/bfs/archive/489f3df26a190a152ad479bfe50a73f1cd4c43c5.jpg",
					"mid": 0,
					"intro": "",
					"sign_state": 0,
					"attribute": 0,
					"stat": {
						"season_id": 190402215,
						"view": 1111222,
						"danmaku": 1853,
						"reply": 0,
						"favorite": 0,
						"coin": 0,
						"share": 0,
						"like": 0,
						"mtime": 0,
						"vt": 0,
						"vv": 0
					},
					"ep_count": 0,
					"ptime": 1744865737,
					"ep_num": 0
				},
				"is_avoided": 0,
				"season_id": 190402215,
				"attribute": 1073758592,
				"is_charging_arc": false,
				"elec_arc_type": 0,
				"vt": 0,
				"enable_vt": 0,
				"vt_display": "",
				"playback_position": 0,
				"is_self_view": false
			}]
		},
		"page": {
			"pn": 1,
			"ps": 42,
			"count": 786
		},
		"episodic_button": {
			"text": "播放全部",
			"uri": "//www.bilibili.com/medialist/play/946974?from=space"
		},
		"is_risk": false,
		"gaia_res_type": 0,
		"gaia_data": null
	}
}

```

## Wbi 签名

自 2023 年 3 月起，Bilibili Web 端部分接口开始采用 WBI 签名鉴权，表现在 REST API 请求时在 Query param 中添加了 w_rid 和 wts 字段。WBI 签名鉴权独立于 APP 鉴权 与其他 Cookie 鉴权，目前被认为是一种 Web 端风控手段。

经持续观察，大部分查询性接口都已经或准备采用 WBI 签名鉴权，请求 WBI 签名鉴权接口时，若签名参数 w_rid 与时间戳 wts 缺失、错误，会返回 v_voucher，如：

{"code":0,"message":"0","ttl":1,"data":{"v\*voucher":"voucher**\*\*\***"}}
感谢 #631 的研究与逆向工程。

细节更新：#885。

最新进展: #919

WBI 签名算法
获取实时口令 img_key、sub_key

从 nav 接口 中获取 img_url、sub_url 两个字段的参数。 或从 bili_ticket 接口 中获取 img sub 两个字段的参数。

注：img_url、sub_url 两个字段的值看似为存于 BFS 中的 png 图片 url，实则只是经过伪装的实时 Token，故无需且不能试图访问这两个 url

{"code":-101,"message":"账号未登录","ttl":1,"data":{"isLogin":false,"wbi_img":{"img_url":"https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png","sub_url":"https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png"}}}
截取其文件名，分别记为 img_key、sub_key，如上述例子中的 7cd084941338484aae1ad9425b84077c 和 4932caff0ff746eab6f01bf08b70ac45。

img_key、sub_key 全站统一使用，观测知应为每日更替，使用时建议做好缓存和刷新处理。

特别地，发现部分接口将 img_key、sub_key 硬编码进 JavaScript 文件内，如搜索接口 https://s1.hdslb.com/bfs/static/laputa-search/client/assets/index.1ea39bea.js，暂不清楚原因及影响。 同时, 部分页面会在 SSR 的 **INITIAL_STATE** 包含 wbiImgKey 与 wbiSubKey, 具体可用性与区别尚不明确

打乱重排实时口令获得 mixin_key

把上一步获取到的 sub_key 拼接在 img_key 后面（下例记为 raw_wbi_key），遍历重排映射表 MIXIN_KEY_ENC_TAB，取出 raw_wbi_key 中对应位置的字符拼接得到新的字符串，截取前 32 位，即为 mixin_key。

重排映射表 MIXIN_KEY_ENC_TAB 长为 64，内容如下：

const MIXIN_KEY_ENC_TAB: [u8; 64] = [
46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
36, 20, 34, 44, 52
]
重排操作如下例：

fn gen*mixin_key(raw_wbi_key: impl AsRef<[u8]>) -> String {
const MIXIN_KEY_ENC_TAB: [u8; 64] = [
46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42,
19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60,
51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];
let raw_wbi_key = raw_wbi_key.as_ref();
let mut mixin_key = {
let binding = MIXIN_KEY_ENC_TAB
.iter()
// 此步操作即遍历 MIXIN_KEY_ENC_TAB，取出 raw_wbi_key 中对应位置的字符
.map(|n| raw_wbi_key[*n as usize])
// 并收集进数组内
.collect::<Vec<u8>>();
unsafe { String::from_utf8_unchecked(binding) }
};
let \* = mixin_key.split_off(32); // 截取前 32 位字符
mixin_key
}
如 img_key -> 7cd084941338484aae1ad9425b84077c、sub_key -> 4932caff0ff746eab6f01bf08b70ac45 经过上述操作后得到 mixin_key -> ea1db124af3c7062474693fa704f4ff8。

计算签名（即 w_rid）

若下方内容为欲签名的原始请求参数（以 JavaScript Object 为例）

{
foo: '114',
bar: '514',
zab: 1919810
}
wts 字段的值应为当前以秒为单位的 Unix 时间戳，如 1702204169

复制一份参数列表，添加 wts 参数，即：

{
foo: '114',
bar: '514',
zab: 1919810,
wts: 1702204169
}
随后按键名升序排序后百分号编码 URL Query，拼接前面得到的 mixin_key，如 bar=514&foo=114&wts=1702204169&zab=1919810ea1db124af3c7062474693fa704f4ff8，计算其 MD5 即为 w_rid。

需要注意的是：如果参数值含中文或特殊字符等，编码字符字母应当大写 （部分库会错误编码为小写字母），空格应当编码为 %20（部分库按 application/x-www-form-urlencoded 约定编码为 +）, 具体正确行为可参考 encodeURIComponent 函数

例如：

{
foo: 'one one four',
bar: '五一四',
baz: 1919810
}
应该被编码为 bar=%E4%BA%94%E4%B8%80%E5%9B%9B&baz=1919810&foo=one%20one%20four。

向原始请求参数中添加 w_rid、wts 字段

将上一步得到的 w_rid 以及前面的 wts 追加到原始请求参数编码得到的 URL Query 后即可，目前看来无需对原始请求参数排序。

如前例最终得到 bar=514&foo=114&zab=1919810&w_rid=8f6f2b5b3d485fe1886cec6a0be8c5d4&wts=1702204169。

### Wbi 签名 的 Demo

[Javascript 示例]
需要 fetch(浏览器、NodeJS 等环境自带)、md5 依赖

```
import md5 from 'md5'

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig) => mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)

// 为请求参数进行 wbi 签名
function encWbi(params, img_key, sub_key) {
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g

  Object.assign(params, { wts: curr_time }) // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object
    .keys(params)
    .sort()
    .map(key => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

  const wbi_sign = md5(query + mixin_key) // 计算 w_rid

  return query + '&w_rid=' + wbi_sign
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys() {
  const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
    headers: {
      // SESSDATA 字段
      Cookie: 'SESSDATA=xxxxxx',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      Referer: 'https://www.bilibili.com/'//对于直接浏览器调用可能不适用
    }
  })
  const { data: { wbi_img: { img_url, sub_url } } } = await res.json()

  return {
    img_key: img_url.slice(
      img_url.lastIndexOf('/') + 1,
      img_url.lastIndexOf('.')
    ),
    sub_key: sub_url.slice(
      sub_url.lastIndexOf('/') + 1,
      sub_url.lastIndexOf('.')
    )
  }
}

async function main() {
  const web_keys = await getWbiKeys()
  const params = { foo: '114', bar: '514', baz: 1919810 },
    img_key = web_keys.img_key,
    sub_key = web_keys.sub_key
  const query = encWbi(params, img_key, sub_key)
  console.log(query)
}

main()
```

输出内容为进行 Wbi 签名的后参数的 url query 形式

bar=514&baz=1919810&foo=114&wts=1684805578&w_rid=bb97e15f28edf445a0e4420d36f0157e
