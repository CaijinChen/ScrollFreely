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



    let ScrollFreely = win.ScrollFreely = function(content, options){
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
            width: parseInt(options.width) || 50,
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
        this.body = null
        this.event = new Event()
        this.speed = 0
        this.isScrolling = false
        this.isHorizontal = false
        this.targetPos = 0
        this.tempData = 0
        this.find(content)
        this.init()
        this.event.on("bodyChange", this.refresh.bind(this))
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
                    this.body.style.cssText = "position:absolute;top:0;left:0;width:0;"
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
            this.refresh()
            this.bindDrag()
            this.bindWheel()
            this.checkBodyChange()
        },
        //创建滚动条
        refreshBar: function(){
            //根据选项初始化
            if(!this.bars[0] && this.options.scrollX && this.contentWidth() > this.width()){
                let valid = doc.createElement("div")
                let bk = doc.createElement('div')
                let bar = doc.createElement('div')
                valid.style.cssText = "width:100%;position:absolute;bottom:0;left:0"
                    + ";height:" + (this.options.width + 100) + "px"
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
                valid.appendChild(bar)
                this.container.insertBefore(valid, this.body)
                this.bars[0] = bar
            }else if(this.bars[0]){
                if(this.contentWidth() > this.width()){
                    this.bars[0].parentElement.parentElement.style.display = "block"
                }else{
                    this.bars[0].parentElement.parentElement.style.display = "none"
                }
            }
            if(!this.bars[1] && this.options.scrollY && this.contentHeight() > this.height()){
                let valid = doc.createElement("div")
                let bk = doc.createElement('div')
                let bar = doc.createElement('div')
                valid.style.cssText = "height:100%;position:absolute;top:0;right:0"
                    + ";width:" + (this.options.width + 100) + "px"
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
                valid.appendChild(bk)
                this.container.insertBefore(valid, this.body)
                this.bars[1] = bar
            }else if(this.bars[1]){
                if(this.contentHeight() > this.height()){
                    this.bars[1].parentElement.parentElement.style.display = "block"
                }else{
                    this.bars[1].parentElement.parentElement.style.display = "none"
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
                let deltaX = event.wheelDeltaX
                let deltaY = event.wheelDeltaY
                if(deltaY !== 0){
                    _this.isHorizontal = false
                    _this.isScrolling = true
                    _this.speed = deltaY
                    _this.movement()
                }else if(deltaX !== 0){
                    _this.isHorizontal = true
                    _this.isScrolling = true
                    _this.speed = deltaX
                    _this.movement()
                }
            })
        },
        //计算动画的目的地
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
            log("container", this.container)
            let _this = this
            let mouseMove = function(event){
                log("mousemove")
                event = event || window.event
                let bar = _this.isHorizontal ? _this.bars[0] : _this.bars[1]
                let parent = bar.parentElement.parentElement
                parent.addEventListener("mouseleave", hotAreaMoveOut)
                parent.addEventListener("mouseenter", hotAreaMoveIn)
                _this.compute.bind(_this)(_this.isHorizontal ? event.clientX : event.clientY)
            }
            let mouseUp = function(){
                log("mouseup")
                _this.isScrolling  = false
                let bar = _this.isHorizontal ? _this.bars[0] : _this.bars[1]
                let parent = bar.parentElement.parentElement
                bar.style.backgroundColor = _this.options.foregroundColor.normal
                parent.removeEventListener("mousemove", mouseMove)
                parent.removeEventListener("mouseleave", hotAreaMoveOut)
                parent.removeEventListener("mouseenter", hotAreaMoveIn)
                parent.style.zIndex = "1"
                _this.container.removeEventListener("mouseup", mouseUp)
            }
            let mouseDown = function(event){
                log("mousedown")
                event = event || window.event
                let bar = event.target
                _this.isScrolling = true
                bar.style.backgroundColor = _this.options.foregroundColor.down
                _this.isHorizontal = bar === _this.bars[0]
                _this.tempData = _this.isHorizontal ? event.clientX : event.clientY
                bar.parentElement.parentElement.addEventListener("mousemove", mouseMove)
                bar.parentElement.parentElement.style.zIndex = "999"
                _this.container.addEventListener("mouseup", mouseUp)
            }
            let hotAreaMoveOut = function(){
                log("hotAreaMoveOut")
                let bar = _this.isHorizontal ? _this.bars[0] : _this.bars[1]
                _this.isScrolling = false
                if(_this.isHorizontal){
                    bar.style.left = "0"
                    _this.compute.bind(_this)(0)
                    _this.tempData = 0
                }else{
                    bar.style.top = "0"
                    _this.compute.bind(_this)(0)
                    _this.tempData = 0
                }
            }
            let hotAreaMoveIn = function(event){
                log("hotAreaMoveIn")
                event = event || window.event
                if(_this.isHorizontal){
                    _this.tempData = event.clientX
                }else{
                    _this.tempData = event.clientY
                }
            }
            for (let i = 0; i < 2; i++) {
                if(_this.bars[i]){
                    log(_this.bars[i])
                    _this.bars[i].addEventListener('mouseout', (event)=>{
                        log("mouseout")
                        event = event || window.event
                        let target = event.target
                        if(!_this.isScrolling){
                            target.style.backgroundColor = _this.options.foregroundColor.normal
                        }
                        _this.bars[i].removeEventListener('mousedown', mouseDown)
                    })
                    _this.bars[i].addEventListener('mouseover', (event)=>{
                        log("mouseover")
                        event = event || window.event
                        let target = event.target
                        if(!_this.isScrolling){
                            target.style.backgroundColor = _this.options.foregroundColor.hover
                        }
                        _this.bars[i].addEventListener('mousedown', mouseDown)
                    })
                }
            }
        },
        //操作滚动条的运动
        movement: function(){
            let _this = this
            let target = 0
            if(_this.isHorizontal){
                target = _this.barLeft.apply(_this.bars[0]) + _this.speed
                let width = _this.bars[1] ? _this.options.width : 0
                if(target < 0){
                    target = 0
                }else if(target > _this.width() - _this.barWidth.apply(_this.bars[0]) - width){
                    target = _this.width() - _this.barWidth.apply(_this.bars[0]) - width
                }
            }else{
                target = _this.barTop.apply(_this.bars[1]) + _this.speed
                let width = _this.bars[0] ? _this.options.width : 0
                if(target < 0){
                    target = 0
                }else if(target > _this.height() - _this.barHeight.apply(_this.bars[1]) - width){
                    target = _this.height() - _this.barHeight.apply(_this.bars[1]) - width
                }
            }
            _this.targetPos = target

            let func = _this.isHorizontal ? _this.barLeft.bind(_this.bars[0]) : _this.barTop.bind(_this.bars[1])
            let next = _this.targetPos
            func(next, _this)
            // if(_this.speed > 0 && next >= _this.targetPos){
            //     next = _this.targetPos
            //     _this.speed = 0
            // }else if (_this.speed < 0 && next <= _this.targetPos) {
            //     next = _this.targetPos
            //     _this.speed = 0
            // }
        },
        //容器宽高变化时更新滚动条的长度
        refresh: function(){
            log("refresh")
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