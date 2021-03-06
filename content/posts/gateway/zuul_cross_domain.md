---
title: "Zuul网关跨域问题"
date: "2021-07-23"
description: "Zuul跨域问题，记录一次重复配置导致的问题"
tags: ["2021"]
categories: ["网关"]
keywords: ["网关","Zuul","跨域","CORS","跨域资源共享"]
---

### 跨域概述
* 跨域就指着协议，域名，端口不一致，出于安全考虑，跨域的资源之间是无法交互的。简单说就是协议不通，域名不通，端口不同都会产生跨域问题

### 跨源资源共享（CORS)
* 跨源资源共享 (CORS) （或通俗地译为跨域资源共享）是一种基于HTTP 头的机制，该机制通过允许服务器标示除了它自己以外的其它origin（域，协议和端口），这样浏览器可以访问加载这些资源。跨源资源共享还通过一种机制来检查服务器是否会允许要发送的真实请求，该机制通过浏览器发起一个到服务器托管的跨源资源的"预检"请求。在预检中，浏览器发送的头中标示有HTTP方法和真实请求中会用到的头

### 遇到的问题
* The 'Access-Control-Allow-Origin' header contains multiple values ', ', but ..

* 单个项目解决跨域问题

```java
@Configuration
public class WebMvcConfigurer extends WebMvcConfigurerAdapter {
  
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowCredentials(true)
                .allowedHeaders("*")
                .allowedOrigins("*")
                .allowedMethods("*");
    }
}
```
* 因为我们用Zuul做网关，在网关层也配置了CORS跨域问题解决，这样就会导致遇到上述错误
* 解决方法
	- 在Zuul配置文件添加 
```yaml
sensitiveHeaders: Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Credentials
```
	
	
	



