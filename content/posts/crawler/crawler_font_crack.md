---
title: "字体加密破解"
date: "2021-07-27"
description: "记录一次某二手车网站woff2字体加密破解，静态字体文件"
tags: ["2021"]
categories: ["爬虫"]
keywords: ["爬虫","字体加密破解","woff2"]
---

### 页面分析

![showcase](https://quicksandznzn.github.io/image/crawler_gua_zi_detail.png)

```html
<span class="gzfont" data-v-48736255>&#58928;&#59854;&#58397;&#60492;-&#59854;&#59246;</span>
```

* 可以看到以上的字体是有加密的 我们通过gzfont这个class去css中寻找

```css
.gzfont {
    font-family: gzfont
}

@font-face {
    font-family: "gzfont";
    src: url(https://example.woff2) format("woff");
    font-weight: 400;
    font-style: normal
}

```

### 字体文件解析

* 经过多次刷新发现css里面的字体文件是不会变的，我们只需要把字体文件解析出来匹配好对应关系即可
* [FontEditor在线浏览字体文件](https://kekee000.github.io/fonteditor/)

![showcase](https://quicksandznzn.github.io/image/crawler_gua_zi_detail_font.png)

* 通过python的TTFont把字体文件解析成XML
```python
from fontTools.ttLib import TTFont

font = TTFont('/Users/zn/Downloads/font.woff2')
font.saveXML('font.xml')
```

* 一个GlyphID里面的name对应一个TTGlyph对象，它是用来绘制一个字
<div style='white-space: pre !important; overflow-y: scroll !important; height: 50vh !important;'>

```xml
 <GlyphOrder>
    <!-- The 'id' attribute is only for humans; it is ignored when parsed. -->
    <GlyphID id="0" name=".notdef"/>
    <GlyphID id="1" name=".null"/>
    <GlyphID id="2" name="nonmarkingreturn"/>
    <GlyphID id="3" name="x"/>
    <GlyphID id="4" name="uniE1D0"/>
    <GlyphID id="5" name="uniE325"/>
    <GlyphID id="6" name="uniE41D"/>
    <GlyphID id="7" name="uniE4D9"/>
    <GlyphID id="8" name="uniE52E"/>
    <GlyphID id="9" name="uniE630"/>
    <GlyphID id="10" name="uniE76E"/>
    <GlyphID id="11" name="uniE891"/>
    <GlyphID id="12" name="uniE9CE"/>
    <GlyphID id="13" name="uniEAF2"/>
    <GlyphID id="14" name="uniEC4C"/>
    <GlyphID id="15" name="uniF7C2"/>
    <GlyphID id="16" name="uniF88A"/>
  </GlyphOrder>
  
  <TTGlyph name="uniEAF2" xMin="43" yMin="-40" xMax="523" yMax="716">
      <contour>
        <pt x="133" y="180" on="1"/>
        <pt x="148" y="103" on="0"/>
        <pt x="185" y="69" on="1"/>
        <pt x="221" y="38" on="0"/>
        <pt x="276" y="35" on="1"/>
        <pt x="326" y="35" on="0"/>
        <pt x="384" y="78" on="1"/>
        <pt x="427" y="123" on="0"/>
        <pt x="427" y="250" on="0"/>
        <pt x="387" y="290" on="1"/>
        <pt x="345" y="331" on="0"/>
        <pt x="284" y="331" on="1"/>
        <pt x="257" y="331" on="0"/>
        <pt x="220" y="321" on="1"/>
        <pt x="230" y="406" on="1"/>
        <pt x="236" y="400" on="0"/>
        <pt x="239" y="399" on="1"/>
        <pt x="254" y="399" on="0"/>
        <pt x="245" y="399" on="1"/>
        <pt x="303" y="411" on="0"/>
        <pt x="348" y="428" on="1"/>
        <pt x="394" y="459" on="0"/>
        <pt x="394" y="524" on="1"/>
        <pt x="395" y="579" on="0"/>
        <pt x="361" y="604" on="1"/>
        <pt x="330" y="635" on="0"/>
        <pt x="274" y="635" on="1"/>
        <pt x="222" y="635" on="0"/>
        <pt x="195" y="604" on="1"/>
        <pt x="153" y="572" on="0"/>
        <pt x="142" y="504" on="1"/>
        <pt x="52" y="520" on="1"/>
        <pt x="69" y="612" on="0"/>
        <pt x="127" y="660" on="1"/>
        <pt x="186" y="699" on="0"/>
        <pt x="272" y="716" on="1"/>
        <pt x="326" y="710" on="0"/>
        <pt x="383" y="683" on="1"/>
        <pt x="433" y="659" on="0"/>
        <pt x="487" y="569" on="0"/>
        <pt x="487" y="470" on="0"/>
        <pt x="462" y="432" on="1"/>
        <pt x="445" y="394" on="0"/>
        <pt x="371" y="371" on="1"/>
        <pt x="451" y="356" on="0"/>
        <pt x="487" y="309" on="1"/>
        <pt x="519" y="247" on="0"/>
        <pt x="523" y="190" on="1"/>
        <pt x="523" y="95" on="0"/>
        <pt x="383" y="-40" on="0"/>
        <pt x="276" y="-40" on="1"/>
        <pt x="179" y="-40" on="0"/>
        <pt x="116" y="18" on="1"/>
        <pt x="52" y="82" on="0"/>
        <pt x="43" y="155" on="1"/>
        <pt x="133" y="174" on="1"/>
      </contour>
      <instructions/>
    </TTGlyph>
```
</div>

* 读取CMAP code是16进制的数字 对应页面的数字值 name对应字体编码 
	- 可以得出 58928==0xe630==uniE630

```xml
<cmap_format_4 platformID="0" platEncID="3" language="0">
      <map code="0x78" name="x"/><!-- LATIN SMALL LETTER X -->
      <map code="0xe1d0" name="uniE1D0"/><!-- ???? -->
      <map code="0xe325" name="uniE325"/><!-- ???? -->
      <map code="0xe41d" name="uniE41D"/><!-- ???? -->
      <map code="0xe4d9" name="uniE4D9"/><!-- ???? -->
      <map code="0xe52e" name="uniE52E"/><!-- ???? -->
      <map code="0xe630" name="uniE630"/><!-- ???? -->
      <map code="0xe76e" name="uniE76E"/><!-- ???? -->
      <map code="0xe891" name="uniE891"/><!-- ???? -->
      <map code="0xe9ce" name="uniE9CE"/><!-- ???? -->
      <map code="0xeaf2" name="uniEAF2"/><!-- ???? -->
      <map code="0xec4c" name="uniEC4C"/><!-- ???? -->
      <map code="0xf7c2" name="uniF7C2"/><!-- ???? -->
      <map code="0xf88a" name="uniF88A"/><!-- ???? -->
    </cmap_format_4>
```
* 生成对应关系如下

```json
 [
            {'id': '&#57808;', 'uni': 'uniE1D0', 'num': '7'},
            {'id': '&#58149;', 'uni': 'uniE325', 'num': '4'},
            {'id': '&#58397;', 'uni': 'uniE41D', 'num': '1'},
            {'id': '&#58585;', 'uni': 'uniE4D9', 'num': ''},
            {'id': '&#58670;', 'uni': 'uniE52E', 'num': '9'},
            {'id': '&#58928;', 'uni': 'uniE630', 'num': '2'},
            {'id': '&#59246;', 'uni': 'uniE76E', 'num': '8'},
            {'id': '&#59537;', 'uni': 'uniE891', 'num': '5'},
            {'id': '&#59854;', 'uni': 'uniE9CE', 'num': '0'},
            {'id': '&#60146;', 'uni': 'uniEAF2', 'num': '3'},
            {'id': '&#60492;', 'uni': 'uniEC4C', 'num': '6'},
            {'id': '&#63426;', 'uni': 'uniF7C2', 'num': ''},
            {'id': '&#63626;', 'uni': 'uniF88A', 'num': '7'}
 ]
```