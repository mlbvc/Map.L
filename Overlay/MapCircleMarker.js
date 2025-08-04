export default class MapCircleMarker{
  /**
   * 构造方法
   * @param {[AMap]} aMap     高德地图对象
   * @param {[Object]} config 圆点标记配置
   * @param {Number} [id=0]   圆点标记ID
   */
  constructor(aMap, config, id = 0){
    this.aMap = aMap
    this.config = config
    this.id = id
    this._circleMarker = null
    this.circleMarkerSize = config.defaultIconSize || 14
    this.isHide = false
    this.centerStyle = ""
    this.opacity = 1
    this.init()
  }
  /**
   * 初始化圆点标记，加入地图中
   */
  init(){
    if (!this.aMap || !this.config){
      console.log("初始化圆点标记失败！")
      return
    }
    this._circleMarker = new window.AMap.Marker(this.config)
    this.aMap.add(this._circleMarker)
  }
  /**
   * 设置点标记的叠加顺序
   */
  setzIndex(zIndex){
    this._circleMarker.setzIndex(zIndex)
  }
  /**
   * 设置位置
   * @param {[type]} lng 经度
   * @param {[type]} lat 纬度
   */
  setPosition(lng, lat){
    let lngLat = new window.AMap.LngLat(lng, lat)
    this._circleMarker.setPosition(lngLat)
  }
  /**
   * 获取位置
   * @return {[LngLat]} [位置]
   */
  getPosition(){
    return this._circleMarker.getPosition()
  }
  /**
   * 设置偏移
   */
  setOffset(){
    let px = -Number(this.circleMarkerSize / 2)
    let py = -Number(this.circleMarkerSize / 2)
    let pixel = new window.AMap.Pixel(px, py)
    this._circleMarker.setOffset(pixel)
  }
  /**
   * 设置移动
   * @param {[type]} lng 经度
   * @param {[type]} lat 纬度
   * @param {[number]} speed 速度 km/h
   */
  moveTo(lng, lat, speed){
    let lngLat = new window.AMap.LngLat(lng, lat)
    this._circleMarker.moveTo(lngLat, speed)
  }
  /**
   * 设置移动数组
   * @param  {[Array]} arr   [经纬度对象数组]
   * @param {[number]} speed 速度 km/h
   */
  moveAlong(arr, speed){
    if (!arr || arr.length <=0){
      return
    }
    this._circleMarker.moveAlong(arr, speed)
  }
  /**
   * 停止播放动画
   */
  stopMove(){
    this._circleMarker.stopMove()
  }
  /**
   * 设置圆点内容
   */
  setContent(config = this.config){
    this.config.color = config.color
    let content = this._getContent()
    this._circleMarker.setContent(content)
  }
  /**
   * 设置选中追踪标记点的样式
   * @param {Boolean} isCenter [是否选中]
   */
  setCenterCircle(isCenter){
    let centerStyle = ""
    if(isCenter){
      let radius = this.circleMarkerSize / 2 + 12
      centerStyle += "border-radius:" + radius + "px;"
      centerStyle += "position:absolute;top:-2px;bottom:-2px;right:-2px;left:-2px; border:medium solid #333;"
    }
    this.centerStyle = centerStyle
    this.setContent()
  }
  /**
   * 设置圆点大小
   */
  setCircleMarkerSize(size){
    this.circleMarkerSize = size
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
   * 获取圆点标记对象
   * @return {[CircleMarker]} [圆点标记]
   */
  getRoot(){
    return this._circleMarker
  }
  /**
   * 显示标记点
   */
  show(){
    this.isHide = false
    this._circleMarker.show()
  }
  /**
   * 隐藏标记点
   */
  hide(){
    this.isHide = true
    this._circleMarker.hide()
  }
  /**
   * 获取是否隐藏标记点
   */
  getIsHide(){
    return this.isHide
  }
  /**
   * 获取地图标记使用的配置
   * @return {[type]} [description]
   */
  _getContent(){
    let color = this.config.color || '#000'
    let content = this.config.content || ""
    let circleMarkerSize = this.circleMarkerSize || 14
    let centerStyle = this.centerStyle || ""
    let opacity = this.opacity
    content = content.replace(/circleMarkerSize/g, circleMarkerSize)
    content = content.replace(/circleBorderRadius/g, circleMarkerSize / 2)
    content = content.replace(/circleMarkerColor/g, color)
    content = content.replace(/centerStyle/g, centerStyle)
    content = content.replace(/opacityValue/g, opacity)
    content = content.replace(/opacityFilter/g, opacity * 100)
    return content
  }
  /**
   * 设置鼠标样式
   * @param {[string]} cursor [鼠标样式]
   */
  setCursor(cursor){
    this._circleMarker.setCursor(cursor)
  }
  /**
   * 设置圆点透明度
   */
  setOpacity(opacity){
    if (isNaN(opacity)){
      console.warn('setOpacity, 参数错误')
      return
    }
    this.opacity = opacity
  }
}
