---
title: "微信小程序反编译"
date: "2021-08-19"
description: "记录一次小程序反编译过程"
tags: ["2021"]
categories: ["爬虫"]
keywords: ["爬虫","小程序","反编译"]
---

### 准备工作
* 网易mumu模拟器
    - Root Explorer APK
    - ES文件浏览器
    - 微信
* [小程序反编译工具](https://github.com/xuedingmiaojun/wxappUnpacker.git)

### 破解
* 打开微信搜索对应的小程序
* 通过Root Explorer找到对应目录 /data/data/com.tencent.mm/MicroMsg/7e0c9d2b7278c1fac318e91eaeae4c0f/appbrand/pkg
* ![showcase](https://quicksandznzn.github.io/image/wechat_mini_program_root_wxapkg.png)
* 通过wxappUnpacker bingo.sh 反编译得到源码

    
```