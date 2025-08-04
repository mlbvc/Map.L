import * as Res from '../../../ResRoot'
import {
  gImagePath
} from '../../../CodeRoot'
import Animation from './Animation'
export default class MapMarkerIcon{
  /**
   * 构造方法
   * @param {[mapboxgl]} [mapboxgl]     高德地图对象
   * @param {Number} [state]   标记类型
   * @param {[Object]} [config] 标记配置
   */
  constructor(mapboxgl, image ,config={}, id=0, imageType='location'){
    this.mapboxgl = mapboxgl
    this.image = image
    this.config = config
    this.id = id
    this.marker_id = 'iconMarker_' + id
    this._imageType = imageType
    this._markerIcon = null
    this._imageState = '01'
    this.iconSize = config.defaultIconSize || 14
    this.isHide = false
    this.centerStyle = ""
    this.animation = new Animation()
    this.init()
  }
  /**
   * 初始化标记，加入地图中
   */
  init(){
    if (!this.mapboxgl || !this.config){
      console.log("初始化标记失败！")
      return
    }
    
    this.setImage(this.image)
    let position = this.config.position
    
    // 修复：使用divIcon创建自定义图标标记，不显示默认图标
    let customIcon = window.L.divIcon({
      html: '', // 初始为空，后续通过setImage设置
      className: 'custom-icon-marker',
      iconSize: [this.iconSize, this.iconSize],
      iconAnchor: [this.iconSize/2, this.iconSize/2]
    })
    
    this._markerIcon = new window.L.marker(position || [0, 0], {
      icon: customIcon
    })
    console.log('this._markerIcon', this._markerIcon)
    this._markerIcon.addTo(this.mapboxgl)
  }
  /**
   * 设置中心点位置
   */
  setPosition(lat, lng){
    let lnglat = new window.L.latLng(lat, lng)
    this._markerIcon.setLatLng(lnglat)
  }
  /**
   * Leaflet兼容方法：设置位置
   */
  setLatLng(latlng){
    if (Array.isArray(latlng)) {
      this._markerIcon.setLatLng(latlng)
    } else {
      this._markerIcon.setLatLng([latlng.lat, latlng.lng])
    }
  }
  /**
   * 获取位置
   */
  getPosition(){
    return this._markerIcon.getLatLng()
  }
  /**
   * 设置移动
   */
  moveTo(target, duration){
    this.animation.markerMoveTo(this._markerIcon, target, duration)
  }
  /**
   * 设置移动数组
   */
   moveAlong(path, duration){
     this.animation.markerMoveAlong(this._markerIcon, path, duration)
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
   * 设置标记点内容
   */
  setContent(data = {}){
    this.setImage(data.image)
    this.setSize(data.size)
    let content = this.config.content || ""
    this._setElement(content)
  }
  /**
   * 设置选中追踪标记点的样式
   */
  setCenter(isCenter){
    let centerStyle = ""
    if(isCenter){
      let radius = this.iconSize / 2 + 12
      centerStyle += "border-radius:" + radius + "px;"
      centerStyle += "position:absolute;top:-2px;bottom:-2px;right:-2px;left:-2px; border:medium solid #333;"
    }
    this.centerStyle = centerStyle
    let content = this.config.content || ""
    this._setElement(content)
  }
  /**
   * 设置标记点图片
   */
  setImage(img){
    if(img === undefined || img === null){
      return
    }
    this.image = this._getImage(img)
  }
  /**
   * 设置标记点大小
   */
  setSize(size){
    if(isNaN(size) || size === undefined || size === null){
      return
    }
    this.iconSize = size
  }
  /**
   * 设置偏移量
   */
  setOffset(x = 0, y = 0){
    let px = Number(x)
    let py = Number(y)
    let pixel = [px, py]
    console.log('MapMarkerIcon-setOffset', pixel)
    this._markerIcon.setOffset(pixel)
  }
  /**
   * 设置层级
   */
  setzIndex(zIndex){
    if(isNaN(zIndex) || zIndex === undefined || zIndex === null){
      console.warn('MapMarkerIcon-setzIndex, 参数错误')
      return
    }
    this.config.zIndex = zIndex
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.style.zIndex = zIndex
    }
  }
  /**
   * 设置鼠标样式
   */
  setCursor(cursor){
    if(!cursor){
      console.warn('MapMarkerIcon-setCursor, 参数错误')
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
   * 获取标记对象
   */
  getRoot(){
    return this._markerIcon
  }
  /**
   * 显示标记点
   */
  show(){
    this.isHide = false
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.style.display = ""
    }
  }
  /**
   * 隐藏标记点
   */
  hide(){
    this.isHide = true
    let el = document.querySelector('#' + this.marker_id)
    if(el){
      el.style.display = "none"
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
    this._markerIcon.remove(this.mapboxgl)
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
        let content = this.config.content || ""
        this._setElement(content)
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
   * 获取标记点图片
   */
  _getImage(img){
    let image = ''
    if(img && this._imageType === 'location'){
      image = Res[img + '_' + this._imageState]
    }
    else if(img && this._imageType === 'web'){
      image = gImagePath(img) + "?x-oss-process=image/resize,m_fill,h_256,w_256,limit_1/format,png/circle,r_128"
    }
    return image
  }
  /**
   * 设置圆点标记Html内容
   */
  _setElement(content){
    let el = document.querySelector('#' + this.marker_id)

    let iconSize = this.iconSize || 14
    let centerStyle = this.centerStyle || ""
    let image = this.image || ""

    content = content.replace(/markerIconSize/g, iconSize)
    content = content.replace(/markerBorderRadius/g, iconSize / 2)
    content = content.replace(/centerStyle/g, centerStyle)
    content = content.replace(/markerIcon/g, image)

    if(el){
      el.innerHTML = content
    }
  }
}
