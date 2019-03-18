;(function(doc, win){
    "use strict"
    //dev utils
    let log = console.log

    if(!doc || !win){
        console.error("ScrollFreely needs to be run under browser environment.")
        return
    }
    //文档被加载完成时，开始初始化
    win.addEventListener('load', ()=>{
        log("hello sf");
    })

    class Event{

        constructor(){}

        on(event, callback){
            if(!this.hasEvent(event)){
                this[event] = []
            }
            for(let handler of this[event]){
                if(handler === callback){
                    return
                }
            }
            this[event].push(callback)
        }

        emit(event, ...args){
            if(!this.hasEvent(event)){
                return
            }
            this[event].forEach((callback)=>{
                callback(args)
            })
        }

        remove(event, callback){
            if(this.hasEvent(event)){
                if(typeof callback === "function"){
                    for(let i = 0; i < this[event].length; i++){
                        if(this[event][i] === callback){
                            this[event].splice(i, 1)
                            return
                        }
                    }
                }else{
                    delete this[event]
                }
            }
        }

        hasEvent(event){
            return !(typeof this[event] === "undefined")
        }
    }

    let ScrollFreely = win.ScrollFreely = function(container, options){
        //滚动条设置选项
        options = options || {}
        options.foregroundColor = options.foregroundColor || {}
        this.options = {
            scrollX: options.scrollX || options.scroll || true,
            scrollY: options.scrollY || options.scroll || true,
            foregroundColor: {
                hover: options.foregroundColor.hover || "red",
                normal: options.foregroundColor.normal || "#efefef",
                down: options.foregroundColor.down || "yellow"
            },
            backgroundColor: options.backgroundColor || "#757575",
            needRadius: options.needRadius || true,
            //定义容器的宽高
            containerWidth: options.containerWidth || "100%",
            containerHeight: options.containerHeight || "100vh",
            //自定义容器内的样式，可以设置背景色、背景图片等
            containerStyle: options.containerStyle || "",
            //滚动条的宽（垂直滚动条）或高（水平滚动条）
            width: parseInt(options.width) || 20,
            //动画的更新频率
            frequency: options.frequency || 10,
            //事件的监听间隔时间
            interval: options.interval || 60,
            //滚动条只有滚动的时候会出现，停止滚动后会逐渐消失
            showOnScroll: options.showOnScroll || false,
            //滚动条的背景只有在获取焦点时才会出现
            showOnFocus: options.showOnFocus || false,
            //是否需要在样式变化时添加渐变
            needTransition: options.needTransition || true
        }
        this.bars = [null, null]
        this.container = null
        this.body = this.find(container)
        this.event = new Event()
        this.speed = 0
        this.isScrolling = false
        this.isHorizontal = false
        this.targetPos = 0
        this.tempData = 0
        this.event.on("bodyChange", this.refresh.bind(this))
        this.init()
    }

    Object.assign(ScrollFreely.prototype, {
        //获取内容块，内容块是需要被滚动条包装的节点
        find: function(inner){
            let body = null;
            if(!inner){
                console.error("no content is specified.")
            }else{
                let content = doc.querySelector(inner)
                if(!content){
                    console.error("content you specified is not exists")
                }else{
                    body = doc.createElement("div")
                    this.container = doc.createElement('div')
                    content.parentElement.replaceChild(this.container, content)
                    body.appendChild(content)
                    this.container.appendChild(body)
                    body.style.cssText = "position:absolute;top:0;left:0;"
                    this.container.style.cssText = "overflow:hidden;position:relative"
                        + ";width:" + this.options.containerWidth
                        + ";height:" + this.options.containerHeight
                    if(this.options.containerStyle){
                        this.body.classList.add(this.options.containerStyle)
                    }
                }
            }
            return body
        },
        //初始化，创建样式，创建导航条等等
        init: function(){
            this.refresh()
            this.checkBodyChange()
            this.bindWheel()
            this.bindDrag()
        },
        //创建滚动条
        refreshBar: function(){
            //根据选项初始化
            if(!this.bars[0] && this.options.scrollX && this.contentWidth() > this.width()){
                let bk = doc.createElement('div')
                let bar = doc.createElement('div')
                bk.style.cssText = "background-color:" + this.options.backgroundColor
                    + ";height:" + this.options.width + "px"
                    + ";width:100%;position:absolute;left:0;bottom:0;"
                bar.style.cssText = "background-color:" + this.options.foregroundColor.normal
                    + ";height:" + this.options.width + "px"
                    + ";position:absolute;bottom:0;left:0;"
                if(this.options.needTransition){
                    bar.style.transition = "background-color 0.3s ease-in-out"
                }
                if(this.options.needRadius){
                    bk.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                    bar.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                }
                bk.appendChild(bar)
                this.container.appendChild(bk)
                this.bars[0] = bar
            }else if(this.bars[0]){
                if(this.contentWidth() > this.width()){
                    this.bars[0].parentElement.style.display = "block"
                }else{
                    this.bars[0].parentElement.style.display = "none"
                }
            }
            if(!this.bars[1] && this.options.scrollY && this.contentHeight() > this.height()){
                let bk = doc.createElement('div')
                let bar = doc.createElement('div')
                bk.style.cssText = "background-color:" + this.options.backgroundColor
                    + ";width:" + this.options.width + "px"
                    + ";height:100%;position:absolute;top:0;right:0;"
                bar.style.cssText = "background-color:" + this.options.foregroundColor.normal
                    + ";width:" + this.options.width + "px"
                    + ";position:absolute;top:0;right:0;"
                if(this.options.needTransition){
                    bar.style.transition = "background-color 0.3s ease-in-out"
                }
                if(this.options.needRadius){
                    bk.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                    bar.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                }
                bk.appendChild(bar)
                this.container.appendChild(bk)
                this.bars[1] = bar
            }else if(this.bars[1]){
                if(this.contentHeight() > this.height()){
                    this.bars[1].parentElement.style.display = "block"
                }else{
                    this.bars[1].parentElement.style.display = "none"
                }
            }
        },
        //定时检测容器的宽高是否有变化或者内容区域宽高是否有变化，如果有变化需要触发"bodyChange"事件，并调用refresh函数
        checkBodyChange: function(){
            let check = (function(contentWidth, contentHeight, width, height){
                let newContentWidth = this.contentWidth()
                let newContentHeight = this.contentHeight()
                let newWidth = this.width()
                let newHeight = this.height()
                if(width !== newWidth ||
                    height !== newHeight ||
                    contentWidth !== newContentWidth ||
                    contentHeight !== newContentHeight){
                    log("bodyChange")
                    this.event.emit("bodyChange")
                }
                setTimeout(()=>{
                    check(contentWidth, contentHeight, width, height)
                }, 500)
            }).bind(this)
            check(this.contentWidth(), this.contentHeight(), this.width(), this.height())
        },
        //鼠标滚轮事件
        bindWheel: function(){
            for(let i = 0; i < 2; i++){
                let bar = this.bars[0]
                if(bar){
                    bar.addEventListener('wheel', function(){

                    })
                }
            }
        },
        //鼠标拖动事件
        bindDrag: function(){
            let _this = this
            let ff = function(pos){
                _this.speed = Math.round(pos - _this.tempData)
                _this.tempData = pos
                if(_this.speed === 0){
                    return
                }
                let target = 0
                if(_this.isHorizontal){
                    target = _this.barLeft.apply(_this.bars[0]) + _this.speed
                    if(target < 0){
                        target = 0
                    }else if(target > _this.width() - _this.barWidth.apply(_this.bars[0])){
                        target = _this.width() - _this.barWidth.apply(_this.bars[0])
                    }
                }else{
                    target = _this.barTop.apply(_this.bars[1]) + _this.speed
                    if(target < 0){
                        target = 0
                    }else if(target > _this.height() - _this.barHeight.apply(_this.bars[1])){
                        target = _this.height() - _this.barHeight.apply(_this.bars[1])
                    }
                }
                _this.targetPos = target
                _this.movement()
            }
            let mouseMove = function(event){
                event = event || window.event
                log("mousemove")
                ff(_this.isHorizontal ? event.clientX : event.clientY)
            }
            let mouseUp = function(){
                _this.isScrolling  = false
                let bar = _this.isHorizontal ? _this.bars[0] : _this.bars[1]
                bar.style.backgroundColor = _this.options.foregroundColor.normal
                log("mouseup")
                _this.container.removeEventListener("mouseup", mouseUp)
                _this.container.removeEventListener("mousemove", mouseMove)
            }
            let f = function(event){
                event = event || window.event
                let bar = event.target
                _this.isScrolling = true
                bar.style.backgroundColor = _this.options.foregroundColor.down
                _this.isHorizontal = bar === _this.bars[0]
                _this.tempData = _this.isHorizontal ? event.clientX : event.clientY
                log("mousedown")
                _this.container.addEventListener("mousemove", mouseMove)
                _this.container.addEventListener("mouseup", mouseUp)
            }
            _this.container.addEventListener('mouseout', (event)=>{
                event = event || window.event
                let target = event.target
                if(target !== _this.bars[0] && event.target !== _this.bars[1])
                    return
                log("mouseout")
                if(!_this.isScrolling){
                    target.style.backgroundColor = _this.options.foregroundColor.normal
                }
                _this.container.removeEventListener('mousedown', f)
            })
            _this.container.addEventListener('mouseover', (event)=>{
                event = event || window.event
                let target = event.target
                if(target !== _this.bars[0] && event.target !== _this.bars[1])
                    return
                log("mouseover")
                if(!_this.isScrolling){
                    target.style.backgroundColor = _this.options.foregroundColor.hover
                }
                _this.container.addEventListener('mousedown', f)
            })
        },
        //操作滚动条的运动
        movement: function(){
            let _this = this
            let func = _this.isHorizontal ? _this.barLeft.bind(_this.bars[0]) : _this.barTop.bind(_this.bars[1])
            let next = func() + _this.speed
            if(_this.speed > 0 && next >= _this.targetPos){
                next = _this.targetPos
                _this.speed = 0
            }else if (_this.speed < 0 && next <= _this.targetPos) {
                next = _this.targetPos
                _this.speed = 0
            }
            func(next, _this)
        },
        //容器宽高变化时更新滚动条的长度
        refresh: function(){
            this.isScrolling = false
            this.isHorizontal = false
            this.targetPos = 0
            this.speed = 0
            this.refreshBar()
            for(let i = 0; i < 2; i++){
                if(this.bars[i] && i === 0){
                    this.bars[i].style.width = Math.floor(this.width() ** 2/this.contentWidth()) + 'px'
                }else if(this.bars[i]){
                    this.bars[i].style.height = Math.floor(this.height() ** 2/this.contentHeight()) + 'px'
                }
            }
        },
        //获取或设置容器的宽
        width: function(val){
            if(typeof val !== "undefined"){
                this.container.style.width = parseInt(val) + 'px'
            }else{
                return this.container.clientWidth
            }
        },
        //获取或设置容器的高
        height: function(val){
            if(typeof val !== "undefined"){
                this.container.style.height = parseInt(val) + 'px'
            }else{
                return this.container.clientHeight
            }
        },
        //获取或设置内容区域的top属性
        top: function(val){
            if(typeof val !== "undefined"){
                this.body.style.top = -parseInt(val) + "px"
            }else{
                return -parseInt(this.body.style.top)
            }
        },
        //获取或设置内容区域的left属性
        left: function(val){
            if(typeof val !== "undefined"){
                this.body.style.left = -parseInt(val) + "px"
            }else{
                return -parseInt(this.body.style.left)
            }
        },
        //获取或设置滚动条的top属性
        barTop: function(val, _this){
            if(typeof val !== "undefined" && _this){
                this.style.top = parseInt(val) + "px"
                let top = _this.top.bind(_this)
                let value = 0
                if(_this.bars[0] !== null){
                    value = Math.ceil(parseInt(val) * (_this.contentHeight() - _this.options.width) / _this.height())
                    if(value > _this.contentHeight() - _this.height() - _this.options.width)
                        value = _this.contentHeight() - _this.height() - _this.options.width
                }else{
                    value = Math.ceil(parseInt(val) * _this.contentHeight() / _this.height())
                    if(value > _this.contentHeight() - _this.height())
                        value = _this.contentHeight() - _this.height()
                }
                if(value < 0) value = 0
                top(value)
            }else{
                return parseInt(this.style.top)
            }
        },
        //获取或设置滚动条的left属性
        barLeft: function(val, _this){
            if(typeof val !== "undefined" && _this){
                this.style.left = parseInt(val) + "px"
                let left = _this.left.bind(_this)
                let value = 0
                if(_this.bars[1] !== null){
                    value = Math.ceil(parseInt(val) * (_this.contentWidth() - _this.options.width) / _this.width())
                    if(value > _this.contentHeight() - _this.width() - _this.options.width)
                        value = _this.contentHeight() - _this.width() - _this.options.width
                }else{
                    value = Math.ceil(parseInt(val) * _this.contentHeight() / _this.width())
                    if(value > _this.contentWidth() - _this.width())
                        value = _this.contentWidth() - _this.width()
                }
                if(value < 0) value = 0
                left(value)
            }else{
                return parseInt(this.style.left)
            }
        },
        barWidth: function(){
            return parseInt(this.style.width)
        },
        barHeight: function(){
            return parseInt(this.style.height)
        },
        //获取容器的内容宽度
        contentWidth: function(){
            return this.body.offsetWidth;
        },
        //获取容器的内容高度
        contentHeight: function(){
            return this.body.offsetHeight;
        }
    })

}(document, window));