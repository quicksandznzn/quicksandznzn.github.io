---
title: "Redis 数据类型"
date: "2021-07-21"
description: "Redis 数据类型 参考Redis3.2源码"
tags: ["2021"]
categories: ["缓存"]
keywords: ["Redis","Redis数据结构","Redis数据类型"]
---

### 数据类型及使用场景
* [String：缓存、计数器、分布式锁等](#string)
* [List：链表、队列、微博关注人时间轴列表等](#list)
* [Hash： 用户信息、Hash 表等](#hash)
* [Set： 去重、赞、踩、共同好友等](#set)
* [Sorted Set： 访问量排行榜、点击量排行榜等](#sorted-set)

### Redis Object
```C
typedef struct redisObject {
    unsigned type:4; // 类型
    unsigned encoding:4; // 一个对象可能包含多个encoding
    unsigned lru:LRU_BITS; /* lru time (relative to server.lruclock) */
    int refcount; // 引用计数 实现内存回收机制
    void *ptr; // 存储的值
} robj;

/* Object types */
#define OBJ_STRING 0
#define OBJ_LIST 1
#define OBJ_SET 2
#define OBJ_ZSET 3
#define OBJ_HASH 4

/* Objects encoding. Some kind of objects like Strings and Hashes can be
 * internally represented in multiple ways. The 'encoding' field of the object
 * is set to one of this fields for this object. */
#define OBJ_ENCODING_RAW 0     /* Raw representation */ 简单动态字符串
#define OBJ_ENCODING_INT 1     /* Encoded as integer */ 整数类型 实际上是long
#define OBJ_ENCODING_HT 2      /* Encoded as hash table */ 字典 hashtable
#define OBJ_ENCODING_ZIPMAP 3  /* Encoded as zipmap */ 是个旧的表示方式，已不再用
#define OBJ_ENCODING_LINKEDLIST 4 /* Encoded as regular linked list */ 是个旧的表示方式，已不再用
#define OBJ_ENCODING_ZIPLIST 5 /* Encoded as ziplist */ 压缩列表
#define OBJ_ENCODING_INTSET 6  /* Encoded as intset */ 整数集合
#define OBJ_ENCODING_SKIPLIST 7  /* Encoded as skiplist */ 跳跃表
#define OBJ_ENCODING_EMBSTR 8  /* Embedded sds string encoding */ embstr编码的简单动态字符串
#define OBJ_ENCODING_QUICKLIST 9 /* Encoded as linked list of ziplists */ quicklist 双向ziplist
```

### String  
简单动态字符串 sds (sds替代C char*)   
* sds的好处:  
    - 可动态扩展内存。sds表示的字符串其内容可以修改，也可以追加
    - 二进制安全（Binary Safe）。sds能存储任意二进制数据，而不仅仅是可打印字符
    - 与传统的C语言字符串类型兼容

* 内部OBJ ENCODING:
    - OBJ_ENCODING_RAW 最原生的表示方式。其实只有string类型才会用这个encoding值（表示成sds）
    - OBJ_ENCODING_INT 表示成数字。实际用long表示
    - OBJ_ENCODING_EMBSTR  表示成一种特殊的嵌入式的sds

* set命令:
    - 源码object.c中的tryObjectEncoding
    - 第1步检查，检查type。确保只对string类型的对象进行操作。
    - 第2步检查，检查encoding。sdsEncodedObject是定义在server.h中的一个宏，确保只对OBJ_ENCODING_RAW和OBJ_ENCODING_EMBSTR编码的string对象进行操作。这两种编码的string都采用sds来存储，可以尝试进一步编码处理
    - 第3步检查，检查refcount。引用计数大于1的共享对象，在多处被引用。由于编码过程结束后robj的对象指针可能会变化（我们在前一篇介绍sdscatlen函数的时候提到过类似这种接口使用模式），这样对于引用计数大于1的对象，就需要更新所有地方的引用，这不容易做到。因此，对于计数大于1的对象不做编码处理
        - 第一种情况：如果Redis的配置不要求运行LRU替换算法，且转成的long型数字的值又比较小（小于OBJ_SHARED_INTEGERS，在目前的实现中这个值是10000），那么会使用共享数字对象来表示。之所以这里的判断跟LRU有关，是因为LRU算法要求每个robj有不同的lru字段值，所以用了LRU就不能共享robj。shared.integers是一个长度为10000的数组，里面预存了10000个小的数字对象。这些小数字对象都是encoding = OBJ_ENCODING_INT的string robj对象。
        - 第二种情况：如果前一步不能使用共享小对象来表示，那么将原来的robj编码成encoding = OBJ_ENCODING_INT，这时ptr字段直接存成这个long型的值。注意ptr字段本来是一个void *指针（即存储的是内存地址），因此在64位机器上有64位宽度，正好能存储一个64位的long型值。这样，除了robj本身之外，它就不再需要额外的内存空间来存储字符串值。
    - 试图将字符串转成64位的long。64位的long所能表达的数据范围是-2^63到2^63-1，用十进制表达出来最长是20位数（包括负号），string2l如果将字符串转成long转成功了，那么会返回1并且将转好的long存到value变量里
    - 如果字符串长度足够小（小于等于OBJ_ENCODING_EMBSTR_SIZE_LIMIT，定义为44），那么调用createEmbeddedStringObject编码成encoding = OBJ_ENCODING_EMBSTR  
    - 如果前面所有的编码尝试都没有成功（仍然是OBJ_ENCODING_RAW），且sds里空余字节过多，那么做最后一次努力，调用sds的sdsRemoveFreeSpace接口来释放空余字节

* get命令
    - object.c中的getDecodedObject
    - 编码为OBJ_ENCODING_RAW和OBJ_ENCODING_EMBSTR的字符串robj对象，不做变化，原封不动返回。站在使用者的角度，这两种编码没有什么区别，内部都是封装的sds。
    - 编码为数字的字符串robj对象，将long重新转为十进制字符串的形式，然后调用createStringObject转为sds的表示。注意：这里由long转成的sds字符串长度肯定不超过20，而根据createStringObject的实现，它们肯定会被编码成OBJ_ENCODING_EMBSTR的对象

### List
quicklist（是一个ziplist的双向链表）
* 内部OBJ ENCODING:
    - OBJ_ENCODING_QUICKLIST 
* 关键参数 
    - list-max-ziplist-size
        - 正值 
            - 当这个参数配置成5的时候，表示每个quicklist节点的ziplist最多包含5个数据项
        - 负值
            - -5: 每个quicklist节点上的ziplist大小不能超过64 Kb。（注：1kb => 1024 bytes）
            - -4: 每个quicklist节点上的ziplist大小不能超过32 Kb。
            - -3: 每个quicklist节点上的ziplist大小不能超过16 Kb。
            - -2: 每个quicklist节点上的ziplist大小不能超过8 Kb。（-2是Redis给出的默认值）
            - -4: -1: 每个quicklist节点上的ziplist大小不能超过4 Kb。
    - list-compress-depth
        - 0: 是个特殊值，表示都不压缩。这是Redis的默认值。
        - 1: 表示quicklist两端各有1个节点不压缩，中间的节点压缩。
        - 2: 表示quicklist两端各有2个节点不压缩，中间的节点压缩。
        - 依此类推…
* 压缩算法
    - 采用的LZF无损压缩算法 quicklist.h 
    ```C
       typedef struct quicklistLZF {
           unsigned int sz; /* LZF size in bytes*/
           char compressed[];
       } quicklistLZF; 
    ```
    
### Hash
压缩列表+哈希表
* 内部OBJ ENCODING:
    - OBJ_ENCODING_HT
    - OBJ_ENCODING_ZIPLIST
* hash的底层存储有两种数据结构，一种是ziplist，另外一种是hashtable，hash对象只有同时满足以下条件，才会采用ziplist编码：
    - 当列表元素小于hash_max_ziplist_entries:512
    - 当列表元素的值都小于hash_max_ziplist_value:64字节

### Set
哈希表+整数数组
* 内部OBJ ENCODING:
    - OBJ_ENCODING_HT
    - OBJ_ENCODING_INTSET 
* set的底层存储有两种数据结构，intset，另外一种是hashtable，set对象只有同时满足以下条件，才会采用intset编码：
    - 当集合元素小于set_max_intset_entries:512
    - 当集合元素都是数字 isObjectRepresentableAsLongLong
* intset是有序的 里面都是数字类型  hashtable 的key是字符串类型对象 value是null

### Sorted Set
压缩列表+跳表（跳表+字典）
* 内部OBJ ENCODING:
    - OBJ_ENCODING_ZIPLIST
    - OBJ_ENCODING_SKIPLIST
* 当集合元素大于zset_max_ziplist_entries（默认128） 或者 当集合元素值大于zset_max_ziplist_value（默认64字节）转换为跳表   可以相互转换
* skiplist 编码的 Zset 底层为一个被称为 zset 的结构体，这个结构体中包含一个字典和一个跳跃表
  跳跃表按 score 从小到大保存所有集合元素，查找时间复杂度为平均 O(logN)，最坏 O(N) 。字典则保存着从 member 到 score 的映射，这样就可以用 O(1) 的复杂度来查找 member 对应的 score 值。虽然同时使用两种结构，但它们会通过指针来共享相同元素的 member 和 score，因此不会浪费额外的内存。

### Redis参考文章
* https://marticles.github.io/2018/12/25/Redis%E7%9F%A5%E8%AF%86%E7%82%B9%E6%80%BB%E7%BB%93/ 
* https://github.com/menwenjun/redis_source_annotation
* https://github.com/redis/redis


