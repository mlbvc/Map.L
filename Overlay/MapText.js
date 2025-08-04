import Animation from './Animation'
export default class MapText{
  /**
   * 构造方法
   * @param {[mapboxgl]} mapboxgl     高德地图对象
   * @param {[Object]} config 文本标记配置
   * @param {Number} [id=0]   文本标记ID
   */
  constructor(mapboxgl, config, id = 0){
    this.mapboxgl = mapboxgl
    this.config = config
    this.id = id
    this.marker_id = 'text_' + id
    this._text = null
    this.textSize = 13
    this.imgWidth = 20
    this.imgHeight = 13
    this.textString = ''
    this.flag = ''
    this.isHide = false
    this.opacity = 1
    this.selectedTextTitle = "" // 气泡文本标记标题
    this.selectedTextTime = ""  // 气泡文本标记定位时间
    this.selectedTextLngLat = "" // 气泡文本标记位置
    this.animation = new Animation()
    this.init()
  }
  /**
   * 初始化圆点标记，加入地图中
   */
  init(){
    console.log(this.mapboxgl, this.config)
    if (!this.mapboxgl || !this.config){
      console.log("初始化文本标记失败！")
      return
    }
    
    let position = this.config.position
    
    // 修复：使用divIcon创建透明的文本标记，不显示默认图标
    let customIcon = window.L.divIcon({
      html: '', // 初始为空，后续通过setContent设置
      className: 'custom-text-marker',
      iconSize: [0, 0], // 初始大小为0
      iconAnchor: [0, 0]
    })
    
    this._text = new window.L.marker(position || [0, 0], {
      icon: customIcon
    })
    this._text.addTo(this.mapboxgl)
  }

  /**
   * 设置位置
   */
  setPosition(lat, lng){
    let lnglat = new window.L.LatLng(lat, lng)
    this._text.setLatLng(lnglat)
  }
  /**
   * Leaflet兼容方法：设置位置
   */
  setLatLng(latlng){
    if (Array.isArray(latlng)) {
      this._text.setLatLng(latlng)
    } else {
      this._text.setLatLng([latlng.lat, latlng.lng])
    }
  }
  /**
   * 获取位置
   */
  getPosition(){
    return this._text.getLatLng()
  }
  /**
   * 设置移动
   */
   moveTo(target, duration){
     console.log('MapText moveTo调用', target, duration)
     this.animation.markerMoveTo(this._text, target, duration)
   }
  /**
   * 设置移动数组
   */
   moveAlong(path, duration){
     this.animation.markerMoveAlong(this._text, path, duration)
   }
  /**
   * 停止播放动画
   */
   stopMove(){
     this.animation.markerStop()
   }
   /**
    * 添加两点移动结束监听回调
    */
   addListenerMoveend(callback){
     this.animation.initMoveendCallback(callback)
   }
   /**
    * 添加两点移动中监听回调
    */
   addListenerMoving(callback){
     this.animation.initMovingCallback(callback)
   }
   /**
    * 添加线段移动结束监听回调
    */
   addListenerMovealong(callback){
     this.animation.initMovealongCallback(callback)
   }
  /**
   * 设置文本标记点
   */
  setContent(data = {}){
    this.setText(data.text)
    this.setColor(data.color)
    this.setFlag(data.flag)
    this.setOpacity(data.opacity)
    this.setSize(data.size)
    let content = this.config.content || ""
    this._setElement(content)
  }
  /**
   * 设置气泡文本标记点
   */
  setSelectedContent(data = {}){
    this.setSelectedText({
      title: data.title || "",
      time: data.time || "",
      lnglat: data.lnglat || ""
    })
    let content = this.config.selectedContent || ""
    this._setElement(content)
  }
  /**
   * 设置文本内容
   */
  setText(string){
    if(string === undefined || string === null){
      return
    }
    this.textString = string
  }
  /**
   * 设置气泡文本内容
   */
  setSelectedText(data){
    if (!data){
      console.warn('MapText-setSelectedText, 参数错误')
      return
    }
    this.selectedTextTitle = data.title
    this.selectedTextTime = data.time
    this.selectedTextLngLat = data.lnglat
  }
  /**
   * 设置文本颜色
   */
  setColor(color){
    if(color === undefined || color === null){
      return
    }
    this.config.color = color
  }
  /**
   * 设置国旗
   */
  setFlag(flag){
    if(flag === undefined || flag === null){
      return
    }
    this.flag = flag
  }
  /**
   * 设置透明度
   */
  setOpacity(opacity){
    if(isNaN(opacity) || opacity === undefined || opacity === null){
      return
    }
    this.opacity = opacity
  }
  /**
   * 设置文本大小
   */
  setSize(size){
    if(isNaN(size) || size === undefined || size === null){
      return
    }
    this.textSize = size
    this.imgWidth = size * 3 / 2
    this.imgHeight = size
  }
  /**
   * 设置偏移
   */
  setOffset(x = 5, y = -20){
    let px = Number(x)
    let py = Number(y)
    let pixel = [px, py]
    console.log('this._text', this._text)
    this._text.setZIndexOffset(pixel)
  }
  /**
   * 设置点标记的叠加顺序
   */
  setzIndex(zIndex){
    if(isNaN(zIndex) || zIndex === undefined || zIndex === null){
      console.warn('MapText-setzIndex, 参数错误')
      return
    }
    this.config.zIndex = zIndex
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.style.zIndex = zIndex
    }
  }
  /**
   * 设置旋转角度
   */
  setAngle(number){
    if(isNaN(number) || number === undefined || number === null){
      console.warn('MapText-setAngle, 参数错误')
      return
    }
    this._text.setRotation(number)
  }
  /**
   * 设置鼠标样式
   */
  setCursor(cursor){
    if(!cursor){
      console.warn('MapText-setCursor, 参数错误')
      return
    }
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.style.cursor = cursor
    }
  }
  /**
   * 设置报警类型
   */
  setAlarmType(state){
    this.alarmType = state
  }
  /**
   * 获取报警类型
   */
  getAlarmType(){
    return this.alarmType
  }
  /**
   * 返回ID
   * @return {[String]} [ID]
   */
  getID(){
    return this.id
  }
  /**
   * 获取旋转角度
   */
  getAngle(){
    return this._text.getRotation()
  }
  /**
   * 获取显示文本
   */
  getTextString(){
    return this.textString
  }
  /**
   * 获取是否隐藏标记点
   */
  getIsHide(){
    return this.isHide
  }
  /**
   * 获取文本对象
   */
  getRoot(){
    return this._text
  }
  /**
   * 显示文本
   */
  show(){
    this.isHide = false
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.style.display = ""
    }
  }
  /**
   * 隐藏文本
   */
  hide(){
    this.isHide = true
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.style.display = "none"
    }
  }
  /**
   * 给文本标记添加点击事件
   */
  click(callback){
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.onclick = callback
    }
  }
  /**
   * 移除文本标记
   */
  remove(){
    // let el = document.querySelector('#' + this.marker_id)
    // if(el){
    //   el.parentNode.removeChild(el)
    // }
    this._text.remove(this.mapboxgl)
  }
  /**
   * 设置文本Html内容
   */
  _setElement(content){
    let el = document.querySelector('#' + this.marker_id)

    let text = this.textString || ''
    let textSize = this.textSize || 13
    let color = this.config.color || '#000'
    let flag = this.flag || ''
    let isShowFlag = this.flag? 'inline-block' : 'none'
    let imgWidth = this.imgWidth || 20
    let imgHeight = this.imgHeight || 13

    let title = this.selectedTextTitle || ''
    let time = this.selectedTextTime || ''
    let lnglat = this.selectedTextLngLat || ''

    let opacity = this.options

    content = content.replace(/content/g, text)
    content = content.replace(/textSize/g, textSize)
    content = content.replace(/textcolor/g, color)
    content = content.replace(/flag/g, flag)
    content = content.replace(/isShow/g, isShowFlag)
    content = content.replace(/imgWidth/g, imgWidth)
    content = content.replace(/imgHeight/g, imgHeight)

    content = content.replace(/selectedTitle/g, title)
    content = content.replace(/selectedTime/g, time)
    content = content.replace(/selectedLngLat/g, lnglat)

    content = content.replace(/opacityValue/g, opacity)
    content = content.replace(/opacityFilter/g, opacity * 100)

    if(el){
      el.innerHTML = content
    }
  }
}
