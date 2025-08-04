import Animation from './Animation'
export default class MapCircleMarker{
  /**
   * 构造方法
   * @param {[mapboxgl]} mapboxgl     高德地图对象
   * @param {[Object]} config 圆点标记配置
   * @param {Number} [id=0]   圆点标记ID
   */
  constructor(mapboxgl, config, id = 0){
    this.mapboxgl = mapboxgl
    this.config = config
    this.id = id
    this.marker_id = 'circleMarker_' + id
    this._circleMarker = null
    this.circleMarkerSize = config.defaultIconSize || 14
    this.isHide = false
    this.centerStyle = ""
    this.animation = new Animation()
    this.init()
  }
  /**
   * 初始化圆点标记，加入地图中
   */
  init(){
    if (!this.mapboxgl || !this.config){
      console.log("初始化圆点标记失败！")
      return
    }
    
    let position = this.config.position
    console.log('MapCircleMarker init position:', position, this.config)
    
    // 修复：确保HTML内容在初始化时就设置
    let content = this.config.content || ""
    let color = this.config.color || '#FF0000'
    let circleMarkerSize = this.circleMarkerSize || 14
    let centerStyle = this.centerStyle || ""

    // 处理HTML模板
    content = content.replace(/circleMarkerSize/g, circleMarkerSize)
    content = content.replace(/circleBorderRadius/g, circleMarkerSize / 2)
    content = content.replace(/circleMarkerColor/g, color)
    content = content.replace(/centerStyle/g, centerStyle)
    
    console.log('MapCircleMarker init - 处理后的content:', content)
    this.htmlContent = content
    
    this._circleMarker = new window.L.marker(position || [0, 0], {
      icon: window.L.divIcon({
        html: content,
        className: 'custom-circle-marker',
        iconSize: [circleMarkerSize, circleMarkerSize],
        iconAnchor: [circleMarkerSize/2, circleMarkerSize/2]
      })
    })
    this._circleMarker.addTo(this.mapboxgl)
  }
  /**
   * 设置位置
   */
  setPosition(lat, lng){
    let lnglat = new window.L.LatLng(lat, lng)
    this._circleMarker.setLatLng(lnglat)
  }
  /**
   * 获取位置
   */
  getPosition(){
    return this._circleMarker.getLatLng()
  }
  /**
   * 设置移动
   */
  moveTo(target, duration){
    console.log('MapCircleMarker moveTo调用', target, duration)
    this.animation.markerMoveTo(this._circleMarker, target, duration)
  }
  /**
   * 设置移动数组
   */
  moveAlong(path, duration){
    this.animation.markerMoveAlong(this._circleMarker, path, duration)
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
   * 设置圆点内容
   */
  setContent(data = {}){
    this.setColor(data.color)
    this.setSize(data.size)
    let content = this.config.content || ""
    this._setElement(content)
    // 更新图标
    this._updateIcon()
  }
  /**
   * 设置选中追踪标记点的样式
   */
  setCenter(isCenter){
    let centerStyle = ""
    if(isCenter){
      let radius = this.circleMarkerSize / 2 + 12
      centerStyle += "border-radius:" + radius + "px;"
      centerStyle += "position:absolute;top:-2px;bottom:-2px;right:-2px;left:-2px; border:medium solid #333;"
    }
    this.centerStyle = centerStyle
    let content = this.config.content || ""
    this._setElement(content)
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
   * 设置圆点大小
   */
  setSize(size){
    if(isNaN(size) || size === undefined || size === null){
      return
    }
    this.circleMarkerSize = size
  }
  /**
   * 设置偏移
   */
  setOffset(x = 0, y = 0){
    let px = Number(x)
    let py = Number(y)
    let pixel = [px, py]
    this._circleMarker.setOffset(pixel)
  }
  /**
   * 设置点标记的叠加顺序
   */
  setzIndex(zIndex){
    if(isNaN(zIndex) || zIndex === undefined || zIndex === null){
      console.warn('MapCircleMarker-setzIndex, 参数错误')
      return
    }
    this.config.zIndex = zIndex
    // 修复：不再查询DOM元素，直接设置配置
    // let el = document.querySelector('#' + this.marker_id)
    // if(el){
    //   el.style.zIndex = zIndex
    // }
  }
  /**
   * 设置鼠标样式
   */
  setCursor(cursor){
    if(!cursor){
      console.warn('MapCircleMarker-setCursor, 参数错误')
      return
    }
    // 修复：不再查询DOM元素，Leaflet会自动处理
    // let el = document.querySelector('#' + this.marker_id)
    // if(el){
    //   el.style.cursor = cursor
    // }
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
   */
  getID(){
    return this.id
  }
  /**
   * 获取是否隐藏标记点
   */
  getIsHide(){
    return this.isHide
  }
  /**
   * 获取圆点标记对象
   */
  getRoot(){
    return this._circleMarker
  }
  /**
   * 显示标记点
   */
  show(){
    this.isHide = false
    // 修复：使用Leaflet的显示方法
    if(this._circleMarker){
      this._circleMarker.addTo(this.mapboxgl)
    }
  }
  /**
   * 隐藏标记点
   */
  hide(){
    this.isHide = true
    // 修复：使用Leaflet的隐藏方法
    if(this._circleMarker){
      this._circleMarker.remove()
    }
  }
  /**
   * 给标记添加点击事件
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
    this._circleMarker.remove(this.mapboxgl)
  }
  /**
   * 设置圆点标记Html内容
   */
  _setElement(content){
    // 修复：正确处理HTML模板变量替换
    let color = this.config.color || '#FF0000' // 默认红色
    let circleMarkerSize = this.circleMarkerSize || 14
    let centerStyle = this.centerStyle || ""

    console.log('_setElement 原始content:', content)
    console.log('_setElement 参数:', { color, circleMarkerSize, centerStyle })

    content = content.replace(/circleMarkerSize/g, circleMarkerSize)
    content = content.replace(/circleBorderRadius/g, circleMarkerSize / 2)
    content = content.replace(/circleMarkerColor/g, color)
    content = content.replace(/centerStyle/g, centerStyle)

    console.log('_setElement 处理后content:', content)
    this.htmlContent = content
  }
  
  /**
   * 更新图标
   */
  _updateIcon(){
    if (this._circleMarker && this.htmlContent) {
      let customIcon = window.L.divIcon({
        html: this.htmlContent,
        className: 'custom-circle-marker',
        iconSize: [this.circleMarkerSize || 14, this.circleMarkerSize || 14],
        iconAnchor: [(this.circleMarkerSize || 14)/2, (this.circleMarkerSize || 14)/2]
      })
      this._circleMarker.setIcon(customIcon)
    } else {
      console.warn('_updateIcon 失败:', { 
        hasMarker: !!this._circleMarker, 
        hasContent: !!this.htmlContent 
      })
    }
  }
}
