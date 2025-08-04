import * as Res from '../../../ResRoot'
import {
  gImagePath
} from '../../../CodeRoot'
export default class MapMarkerIcon{
  /**
   * 构造方法
   * @param {[AMap]} [aMap]     高德地图对象
   * @param {Number} [state]   标记类型
   * @param {[Object]} [config] 标记配置
   */
  constructor(aMap, image ,config={}, imageType='location'){
    this.aMap = aMap
    this.image = image
    this.config = config
    this._markerIcon = null
    this._imageState = '01'
    this._imageType = imageType
    this.iconSize = config.defaultIconSize || 14
    this.isHide = false
    this.centerStyle = ""
    this.opacity = 1
    this.init()
  }
  /**
   * 初始化标记，加入地图中
   */
  init(){
    if (!this.aMap){
      console.log("初始化标记失败！")
      return
    }
    let image = this.getImage(this.image)
    this.image = image
    this._markerIcon = new window.AMap.Marker({
      ...this.config,
      clickable: true, //点标记是否可点击
    })
    this.aMap.add(this._markerIcon)
  }
  /**
   * 获取标记点图片
   */
  getImage(img){
    let image = ''
    if(this._imageType === 'location'){
      image = Res[img + '_' + this._imageState]
    }
    else if(this._imageType === 'web'){
      image = gImagePath(img) + "?x-oss-process=image/resize,m_fill,h_256,w_256,limit_1/format,png/circle,r_128"
    }
    return image
  }
  /**
   * 设置标记点图片
   */
  setImage(img){
    this.image = this.getImage(img)
  }
  /**
   * 设置偏移量
   */
  setOffset(){
    let x = Number(this.iconSize / 2)
    let y = Number(this.iconSize / 2)
    let pixel = new window.AMap.Pixel(-x, -y)
    this._markerIcon.setOffset(pixel)
  }
  /**
   * 设置中心点位置
   * @param {[type]} lng 经度
   * @param {[type]} lat 纬度
   */
  setPosition(lng, lat){
    let lngLat = new window.AMap.LngLat(lng, lat)
    this._markerIcon.setPosition(lngLat)
  }
  /**
   * 获取位置
   * @return {[LngLat]} [位置]
   */
  getPosition(){
    return this._markerIcon.getPosition()
  }
  /**
   * 设置标记点内容
   */
  setContent(config = this.config){
    let content = this._getContent()
    this._markerIcon.setContent(content)
  }
  /**
   * 设置选中追踪标记点的样式
   * @param {Boolean} isCenter [是否选中]
   */
  setCenterIcon(isCenter){
    let centerStyle = ""
    if(isCenter){
      let radius = this.iconSize / 2 + 12
      centerStyle += "border-radius:" + radius + "px;"
      centerStyle += "position:absolute;top:-2px;bottom:-2px;right:-2px;left:-2px; border:medium solid #333;"
    }
    this.centerStyle = centerStyle
    this.setContent()
  }
  /**
   * 设置标记点大小
   */
  setIconSize(value){
    this.iconSize = value
  }
  /**
   * 设置层级
   */
  setzIndex(number){
    this._markerIcon.setzIndex(number)
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
   * 设置移动
   * @param {[type]} lng 经度
   * @param {[type]} lat 纬度
   * @param {[number]} speed 速度 km/h
   */
  moveTo(lng, lat, speed){
    let lngLat = new window.AMap.LngLat(lng, lat)
    this._markerIcon.moveTo(lngLat, speed)
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
    this._markerIcon.moveAlong(arr, speed)
  }
  /**
   * 停止播放动画
   */
  stopMove(){
    this._markerIcon.stopMove()
  }
  /**
   * 更新标志点图片，报警图标闪烁效果
   */
  updateMarkerIcon(image){
    if(this._imageType === 'location'){
      this._removeTimer()
      this.timer = setInterval(()=>{
        if(this._imageState === '01'){
          this._imageState = '02'
        }else if(this._imageState === '02'){
          this._imageState = '01'
        }
        let icon = Res[image + '_' + this._imageState]
        this.image = icon
        this.setContent()
      },150)
    }
  }
  /**
   * 删除定时器
   */
  _removeTimer(){
    if (this.timer){
      clearInterval(this.timer)
      this.timer = null
    }
  }
  /**
   * 获取标记对象
   * @return {[MapMarkerIcon]} [标记]
   */
  getRoot(){
    return this._markerIcon
  }
  /**
   * 显示标记点
   */
  show(){
    this.isHide = false
    this._markerIcon.show()
  }
  /**
   * 隐藏标记点
   */
  hide(){
    this.isHide = true
    this._markerIcon.hide()
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
    let content = this.config.content || ""
    let iconSize = this.iconSize || 14
    let centerStyle = this.centerStyle || ""
    let image = this.image || ""
    let opacity = this.opacity
    content = content.replace(/markerIconSize/g, iconSize)
    content = content.replace(/markerBorderRadius/g, iconSize / 2)
    content = content.replace(/centerStyle/g, centerStyle)
    content = content.replace(/markerIcon/g, image)
    content = content.replace(/opacityValue/g, opacity)
    content = content.replace(/opacityFilter/g, opacity * 100)
    return content
  }
  /**
   * 设置鼠标样式
   * @param {[string]} cursor [鼠标样式]
   */
  setCursor(cursor){
    this._markerIcon.setCursor(cursor)
  }
  /**
   * 设置透明度
   */
  setOpacity(opacity){
    if (isNaN(opacity)){
      console.warn('setOpacity, 参数错误')
      return
    }
    this.opacity = opacity
  }
}
