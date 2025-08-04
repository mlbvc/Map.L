export default class MapText{
  /**
   * 构造方法
   * @param {[AMap]} aMap     高德地图对象
   * @param {[Object]} config 文本标记配置
   * @param {Number} [id=0]   文本标记ID
   */
  constructor(aMap, config, id = 0){
    this.aMap = aMap
    this.config = config
    this.id = id
    this._text = null
    this.textSize = 13
    this.imgWidth = 20
    this.imgHeight = 13
    this.textString = ''
    this.flag = ''
    this.isHide = false
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
    console.log(this.config)
    this._text = new window.AMap.Marker(this.config)
    this.aMap.add(this._text)
  }

  /**
   * 设置位置
   * @param {[type]} lng 经度
   * @param {[type]} lat 纬度
   */
  setPosition(lng, lat){
    let lngLat = new window.AMap.LngLat(lng, lat)
    this._text.setPosition(lngLat)
  }
  /**
   * 获取位置
   * @return {[LngLat]} [位置]
   */
  getPosition(){
    console.log(this._text.getPosition())
    return this._text.getPosition()
  }
  /**
   * 设置移动
   * @param {[type]} lng 经度
   * @param {[type]} lat 纬度
   * @param {[number]} speed 速度 km/h
   */
  moveTo(lng, lat, speed){
    let lngLat = new window.AMap.LngLat(lng, lat)
    this._text.moveTo(lngLat, speed)
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
    this._text.moveAlong(arr, speed)
  }
  /**
   * 停止播放动画
   */
  stopMove(){
    this._text.stopMove()
  }
  /**
   * 设置文本内容
   */
  setText(string, config = this.config){
    this.config.color = config.color
    let content = this._getContent(string)
    this._text.setContent(content)
  }
  /**
   * 设置国旗
   */
  setFlag(img){
    this.flag = img
  }
  setSelectedText(data){
    if (!data){
      console.warn('setSelectedText, 参数错误')
      return
    }
    let content = this.config.selectedContent || ""
    content = content.replace(/content/g, data.content)
    content = content.replace(/battery/g, data.battery)
    content = content.replace(/locationTime/g, data.locationTime)
    content = content.replace(/lnglat/g, data.lnglat)
    content = content.replace(/updateTime/g, data.updateTime)
    content = content.replace(/signal/g, data.signal)
    content = content.replace(/sats/g, data.sats)
    content = content.replace(/temp/g, data.temp)
    content = content.replace(/act/g, data.act)
    this._text.setContent(content)
  }

  setHistorySelectedText(data){
    if (!data){
      console.warn('setHistorySelectedText, 参数错误')
      return
    }
    let content = this.config.historySelectedContent || ""
    content = content.replace(/content/g, data.content)
    content = content.replace(/locationTime/g, data.locationTime)
    content = content.replace(/lnglat/g, data.lnglat)
    this._text.setContent(content)
  }

  /**
   * 设置透明度
   */
  setOpacity(string, opacity){
    if (isNaN(opacity)){
      console.warn('setOpacity, 参数错误')
      return
    }
    let content = this._getContent(string)
    content = content.replace(/opacityValue/g, opacity)
    content = content.replace(/opacityFilter/g, opacity * 100)
    this._text.setContent(content)
  }
  /**
   * 设置文本大小
   * @param {[Number]} size [文本大小]
   */
  setTextSize(size){
    this.textSize = size
    this.imgWidth = size * 3 / 2
    this.imgHeight = size
  }
  /**
   * 设置偏移
   */
  setOffset(x = 20, y = -30){
    let px = Number(x)
    let py = Number(y)
    let pixel = new window.AMap.Pixel(px, py)
    this._text.setOffset(pixel)
  }
  /**
   * 根据运动员名字长度计算偏移量
   * @param {[type]} string [运动员姓名]
   */
  setOffsetInTextLength(string){
    let len = string.replace(/[^x00-xff]/g,"01").length
    let width = this.textSize * ( len / 2 )
    let value = this.flag? this.imgWidth : 6
    let offsetX = (width / 2) + value
    this.setOffset(offsetX)
  }
  /**
   * 设置点标记的叠加顺序
   */
  setzIndex(zIndex){
    this._text.setzIndex(zIndex)
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
    return this._text.getAngle()
  }
  /**
   * 设置旋转角度
   */
  setAngle(number){
    if(isNaN(number)){
      console.warn('setAngle, 参数错误')
      return
    }
    this._text.setAngle(number)
  }
  /**
   * 设置鼠标样式
   * @param {[string]} cursor [鼠标样式]
   */
  setCursor(cursor){
    this._text.setCursor(cursor)
  }
  /**
   * 获取显示文本
   */
  getTextString(){
    return this.textString
  }
  /**
   * 获取文本对象
   * @return {[Text]} [文本]
   */
  getRoot(){
    return this._text
  }
  /**
   * 显示文本
   */
  show(){
    this.isHide = false
    this._text.show()
  }
  /**
   * 隐藏文本
   */
  hide(){
    this.isHide = true
    this._text.hide()
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
  _getContent(text){
    if (!text){
      console.warn('_getContent, 参数错误')
      return
    }
    this.textString = text
    let color = this.config.color || '#000'
    let content = this.config.content || ""
    let textSize = this.textSize || 13
    let flag = this.flag || ''
    let imgWidth = this.imgWidth || 20
    let imgHeight = this.imgHeight || 13
    let isShowFlag = this.flag? 'inline-block' : 'none'
    content = content.replace(/content/g, text)
    content = content.replace(/textSize/g, textSize)
    content = content.replace(/textcolor/g, color)
    content = content.replace(/flag/g, flag)
    content = content.replace(/isShow/g, isShowFlag)
    content = content.replace(/imgWidth/g, imgWidth)
    content = content.replace(/imgHeight/g, imgHeight)
    return content
  }
}
