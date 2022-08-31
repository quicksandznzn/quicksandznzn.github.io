---
title: "FFmpeg"
date: "2021-12-13"
description: "FFmpeg 学习笔记"
tags: ["2022"]
categories: ["FFmpeg"]
keywords: ["FFmpeg","视频","音频"]
---

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
