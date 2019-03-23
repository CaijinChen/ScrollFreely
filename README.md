# ScrollFreely is available Now.
## ScrollFreely是一个使用原生JS实现的能够帮助你实现自定义滚动条的小项目
---
### 使用

1. 在你的项目中引入scrollfrelly.js
2. 把你的需要使用滚动条的内容“打包”在一个节点内，并给这个节点设置一个id属性，然后仿造下面的代码使用即可

```
let sf；window.onload = ()=>{sf = new ScrollFreely("content")}
```

3. ScrollFreely对象还有第二个参数，可以给滚动条更多的设置

```
//带参数的使用方式
let sf；window.onload = ()=>{
  sf = new ScrollFreely("content"，{
    containerWidth: ...,
    containerHeight: ...,
    ...
  })
}
```

|属性值|含义|默认值|
|:-:|:-|:-|
|containerWidth|设置容器宽度，默认是浏览器可视范围的宽度|"100vw"|
|containerHeight|设置容器高度，默认是浏览器可视范围的高度|"100vh"|
|containerStyle|如果你需要设置容器的其他样式，在这里传一个样式类名称即可|""|
|scrollX|设置x方向上是否需要滚动条|true|
|scrollY|设置y方向上是否需要滚动条|true|
|foregroundColor|设置scrollbar在不同时刻的颜色，它是一个对象，hover、normal、down分别对应鼠标悬停、默认、鼠标拖动滚动条时的颜色|{hover: "#666", normal: "#d0d0d0", down: "orange"}|
|backgroundColor|设置滚动条轨道的颜色|"#f1f5f8"|
|needRadius|设置是否需要圆角|true|
|width|设置滚动条的宽（垂直滚动条）或高（水平滚动条）|10|
|showTrack|设置是否显示滚动条的轨道|false|
|needTransition|设置是否需要在样式变化时添加渐变|true|

### 如果你喜欢这个项目，麻烦点个赞，这个项目使用WTFPL授权，就是说你可以对这个项目为所欲为 ：）
