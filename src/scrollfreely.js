;(function(doc, win){
    "use strict"
    if(!doc || !win){
        console.error("ScrollFreely needs to be run under browser environment.")
        return
    }
    //文档被加载完成时，开始初始化
    win.addEventListener('load', ()=>{
        console.log("hello sf");
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

    let ScrollFreely = win.ScrollFreely = function(content, options){
        //滚动条设置选项
        options = options || {}
        options.foregroundColor = options.foregroundColor || {}
        this.options = {
            scrollX: options.scrollX || options.scroll || true,
            scrollY: options.scrollY || options.scroll || true,
            foregroundColor: {
                hover: options.foregroundColor.hover || "#666",
                normal: options.foregroundColor.normal || "#d0d0d0",
                down: options.foregroundColor.down || "orange"
            },
            backgroundColor: options.backgroundColor || "#f1f5f8",
            needRadius: options.needRadius || true,
            //定义容器的宽高
            containerWidth: options.containerWidth || "100vw",
            containerHeight: options.containerHeight || "100vh",
            //自定义容器内的样式，可以设置背景色、背景图片等
            containerStyle: options.containerStyle || "",
            //滚动条的宽（垂直滚动条）或高（水平滚动条）
            width: parseInt(options.width) || 10,
            //定义是否显示滚动条的轨道
            showTrack: options.showTrack || false,
            //是否需要在样式变化时添加渐变
            needTransition: options.needTransition || true
        }
        this.bars = [null, null]
        this.validBars = [false, false]
        this.container = null
        this.body = null
        this.event = new Event()
        this.speed = 0
        this.tempData = 0
        this.isScrolling = false
        this.isHorizontal = false
        this.event.on("bodyChange", this.refresh.bind(this))
        this.find(content)
        this.init()
    }

    Object.assign(ScrollFreely.prototype, {
        //获取内容块，内容块是需要被滚动条包装的节点
        find: function(inner){
            if(!inner){
                console.error("no content is specified.")
            }else{
                let content = doc.getElementById(inner)
                if(!content){
                    console.error("content you specified is not exists")
                }else{
                    let temp = content.nextSibling
                    let parent = content.parentElement
                    let fragment = document.createDocumentFragment()

                    this.body = doc.createElement("div")
                    this.container = doc.createElement('div')
                    this.body.style.cssText = "position:absolute;top:0;left:0;"
                    this.container.style.cssText = "overflow:hidden;position:relative"
                        + ";width:" + this.options.containerWidth
                        + ";height:" + this.options.containerHeight
                    if(this.options.containerStyle){
                        this.body.classList.add(this.options.containerStyle)
                    }

                    this.body.appendChild(document.adoptNode(content))
                    this.container.appendChild(this.body)
                    fragment.appendChild(this.container)
                    if(temp){
                        parent.insertBefore(fragment, temp)
                    }else{
                        parent.appendChild(fragment)
                    }
                }
            }
        },
        //初始化，创建样式，创建导航条等等
        init: function(){
            this.createBar()
            this.refresh()
            this.bindDrag()
            this.bindWheel()
            this.checkBodyChange()
        },
        //创建滚动条
        createBar: function(){
            //根据选项初始化
            if(this.options.scrollX){
                let valid = doc.createElement("div")
                let bk = doc.createElement('div')
                let bar = doc.createElement('div')
                valid.style.cssText = "position:absolute;bottom:0;left:0"
                    + ";height:" + this.options.width + "px"
                bk.style.cssText = "background-color:" + this.options.backgroundColor
                    + ";height:" + this.options.width + "px"
                    + ";width:100%;position:absolute;left:0;bottom:0;"
                !this.options.showTrack && (bk.style.backgroundColor = "transparent")
                bar.style.cssText = "background-color:" + this.options.foregroundColor.normal
                    + ";height:" + this.options.width + "px"
                    + ";position:absolute;bottom:0;left:0;"
                if(this.options.needTransition){
                    bar.style.transition = "background-color 0.2s ease-in-out"
                }
                if(this.options.needRadius){
                    bk.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                    bar.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                }
                bk.appendChild(bar)
                valid.appendChild(bk)
                this.container.appendChild(valid)
                this.bars[0] = bar
            }
            if(this.options.scrollY){
                let valid = doc.createElement("div")
                let bk = doc.createElement('div')
                let bar = doc.createElement('div')
                valid.style.cssText = "position:absolute;top:0;right:0"
                    + ";width:" + this.options.width + "px"
                bk.style.cssText = "background-color:" + this.options.backgroundColor
                    + ";width:" + this.options.width + "px"
                    + ";height:100%;position:absolute;top:0;right:0;"
                !this.options.showTrack && (bk.style.backgroundColor = "transparent")
                bar.style.cssText = "background-color:" + this.options.foregroundColor.normal
                    + ";width:" + this.options.width + "px"
                    + ";position:absolute;top:0;right:0;"
                if(this.options.needTransition){
                    bar.style.transition = "background-color 0.2s ease-in-out"
                }
                if(this.options.needRadius){
                    bk.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                    bar.style.borderRadius = Math.floor(this.options.width / 2) + "px"
                }
                bk.appendChild(bar)
                valid.appendChild(bk)
                this.container.appendChild(valid)
                this.bars[1] = bar
            }
        },
        refreshBar: function(){
            if(this.options.scrollY && this.contentHeight() > this.height()){
                this.bars[1].parentElement.parentElement.style.display = "block"
                this.validBars[1] = true
            }else{
                this.bars[1].parentElement.parentElement.style.display = "none"
                this.validBars[1] = false
            }
            if(this.options.scrollX && this.contentWidth() > this.width()){
                this.bars[0].parentElement.parentElement.style.display = "block"
                this.validBars[0] = true
            }else{
                this.bars[0].parentElement.parentElement.style.display = "none"
                this.validBars[0] = false
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
                    this.event.emit("bodyChange")
                }
                setTimeout(()=>{
                    check(newContentWidth, newContentHeight, newWidth, newHeight)
                }, 500)
            }).bind(this)
            check(this.contentWidth(), this.contentHeight(), this.width(), this.height())
        },
        //鼠标滚轮事件
        bindWheel: function(){
            let _this = this
            this.container.addEventListener("wheel", function(event){
                event = event || window.event
                _this.isHorizontal = _this.validBars[0] && _this.validBars[1] ? Math.abs(event.wheelDeltaX) > Math.abs(event.wheelDeltaY) :
                                     _this.validBars[0]
                if(_this.isHorizontal){
                    _this.isScrolling = true
                    _this.speed = event.wheelDeltaX
                    _this.movement()
                }else{
                    _this.isScrolling = true
                    _this.speed = event.wheelDeltaY
                    _this.movement()
                }
            })
        },
        //计算动画
        compute: function(pos){
            let _this = this
            _this.speed = Math.round(pos - _this.tempData)
            _this.tempData = pos
            if(_this.speed === 0){
                return
            }
            _this.movement()
        },
        //鼠标拖动事件
        bindDrag: function(){
            let _this = this
            let mouseMove = function(event){
                event = event || window.event
                _this.compute.bind(_this)(_this.isHorizontal ? event.clientX : event.clientY)
            }
            let mouseUp = function(){
                _this.isScrolling  = false
                let bar = _this.isHorizontal ? _this.bars[0] : _this.bars[1]
                let parent = bar.parentElement.parentElement
                bar.style.backgroundColor = _this.options.foregroundColor.normal
                if(_this.isHorizontal){
                    parent.style.height = _this.options.width + 'px'
                }else{
                    parent.style.width = _this.options.width + 'px'
                }
                parent.removeEventListener("mousemove", mouseMove)
                parent.removeEventListener("mouseup", mouseUp)
                parent.removeEventListener("mouseleave", mouseUp)
            }
            let mouseDown = function(event){
                event = event || window.event
                let bar = event.target
                let parent = bar.parentElement.parentElement
                _this.isScrolling = true
                bar.style.backgroundColor = _this.options.foregroundColor.down
                _this.isHorizontal = bar === _this.bars[0]
                _this.tempData = _this.isHorizontal ? event.clientX : event.clientY
                if(_this.isHorizontal){
                    parent.style.height = _this.height() + 'px'
                }else{
                    parent.style.width = _this.width() + 'px'
                }
                parent.addEventListener("mousemove", mouseMove)
                parent.addEventListener("mouseup", mouseUp)
                parent.addEventListener("mouseleave", mouseUp)
            }
            for (let i = 0; i < 2; i++) {
                _this.bars[i].addEventListener('mouseout', (event)=>{
                    event = event || window.event
                    let target = event.target
                    if(!_this.isScrolling){
                        target.style.backgroundColor = _this.options.foregroundColor.normal
                    }
                    _this.bars[i].removeEventListener('mousedown', mouseDown)
                })
                _this.bars[i].addEventListener('mouseover', (event)=>{
                    event = event || window.event
                    let target = event.target
                    if(!_this.isScrolling){
                        target.style.backgroundColor = _this.options.foregroundColor.hover
                    }
                    _this.bars[i].addEventListener('mousedown', mouseDown)
                })
            }
        },
        //操作滚动条的运动
        movement: function(){
            let _this = this
            let target = 0
            if(_this.isHorizontal){
                let length = _this.barWidth.apply(_this.bars[0])
                target = _this.barLeft.apply(_this.bars[0]) + _this.speed
                if(target < 0){
                    target = 0
                }else if(target > _this.width() - length){
                    target = _this.width() - length
                }
            }else{
                let length = _this.barHeight.apply(_this.bars[1])
                target = _this.barTop.apply(_this.bars[1]) + _this.speed
                if(target < 0){
                    target = 0
                }else if(target > _this.height() - length){
                    target = _this.height() - length
                }
            }
            let func = _this.isHorizontal ? _this.barLeft.bind(_this.bars[0]) : _this.barTop.bind(_this.bars[1])
            func(target, _this)
        },
        //容器宽高变化时更新滚动条的长度
        refresh: function(){
            this.isScrolling = false
            this.isHorizontal = false
            this.speed = 0
            this.refreshBar()
            if(this.validBars[0]){
                this.bars[0].style.width = Math.floor(this.width() ** 2/this.contentWidth()) + 'px'
                this.bars[0].parentElement.parentElement.style.width = this.width() + 'px'
            }
            if(this.validBars[1]){
                this.bars[1].style.height = Math.floor(this.height() ** 2/this.contentHeight()) + 'px'
                this.bars[1].parentElement.parentElement.style.height = this.height() + 'px'
            }
        },
        //获取或设置容器的宽
        width: function(val){
            if(typeof val !== "undefined"){
                this.container.style.width = parseInt(val) + 'px'
            }else{
                if(this.validBars[1]){
                    return this.container.clientWidth - this.options.width
                }else{
                    return this.container.clientWidth
                }
            }
        },
        //获取或设置容器的高
        height: function(val){
            if(typeof val !== "undefined"){
                this.container.style.height = parseInt(val) + 'px'
            }else{
                if(this.validBars[0]){
                    return this.container.clientHeight - this.options.width
                }else{
                    return this.container.clientHeight
                }
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
                let value = Math.ceil(parseInt(val) * (_this.contentHeight()) / _this.height())
                if(value > _this.contentHeight() - _this.height()){
                    value = _this.contentHeight() - _this.height()
                }else if(value < 0){
                    value = 0
                }
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
                let value = Math.ceil(parseInt(val) * (_this.contentWidth()) / _this.width())
                if(value > _this.contentWidth() - _this.width()){
                    value = _this.contentWidth() - _this.width()
                }else if(value < 0){
                    value = 0
                }
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