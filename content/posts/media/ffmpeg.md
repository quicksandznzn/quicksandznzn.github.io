---
title: "FFmpeg"
date: "2022-09-01"
description: "FFmpeg 学习笔记"
tags: ["2022"]
categories: ["FFmpeg"]
keywords: ["FFmpeg","视频","音频"]
---

### FFmpeg官方文档

https://ffmpeg.org/ffmpeg-all.html

https://ffmpeg.org/ffmpeg.html

### 视频信息

```shell
ffmpeg -i input.mp4

Metadata:
    major_brand     : mp42
    minor_version   : 0
    compatible_brands: mp42mp41
    creation_time   : 2022-01-12T11:23:45.000000Z
  Duration: 00:00:59.52, start: 0.000000, bitrate: 12123 kb/s
  Stream #0:0[0x1](eng): Video: h264 (Main) (avc1 / 0x31637661), yuv420p(tv, bt709, progressive), 1080x1920 [SAR 1:1 DAR 9:16], 11802 kb/s, 25 fps, 25 tbr, 25k tbn (default)
    Metadata:
      creation_time   : 2022-01-12T11:23:45.000000Z
      handler_name    : ?Mainconcept Video Media Handler
      vendor_id       : [0][0][0][0]
      encoder         : AVC Coding
   Stream #0:1[0x2](eng): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 317 kb/s (default)
    Metadata:
      creation_time   : 2022-01-12T11:23:54.000000Z
      handler_name    : #Mainconcept MP4 Sound Media Handler
      vendor_id       : [0][0][0][0]
```

* Metadata
    - Stream #0:0 Video
        - 视频h264编码
        - yuv420p存储格式
        - 分辨率 1080x1920
        - 采样纵横比 SAR 1:1
        - 显示宽高比 DAR 9:16
        - 码率 11802 kb/s
        - 平均帧率 25 fps
        - 帧率 该参数倾向于一个基准，往往tbr跟fps相同 25 tbr
        - 视频流 timebase 25k tbn
    - Stream #0:1 Audio
        - 音频aac编码
        - 采样率 48000Hz
        - 声道是立体声 stereo
        - 重采样 fltp格式
        - 码率 317 kb/s
* 视频大小描述
    - 视频文件大小：(11802 + 317) * 59.52 / 8 | (音频码率 + 视频码率) x 时长 / 8
    - 码率：视频文件大小 * 8 / 时长 (秒)

### Command Line

#### 压缩

#### [Reference](https://support.huaweicloud.com/live_faq/live_08_0051.html)

| 画质        |     视频分辨率 | H.264转码码率 | H.265转码码率（比H.264下降30%） |
|:----------|----------:|:---------:|:----------------------:|
| 流畅（360P）  |   640*360 |  400Kbps  |        280Kbps         |
| 标清（480P）  |   854*480 |  600Kbps  |        420Kbps         |
| 高清（720P）  |  1280*720 | 1000Kbps  |        700Kbps         |
| 超清（1080P） | 1920*1080 | 2000Kbps  |        1400Kbps        |
| 2K        | 2560*1440 | 7000Kbps  |        4900Kbps        |
| 4K        | 3840*2160 | 8000Kbps  |        5600Kbps        |

```shell
#  压缩视频码率为 3096k 35 fps 视频采用h264编码 音频采用aac编码
# -threads 核心线程数 (auto,0) 默认为auto
# -b:v 视频码率 b=bit rate v=video 3096 kbit/s
# -r 帧率 r=frame rate 35 fps
# -c:v 视频编码 c=codec v=video libx264=h264
# -acodec 音频编码 a=audio aac
# -y 直接覆盖文件不用询问
ffmpeg -y -threads 0 -i input.mp4 -b:v 3096k  -r 35 -c:v libx264 -acodec aac  result.mp4
```

#### 转码 mov转mp4

```shell
ffmpeg  -y -i input.mov -c:v libx264   result.mp4
```

#### 指定时间截图

```shell
# 两个例子都是从0秒开始截一张图
# -ss 从0秒开始 把-ss 0 放到第一个参数的位置，速度比放到放到其他位置快 
# -vframes 截图帧数 或者使用-t : 截图时长 seconds
# -s  图片宽高比
ffmpeg -ss 0 -i input.mp4 -r 1 -vframes 1 -s 352x240 -y result%d.jpg
ffmpeg -ss 00:00:00 -i input.mp4 -r 1 -t 1 -y result%d.jpg
```

#### 视频转图片(每隔一秒截取一张图)

```shell
# -q:v Quality factor. Lower is better.
ffmpeg -y -i input.mp4 -f image2 -r 1 -q:v 10 result%3d.jpg
```

#### 音视频倍速

```shell
# 2倍速 
ffmpeg -y -i input.mp4 -filter:v "setpts=0.5*PTS" -filter:a "atempo=2.0" result.mp4
```

#### 视频添加水印

```shell
# x和y表示水印在视频中的位置，视频左上角坐标为(0,0)，向右向下延伸
ffmpeg -y -i input.mp4 -i watermark.png -filter_complex "overlay=x=0:y=0" result.mp4

# main_w(W)：主画面的宽度
# main_h(H)：主画面的高度
# overlay_w(w)：水印宽度
# overlay_h(h)：水印高度
# overlay=x=W-w:y=0 右上角
# overlay=x=0:y=H-h 左下角 
ffmpeg -y -i input.mp4 -i watermark.png -filter_complex "overlay=x=0:y=H-h" result.mp4 

# gif水印
# -ignore_loop为0，让gif保持循环播放
# -shortest 将输出文件的时长设置为第一个视频文件的时长，如果不设置，你会发现命令会一直执行根本不会停下来，因为gif图的循环是无限的
ffmpeg -y -i input.mp4 -ignore_loop 0 -i watermark.gif -filter_complex overlay -shortest result.mp4

# 左上 左下 两个水印
ffmpeg -y -i input.mp4 -i watermark.png -i watermark2.png -filter_complex "overlay=x=0:y=0,overlay=x=0:y=H-h" result.mp4 

# 水印显示5秒，5秒后消失 
ffmpeg -y -i input.mp4 -i watermark.png -filter_complex "overlay=enable='lte(t,5)'" result.mp4 

# 第一个水印显示4秒后消失，2秒后第二个水印显示4秒后消失。
ffmpeg -y -i input.mp4 -i watermark.png -i watermark2.png -filter_complex "overlay=enable='lte(mod(t,10),4)',overlay=enable='gt(mod(t,10),6)'" result.mp4 

# 让水印每秒向右移动20像素，直到消失
ffmpeg -y -i input.mp4 -ignore_loop 0 -i watermark.gif -lavfi "overlay=x=t*20" -shortest result.mp4 

# 让水印一直旋转
ffmpeg -y -i input.mp4 -loop 1 -i watermark.png -lavfi "[1:v]format=rgba,rotate='PI/2*t:c=0x00000000:ow=hypot(iw,ih):oh=ow'[out];[0:v][out]overlay=10:10" -shortest result.mp4

# 去除水印
# x —— 水印横坐标
# y —— 水印纵坐标
# w　——　水印宽
# ｈ——　水印高
ffmpeg -y -i input.mp4 -vf "delogo=x=x:y=y:w=w:h=h"   result.mp4 
```

#### Reference

* https://www.cnblogs.com/anfeio/p/3712218.html
* https://segmentfault.com/a/1190000040216980
* https://www.cnblogs.com/daner1257/p/14626348.html