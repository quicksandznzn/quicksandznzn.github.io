---
title: "Apk脱壳"
date: "2021-12-13"
description: "记录一次Apk脱壳"
tags: ["2021"]
categories: ["爬虫"]
keywords: ["Frida","奇虎","拖壳"]
---

### Q

![showcase](https://quicksandznzn.github.io/image/qihoo.png)



### 准备工作

* Frida
    
    - [frida-15.1.14-py3.8-macosx-10.9-x86_64.egg](https://pypi.org/project/frida/#files)
    - pip install frida
    - pip install frida-tools
    - 网易mumu
    - [frida-server-15.1.14-android-x86_64](https://github.com/frida/frida/releases) 需要确认底层架构，网易mumu是x86_64
    - [FRIDA-DEXDump](https://github.com/hluwa/FRIDA-DEXDump.git)
    
    

### 脱壳

* adb push ~/Downloads/frida-server-15.1.14-android-x86_64 /data/local
* adb shell
* cd  /data/local
* chmod 777 frida-server-15.1.14-android-x86_64
* ./frida-server-15.1.14-android-x86_64
* 通过网易mumu打开APP
* 通过FRIDA-DEXDump执行 python main.py
* ![showcase](https://quicksandznzn.github.io/image/frida_dexdump.png)
* done !