---
title: "FFmpeg"
date: "2022-09-01"
description: "FFmpeg 学习笔记"
tags: ["2022"]
categories: ["FFmpeg"]
keywords: ["FFmpeg","视频","音频"]
---
### 视频信息
```shell
ffmpeg -i example.mp4

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

```shell
ffmpeg -threads 0 -i example.mp4 -b:v 3096k  -r 35 -c:v libx264 -acodec aac -y compress.mp4
```

* 描述
    -  压缩视频码率为 3096k 35 fps 视频采用h264编码 音频采用aac编码
    - -threads 线程数 (auto,0) 默认为auto
    - -b:v 视频码率 b=bit rate v=video 3096 kbit/s
    - -r 帧率 r=frame rate 35 fps
    - -c:v 视频编码 c=codec v=video libx264=h264
    - -acodec 音频编码 a=audio aac
    - -y 直接覆盖文件不用询问

#### 转码 mov转mp4

```shell
ffmpeg  -i example.mov -c:v libx264  -y compress.mp4
```

#### 截图
```shell
ffmpeg -ss 0 -i example.mp4 -r 1 -vframes 1 -s 352x240 -y output%d.jpg
ffmpeg -ss 0 -i example.mp4 -r 1 -t 1 -y output%d.jpg
```

* 描述
    - 两个例子都是从0秒开始截一张图
    - -ss 从0秒开始 把-ss 0 放到第一个参数的位置，速度比放到放到其他位置快 
    - -vframes 截图帧数 或者使用-t : 截图时长 seconds
    - -s  图片宽高比

#### 参考文章
* https://www.cnblogs.com/anfeio/p/3712218.html