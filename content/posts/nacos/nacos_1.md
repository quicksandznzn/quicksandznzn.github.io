---
title: "Nacos-1.4.1配置中心源码分析"
date: "2022-06-15"
description: "Nacos-1.4.1配置中心源码分析"
tags: ["2022"]
categories: ["配置中心"]
keywords: ["Nacos","配置中心"]
---

基于spring-cloud-starter-alibaba-nacos-config源码分析

### 初始化将参数配置追加到Environment

spring.factories

```java
org.springframework.cloud.bootstrap.BootstrapConfiguration=\
com.alibaba.cloud.nacos.NacosConfigBootstrapConfiguration
```

```java
public class NacosConfigBootstrapConfiguration {
	 
	 // 初始化Nacos配置信息
   @Bean
   @ConditionalOnMissingBean
   public NacosConfigProperties nacosConfigProperties() {
      return new NacosConfigProperties();
   }
	 
	 // 初始化NacosConfigService
   @Bean
   @ConditionalOnMissingBean
   public NacosConfigManager nacosConfigManager(
         NacosConfigProperties nacosConfigProperties) {
      return new NacosConfigManager(nacosConfigProperties);
   }
	 
	 // 从Nacos加载远程配置文件
   @Bean
   public NacosPropertySourceLocator nacosPropertySourceLocator(
         NacosConfigManager nacosConfigManager) {
      return new NacosPropertySourceLocator(nacosConfigManager);
   }

}
```

```java
public class NacosPropertySourceLocator implements PropertySourceLocator {

   @Override
   public PropertySource<?> locate(Environment env) {
      nacosConfigProperties.setEnvironment(env);
      ConfigService configService = nacosConfigManager.getConfigService();

      if (null == configService) {
         log.warn("no instance of config service found, can't load config from nacos");
         return null;
      }
      long timeout = nacosConfigProperties.getTimeout();
      nacosPropertySourceBuilder = new NacosPropertySourceBuilder(configService,
            timeout);
      String name = nacosConfigProperties.getName();

      String dataIdPrefix = nacosConfigProperties.getPrefix();
      if (StringUtils.isEmpty(dataIdPrefix)) {
         dataIdPrefix = name;
      }

      if (StringUtils.isEmpty(dataIdPrefix)) {
         dataIdPrefix = env.getProperty("spring.application.name");
      }

      CompositePropertySource composite = new CompositePropertySource(
            NACOS_PROPERTY_SOURCE_NAME);
      
      // 优先级 本应用配置>扩展配置>共享配置
			// 加载共享配置
      loadSharedConfiguration(composite);
      // 加载扩展配置
      loadExtConfiguration(composite);
      // 加载本应用配置
      loadApplicationConfiguration(composite, dataIdPrefix, nacosConfigProperties, env);
      return composite;
   }
```

三类配置的加载源码主要逻辑是从NacosConfigService.getConfigInner方法根据dataId和group远程获取配置（/v1/cs/configs），存本地快照

### Nacos配置修改动态刷新

#### 初始化NacosContextRefresher给所有data-id添加监听器

spring.factories

```
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.alibaba.cloud.nacos.NacosConfigAutoConfiguration
```

```java
public class NacosConfigAutoConfiguration {

	
	 // 初始化NacosContextRefresher
   @Bean
   public NacosContextRefresher nacosContextRefresher(
         NacosConfigManager nacosConfigManager,
         NacosRefreshHistory nacosRefreshHistory) {
      // Consider that it is not necessary to be compatible with the previous
      // configuration
      // and use the new configuration if necessary.
      return new NacosContextRefresher(nacosConfigManager, nacosRefreshHistory);
   }

}
```

```java
public class NacosContextRefresher
      implements ApplicationListener<ApplicationReadyEvent>, ApplicationContextAware {
	 
	 // 遍历所有data-id添加监听器
   /**
    * register Nacos Listeners.
    */
   private void registerNacosListenersForApplications() {
      if (isRefreshEnabled()) {
         for (NacosPropertySource propertySource : NacosPropertySourceRepository
               .getAll()) {
            if (!propertySource.isRefreshable()) {
               continue;
            }
            String dataId = propertySource.getDataId();
            registerNacosListener(propertySource.getGroup(), dataId);
         }
      }
   }
	 
	 // 有变化发送RefreshEvent事件 
   private void registerNacosListener(final String groupKey, final String dataKey) {
      String key = NacosPropertySourceRepository.getMapKey(dataKey, groupKey);
      Listener listener = listenerMap.computeIfAbsent(key,
            lst -> new AbstractSharedListener() {
               @Override
               public void innerReceive(String dataId, String group,
                     String configInfo) {
                  refreshCountIncrement();
                  nacosRefreshHistory.addRefreshRecord(dataId, group, configInfo);
                  // todo feature: support single refresh for listening
                  applicationContext.publishEvent(
                        new RefreshEvent(this, null, "Refresh Nacos config"));
                  if (log.isDebugEnabled()) {
                     log.debug(String.format(
                           "Refresh Nacos config group=%s,dataId=%s,configInfo=%s",
                           group, dataId, configInfo));
                  }
               }
            });
      try {
         configService.addListener(dataKey, groupKey, listener);
      }
      catch (NacosException e) {
         log.warn(String.format(
               "register fail for nacos listener ,dataId=[%s],group=[%s]", dataKey,
               groupKey), e);
      }
   }
}
```



#### 客户端长轮询拉取Nacos配置

初始化NacosConfigService的时候会初始化ClientWorker

```java
public NacosConfigService(Properties properties) throws NacosException {
    ValidatorUtils.checkInitParam(properties);
    String encodeTmp = properties.getProperty(PropertyKeyConst.ENCODE);
    if (StringUtils.isBlank(encodeTmp)) {
        this.encode = Constants.ENCODE;
    } else {
        this.encode = encodeTmp.trim();
    }
    initNamespace(properties);
    
    this.agent = new MetricsHttpAgent(new ServerHttpAgent(properties));
    this.agent.start();
  	// 初始化ClientWorker
    this.worker = new ClientWorker(this.agent, this.configFilterChainManager, properties);
}
```

```java
public ClientWorker(final HttpAgent agent, final ConfigFilterChainManager configFilterChainManager,
        final Properties properties) {
    // 初始化单线程线程池，每10MS执行一次checkConfigInfo()
    this.executor.scheduleWithFixedDelay(new Runnable() {
        @Override
        public void run() {
            try {
                checkConfigInfo();
            } catch (Throwable e) {
                LOGGER.error("[" + agent.getName() + "] [sub-check] rotate check error", e);
            }
        }
    }, 1L, 10L, TimeUnit.MILLISECONDS);
}
```

执行LongPollingRunnable

```java
class LongPollingRunnable implements Runnable {
    
    private final int taskId;
    
    public LongPollingRunnable(int taskId) {
        this.taskId = taskId;
    }
    
    @Override
    public void run() {
        
        List<CacheData> cacheDatas = new ArrayList<CacheData>();
        List<String> inInitializingCacheList = new ArrayList<String>();
        try {
            // 检查本地配置
            // check failover config
            for (CacheData cacheData : cacheMap.values()) {
                if (cacheData.getTaskId() == taskId) {
                    cacheDatas.add(cacheData);
                    try {
                        checkLocalConfig(cacheData);
                        if (cacheData.isUseLocalConfigInfo()) {
                            cacheData.checkListenerMd5();
                        }
                    } catch (Exception e) {
                        LOGGER.error("get local config info error", e);
                    }
                }
            }
            
          	// 长轮询-根据dataId和group 服务端获取配置(/v1/cs/configs/listener)  
          	// 如果有变化返回group
            // check server config
            List<String> changedGroupKeys = checkUpdateDataIds(cacheDatas, inInitializingCacheList);
            if (!CollectionUtils.isEmpty(changedGroupKeys)) {
                LOGGER.info("get changedGroupKeys:" + changedGroupKeys);
            }
            
            for (String groupKey : changedGroupKeys) {
                String[] key = GroupKey.parseKey(groupKey);
                String dataId = key[0];
                String group = key[1];
                String tenant = null;
                if (key.length == 3) {
                    tenant = key[2];
                }
                try {
                    // 去服务端获取最新的配置更新本地数据cacheMap
                    String[] ct = getServerConfig(dataId, group, tenant, 3000L);
                    CacheData cache = cacheMap.get(GroupKey.getKeyTenant(dataId, group, tenant));
                    cache.setContent(ct[0]);
                    if (null != ct[1]) {
                        cache.setType(ct[1]);
                    }
                    LOGGER.info("[{}] [data-received] dataId={}, group={}, tenant={}, md5={}, content={}, type={}",
                            agent.getName(), dataId, group, tenant, cache.getMd5(),
                            ContentUtils.truncateContent(ct[0]), ct[1]);
                } catch (NacosException ioe) {
                    String message = String
                            .format("[%s] [get-update] get changed config exception. dataId=%s, group=%s, tenant=%s",
                                    agent.getName(), dataId, group, tenant);
                    LOGGER.error(message, ioe);
                }
            }
            for (CacheData cacheData : cacheDatas) {
                if (!cacheData.isInitializing() || inInitializingCacheList
                        .contains(GroupKey.getKeyTenant(cacheData.dataId, cacheData.group, cacheData.tenant))) {
                    // 遍历listeners，取到NacosContextRefresher注册的listener，执行innerReceive方法，发送RefreshEvent事件
                    cacheData.checkListenerMd5();
                    cacheData.setInitializing(false);
                }
            }
            inInitializingCacheList.clear();
            
            executorService.execute(this);
            
        } catch (Throwable e) {
            
            // If the rotation training task is abnormal, the next execution time of the task will be punished
            LOGGER.error("longPolling error : ", e);
            executorService.schedule(this, taskPenaltyTime, TimeUnit.MILLISECONDS);
        }
    }
}					
```



#### 服务端长轮询逻辑

```java
public String doPollingConfig(HttpServletRequest request, HttpServletResponse response,
        Map<String, String> clientMd5Map, int probeRequestSize) throws IOException {
    
    // Long polling.
    // 判断是否是长轮询
    if (LongPollingService.isSupportLongPolling(request)) {
        longPollingService.addLongPollingClient(request, response, clientMd5Map, probeRequestSize);
        return HttpServletResponse.SC_OK + "";
    }
    
}
```

```java
public void addLongPollingClient(HttpServletRequest req, HttpServletResponse rsp, Map<String, String> clientMd5Map,
        int probeRequestSize) {
    
    String str = req.getHeader(LongPollingService.LONG_POLLING_HEADER);
    String noHangUpFlag = req.getHeader(LongPollingService.LONG_POLLING_NO_HANG_UP_HEADER);
    String appName = req.getHeader(RequestUtil.CLIENT_APPNAME_HEADER);
    String tag = req.getHeader("Vipserver-Tag");
    int delayTime = SwitchService.getSwitchInteger(SwitchService.FIXED_DELAY_TIME, 500);
    
    // 长轮询时间为30s-500ms=29.5s
    // Add delay time for LoadBalance, and one response is returned 500 ms in advance to avoid client timeout.
    long timeout = Math.max(10000, Long.parseLong(str) - delayTime);
    if (isFixedPolling()) {
        timeout = Math.max(10000, getFixedPollingInterval());
        // Do nothing but set fix polling timeout.
    } else {
        long start = System.currentTimeMillis();
        List<String> changedGroups = MD5Util.compareMd5(req, rsp, clientMd5Map);
        if (changedGroups.size() > 0) {
            generateResponse(req, rsp, changedGroups);
            LogUtil.CLIENT_LOG.info("{}|{}|{}|{}|{}|{}|{}", System.currentTimeMillis() - start, "instant",
                    RequestUtil.getRemoteIp(req), "polling", clientMd5Map.size(), probeRequestSize,
                    changedGroups.size());
            return;
        } else if (noHangUpFlag != null && noHangUpFlag.equalsIgnoreCase(TRUE_STR)) {
            LogUtil.CLIENT_LOG.info("{}|{}|{}|{}|{}|{}|{}", System.currentTimeMillis() - start, "nohangup",
                    RequestUtil.getRemoteIp(req), "polling", clientMd5Map.size(), probeRequestSize,
                    changedGroups.size());
            return;
        }
    }
    String ip = RequestUtil.getRemoteIp(req);
    
    // Must be called by http thread, or send response.
    final AsyncContext asyncContext = req.startAsync();
    
    // AsyncContext.setTimeout() is incorrect, Control by oneself
    asyncContext.setTimeout(0L);
    
    ConfigExecutor.executeLongPolling(
            new ClientLongPolling(asyncContext, clientMd5Map, ip, probeRequestSize, timeout, appName, tag));
}
```

```java
class ClientLongPolling implements Runnable {
    
    // 29.5s后执行
    // 无变化从allSubs移除当前请求
    // 响应客户端
    @Override
    public void run() {
        asyncTimeoutFuture = ConfigExecutor.scheduleLongPolling(new Runnable() {
            @Override
            public void run() {
                try {
                    getRetainIps().put(ClientLongPolling.this.ip, System.currentTimeMillis());
                    
                    // Delete subsciber's relations.
                    allSubs.remove(ClientLongPolling.this);
                    
                    if (isFixedPolling()) {
                        LogUtil.CLIENT_LOG
                                .info("{}|{}|{}|{}|{}|{}", (System.currentTimeMillis() - createTime), "fix",
                                        RequestUtil.getRemoteIp((HttpServletRequest) asyncContext.getRequest()),
                                        "polling", clientMd5Map.size(), probeRequestSize);
                        List<String> changedGroups = MD5Util
                                .compareMd5((HttpServletRequest) asyncContext.getRequest(),
                                        (HttpServletResponse) asyncContext.getResponse(), clientMd5Map);
                        if (changedGroups.size() > 0) {
                            sendResponse(changedGroups);
                        } else {
                            sendResponse(null);
                        }
                    } else {
                        LogUtil.CLIENT_LOG
                                .info("{}|{}|{}|{}|{}|{}", (System.currentTimeMillis() - createTime), "timeout",
                                        RequestUtil.getRemoteIp((HttpServletRequest) asyncContext.getRequest()),
                                        "polling", clientMd5Map.size(), probeRequestSize);
                        sendResponse(null);
                    }
                } catch (Throwable t) {
                    LogUtil.DEFAULT_LOG.error("long polling error:" + t.getMessage(), t.getCause());
                }
                
            }
            
        }, timeoutTime, TimeUnit.MILLISECONDS);
        // 将当前请求加入到allSubs
        allSubs.add(this);
    }
```

如果这期间发生变更，会发送 LocalDataChangeEvent事件,

```java
public LongPollingService() {
    allSubs = new ConcurrentLinkedQueue<ClientLongPolling>();
    
    ConfigExecutor.scheduleLongPolling(new StatTask(), 0L, 10L, TimeUnit.SECONDS);
    
    // Register LocalDataChangeEvent to NotifyCenter.
    NotifyCenter.registerToPublisher(LocalDataChangeEvent.class, NotifyCenter.ringBufferSize);
    
    // 注册订阅者监听LocalDataChangeEvent事件
    // Register A Subscriber to subscribe LocalDataChangeEvent.
    NotifyCenter.registerSubscriber(new Subscriber() {
        
        @Override
        public void onEvent(Event event) {
            if (isFixedPolling()) {
                // Ignore.
            } else {
                if (event instanceof LocalDataChangeEvent) {
                    LocalDataChangeEvent evt = (LocalDataChangeEvent) event;
                    ConfigExecutor.executeLongPolling(new DataChangeTask(evt.groupKey, evt.isBeta, evt.betaIps));
                }
            }
        }
        
        @Override
        public Class<? extends Event> subscribeType() {
            return LocalDataChangeEvent.class;
        }
    });
    
}
```

DataChangeTask接收消息遍历allSubs 找到对应的客户端请求返回给客户端结果（group+dataId）

```java
class DataChangeTask implements Runnable {
    
    @Override
    public void run() {
        try {
            ConfigCacheService.getContentBetaMd5(groupKey);
            for (Iterator<ClientLongPolling> iter = allSubs.iterator(); iter.hasNext(); ) {
                ClientLongPolling clientSub = iter.next();
                if (clientSub.clientMd5Map.containsKey(groupKey)) {
                    // If published tag is not in the beta list, then it skipped.
                    if (isBeta && !CollectionUtils.contains(betaIps, clientSub.ip)) {
                        continue;
                    }
                    
                    // If published tag is not in the tag list, then it skipped.
                    if (StringUtils.isNotBlank(tag) && !tag.equals(clientSub.tag)) {
                        continue;
                    }
                    
                    getRetainIps().put(clientSub.ip, System.currentTimeMillis());
                    iter.remove(); // Delete subscribers' relationships.
                    LogUtil.CLIENT_LOG
                            .info("{}|{}|{}|{}|{}|{}|{}", (System.currentTimeMillis() - changeTime), "in-advance",
                                    RequestUtil
                                            .getRemoteIp((HttpServletRequest) clientSub.asyncContext.getRequest()),
                                    "polling", clientSub.clientMd5Map.size(), clientSub.probeRequestSize, groupKey);
                    // 会cancelasyncTimeoutFuture
                    // 响应客户端变化的group
                    clientSub.sendResponse(Arrays.asList(groupKey));
                }
            }
        } catch (Throwable t) {
            LogUtil.DEFAULT_LOG.error("data change error: {}", ExceptionUtil.getStackTrace(t));
        }
    }
```



#### Spring RefreshEvent事件刷新配置文件解析

RefreshEvent监听者

```java
public class RefreshEventListener implements SmartApplicationListener {
   public void handle(RefreshEvent event) {
      if (this.ready.get()) { // don't handle events before app is ready
         log.debug("Event received " + event.getEventDesc());
         // 执行刷新
         Set<String> keys = this.refresh.refresh();
         log.info("Refresh keys changed: " + keys);
      }
   }
}
```

```java
public abstract class ContextRefresher {

   private RefreshScope scope;

   protected RefreshScope getScope() {
      return this.scope;
   }

   public synchronized Set<String> refresh() {
      // 发送EnvironmentChangeEvent事件
      // 监听该事件的监听器多个，只需要关注LoggingBebinde和ConfigurationPropertiesRebinder
      // ConfigurationPropertiesRebinder.rebind() 销毁原有的Bean,在重新初始化Bean
      // LoggingBebinde通过LoggingSystem重新设置日志级别
      Set<String> keys = refreshEnvironment();
      // 刷新@RefreshScope注解的类
      // 对于@RefreshScope注解的类，当每次被调用的时候，都会进行初始化，同时采用懒代理的方法，将作用域充当				初始值的缓存，当缓存存在时，不会再进行初始化。因此，对于刷新@RefreshScope注解的类，只需要将其缓存					进行清空，则在下一次访问的时候，依赖新的配置源，将生成新的缓存
      this.scope.refreshAll();
      return keys;
   }
```
