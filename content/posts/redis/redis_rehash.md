---
title: "Redis Rehash"
date: "2021-07-22"
description: "Redis Rehash 参考Redis3.2源码"
tags: ["2021"]
categories: ["缓存"]
keywords: ["Redis","Redis Rehash"]
---
### Rehash

* rehash执行条件
	- 关键说明
		- 负载因子:：load_factor = ht[0].used / ht[0].size
		- BGSAVE:：fork一个子进程来创建RDB文件，父进程可以继续处理命令请求
		- BGREWRITEAOF：AOF重写缓冲区,由于redis是单进程的，为了不在进行重写时阻塞服务，redis使用了子进程的方式进行AOF重写
		-  redis中每次开始执行aof文件重写或者开始生成新的RDB文件或者执行aof重写/生成RDB的子进程结束时，都会调用updateDictResizePolicy->dictDisableResize函数，所以从该函数中，也可以看出来，如果当前没有子进程在执行aof文件重写或者生成RDB文件，则运行进行字典扩容；否则禁止字典扩容。
	- 扩容 
		- 以下条件中的任意一个被满足时执行扩容
			- 服务器目前没有在执行 BGSAVE 命令或者 BGREWRITEAOF 命令， 并且哈希表的负载因子大于等于 1 
			- 服务器目前正在执行 BGSAVE 命令或者 BGREWRITEAOF 命令， 并且哈希表的负载因子大于等于 5 
	- 缩容
		- databasesCron->tryResizeHashTables函数检查用于保存键值对的redis数据库字典是否需要缩容 最小size是4
		- 服务器目前没有在执行 BGSAVE 命令或者 BGREWRITEAOF 命令，并且哈希表的负载因子小于 0.1 时， 程序自动开始对哈希表执行收缩操作
* rehash执行过程
	- 为字典的 ht[1] 哈希表分配空间=ht[0].used= ht[0] 当前包含的键值对数量
		- 如果执行的是扩展操作， 那么 ht[1] 的大小为 为第一个大于等于ht[0].used * 2 的 2^n 
		- 如果执行的是收缩操作， 那么 ht[1] 的大小为为第一个大于等于 ht[0].used的 2^n 
	- 将保存在 ht[0] 中的所有键值对 rehash 到 ht[1] 上面： rehash 指的是重新计算键的哈希值和索引值， 然后将键值对放置到 ht[1] 哈希表的指定位置上。
	- 当 ht[0] 包含的所有键值对都迁移到了 ht[1] 之后 （ht[0] 变为空表）， 释放 ht[0] ， 将 ht[1] 设置为 ht[0] ， 并在 ht[1] 新创建一个空白哈希表， 为下一次 rehash 做准备。

### 渐进式Rehash
* rehash执行条件等同于Rehash
* 在渐进式 rehash 执行期间， 新添加到字典的键值对一律会被保存到 ht[1] 里面， 而 ht[0] 则不再进行任何添加操作： 这一措施保证了 ht[0] 包含的键值对数量会只减不增， 并随着 rehash 操作的执行而最终变成空表。
* rehash执行过程
	- 为 ht[1] 分配空间， 让字典同时持有 ht[0] 和 ht[1] 两个哈希表。
	- 在字典中维护一个索引计数器变量rehashidx,并将它设置为0，表示rehash工作正式开始
	- 在rehash进行期间，每次对字段执行添加、删除、查找、更新操作的时候，程序除了执行指定的操作意外，还会顺带将 ht[0] 哈希表在 rehashidx 索引上的所有键值对 rehash 到 ht[1] ， 当 rehash 工作完成之后， 程序将 rehashidx 属性的值++
	- 随着字典操作的不断执行， 最终在某个时间点上， ht[0] 的所有键值对都会被 rehash 至 ht[1] ， 这时程序将 rehashidx 属性的值设为 -1 ， 表示 rehash 操作已完成。

### 定时辅助rehash
* 虽然redis实现了在读写操作时，辅助服务器进行渐进式rehash操作，但是如果服务器比较空闲，redis数据库将很长时间内都一直使用两个哈希表。所以在redis周期函数中，如果发现有字典正在进行渐进式rehash操作，则会花费1毫秒的时间，帮助一起进行渐进式rehash操作。

* 配置 activerehashing yes
* 源码位置redis.c->databasesCron->server.activerehashing->incrementallyRehash


### 遇到的问题
* 渐进式rehash避免了redis阻塞，可以说非常完美，但是由于在rehash时，需要分配一个新的hash表，在rehash期间，同时有两个hash表在使用，会使得redis内存使用量瞬间突增，在Redis 满容状态下由于Rehash会导致大量Key驱逐。
* [美团案例和解决方案](https://tech.meituan.com/2018/07/27/redis-rehash-practice-optimization.html)

### 参考文章
* https://luoming1224.github.io/2018/11/12/%5Bredis%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0%5Dredis%E6%B8%90%E8%BF%9B%E5%BC%8Frehash%E6%9C%BA%E5%88%B6/
* https://tech.meituan.com/2018/07/27/redis-rehash-practice-optimization.html

	
	
	
	
	
	