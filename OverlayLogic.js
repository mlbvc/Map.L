import TrackLogic from './TrackLogic'
import StaticOverlayLogic from './StaticOverlayLogic'
import AlarmOverlayLogic from './AlarmOverlayLogic'
import SignImageLogic from './SignImageLogic'
import DistanceComparisonLogic from './DistanceComparisonLogic'
const trackLogic = TrackLogic.getInstance()
const staticOverlayLogic = StaticOverlayLogic.getInstance()
const alarmOverlayLogic = AlarmOverlayLogic.getInstance()
const signImageLogic = SignImageLogic.getInstance()
const distanceComparisonLogic = DistanceComparisonLogic.getInstance()
export default class OverlayLogic{
  static getInstance(){
    if(!this._instance){
      this._instance = new OverlayLogic()
    }
    return this._instance
  }
  constructor(){
    this.init()
  }
  /**
   * 初始化属性
   */
  init(){
    this.listenerList = {}
    trackLogic.init()
    staticOverlayLogic.init()
    alarmOverlayLogic.init(this)
  }
  /**
   * sos警报解除事件
   * @param  {[Array]} data [警报信息]
   */
  sosAlarmRelieveEvent(data){
    alarmOverlayLogic.sosAlarmRelieveEvent(data)
  }
  /**
   * 超速警报解除事件
   * @param  {[Array]} data [警报信息]
   */
  overspeedAlarmRelieveEvent(data){
    alarmOverlayLogic.overspeedAlarmRelieveEvent(data)
  }
  /**
   * 删除所有覆盖物对象
   * @param  {[mapboxgl]} mapboxgl [地图对象]
   */
  removeAllMapOverlay(mapboxgl){
    if (!mapboxgl){
      console.log("删除地图所有覆盖物对象失败！")
      return
    }
    trackLogic.removeAllTarckItem(mapboxgl)
    staticOverlayLogic.removeAllStaticItem(mapboxgl)
    alarmOverlayLogic.removeAllAlarmItem(mapboxgl)
  }
  /**
   * 更新路程对比
   * @param  {[Object]} mapboxgl        [地图对象]
   * @param  {[Object]} data        [路程对比数据]
   */
  updateMapDistanceComparison(mapboxgl, data){
    if(!mapboxgl){
      console.log('设置地图路程对比失败')
      return
    }
    distanceComparisonLogic.updateDistanceComparison(mapboxgl, data)
  }
  /**
   * 初始化签到点图片
   * @param  {[Object]} mapboxgl        [地图对象]
   * @param  {[Object]} map_info        [地图覆盖图片信息]
   * @param  {[Array]} sign_image_info [签到点图片信息]
   */
  initMapSignImage(mapboxgl, map_info, sign_image_info){
    if(!mapboxgl){
      console.log('初始化签到点图片失败')
      return
    }
    signImageLogic.initSignImage(mapboxgl, map_info, sign_image_info)
  }
  /**
   * 更新签到点图片
   * @param  {[Object]} mapboxgl            [地图对象]
   * @param  {[Object]} map_info        [地图覆盖图片信息]
   * @param  {[Object]} sign_image_info [签到点图片信息]
   * @param {String} isPassSetPanTo [是否设置签到点旋转中心]
   * @param  {Object} [config={}]     [签到点图片配置]
   */
  updateMapSignImage(mapboxgl, map_info, sign_image_info, isPassSetPanTo, config={}){
    if(!mapboxgl){
      console.log('设置地图标记点图片失败')
      return
    }
    signImageLogic.updateSignImage(mapboxgl, map_info, sign_image_info, isPassSetPanTo, config={})
  }
  /**
   * 绘制路线
   * @param  {[Object]} mapboxgl        [地图对象]
   * @param  {[Object]} data        [地图数据]
   */
  drawMapRoute(mapboxgl, data){
    if(!mapboxgl){
      console.log('设置地图多边形失败')
      return
    }
    staticOverlayLogic.drawRoute(mapboxgl, data)
  }
  /**
   * 更新多边形覆盖物
   * @param  {[Object]} mapboxgl        [地图对象]
   * @param  {[Object]} data        [地图数据]
   */
  updateMapPolygon(mapboxgl, data){
    if(!mapboxgl){
      console.log('设置地图多边形失败')
      return
    }
    staticOverlayLogic.updatePolygon(mapboxgl, data)
  }
  /**
   * 更新图片覆盖物
   * @param  {[Object]} mapboxgl        [地图对象]
   * @param  {[Object]} data        [地图数据]
   * @param  {Object} [config={}] [图片覆盖物配置属性]
   */
  updateMapGroundImage(mapboxgl, data, config={}){
    if(!mapboxgl){
      console.log('设置地图叠加图片失败')
      return
    }
    staticOverlayLogic.updateGroundImage(mapboxgl, data, config)
  }
  /**
   * 是否有地图叠加图片
   */
  hasMapGroundImage(data){
    return staticOverlayLogic.hasGroundImage(data)
  }
  /**
   * 是否有运动员在屏幕外
   */
  isPlayerOffMapScreen(mapboxgl){
    if(!mapboxgl){
      return
    }
    return trackLogic.isPlayerOffScreen(mapboxgl)
  }
  /**
   * 设置地图可视范围，显示所有运动员
   */
  setPlayerFitMapView(mapboxgl){
    if(!mapboxgl){
      return
    }
    trackLogic.setPlayerFitView(mapboxgl)
  }
  /**
   * 设置地图图层类型
   */
  setMapLayer(mapboxgl, type, isRoadNet){
    if(!mapboxgl){
      console.log('设置地图图层类型失败')
      return
    }
    staticOverlayLogic.setMapLayer(mapboxgl, type, isRoadNet)
  }
  /**
   * 更新地图覆盖物数据
   * @param  {[mapboxgl]} mapboxgl [地图对象]
   * @param  {[Object]} data [轨迹数据]
   * @param  {[Date]} curTime [当前播放时间]
   * @param  {[Boolean]} isJump [是否使用跳点方式]
   */
  updateMapOverlay(mapboxgl, data, curTime, isJump = false){
    if (!mapboxgl || !data || !curTime){
      console.log("更新地图数据失败！")
      return
    }
    trackLogic.updateMapTrack(mapboxgl, data, curTime, isJump)
  }
  /**
   * 直接更新地图覆盖物数据，不优化
   * @param  {[mapboxgl]} mapboxgl [地图对象]
   * @param  {[Object]} data [轨迹数据]
   * @param  {[Date]} curTime [当前播放时间]
   * @param  {[Boolean]} isJump [是否使用跳点方式]
   */
  updateMapOverlayDirect(mapboxgl, data, curTime, isJump = false){
    if (!mapboxgl || !data || !curTime){
      console.log("更新地图数据失败！")
      return
    }
    trackLogic.updateMapDirectTrack(mapboxgl, data, curTime, isJump)
  }
  /**
   * 设置轨迹显示更新状态
   */
  setShowMapOverlayStatus(isShow){
    trackLogic.setShowStatus(isShow)
  }
  /**
   * 播放轨迹动画
   */
  // startTrackMove(){
  //   trackLogic.startTrackMove()
  // }
  /**
   * 停止轨迹动画
   */
  stopTrackMove(){
    trackLogic.stopTrackMove()
  }
  /**
   * 更新警报
   * @param  {[mapboxgl]} mapboxgl [地图对象]
   * @param  {[Array]} data [警报数据]
   * @param  {[Number]} iconType [报警图标是否跟随运动员]
   */
  updateMapAlarm(mapboxgl, data, icon_type){
    if (!mapboxgl || !data){
      console.log("更新警报数据失败！")
      return
    }
    alarmOverlayLogic.updateAlarm(mapboxgl, data, icon_type)
  }
  /**
   * 设置警报
   * @param  {[mapboxgl]} mapboxgl [地图对象]
   * @param  {[Array]} data [警报数据]
   * @param  {[Number]} iconType [报警图标是否跟随运动员]
   */
  setAlarm(mapboxgl, data, icon_type){
    if (!mapboxgl || !data){
      console.log("更新警报数据失败！")
      return
    }
    alarmOverlayLogic.setAlarm(mapboxgl, data, icon_type)
  }
  /**
   * 设置是否显示警报UI
   * @param {Boolean} isShow [是否显示]
   */
  setIsShowAlarm(isShow){
    alarmOverlayLogic.setIsShowAlarm(isShow)
  }
  /**
   * 获取目标设备颜色
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @return {[string]}    [颜色]
   */
  getDeviceColor(type, id){
    if (!type || !id){
      console.warn('getDeviceColor, 参数错误')
      return
    }
    return trackLogic.getDeviceTrackColor(type, id)
  }
  /**
   * 设置目标设备颜色
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @param  {[string]} color [颜色]
   */
  setDeviceColor(type, id, color){
    if (!type || !id || !color){
      console.warn('setDeviceColor, 参数错误')
      return
    }
    trackLogic.setDeviceTrackColor(type, id, color)
  }
  /**
   * 获取设备的坐标
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @return {[Object]}    [坐标]
   */
  getDevicePosition(type, id){
    if (!type || !id){
      return
    }
    return trackLogic.getDeviceTrackPosition(type, id)
  }
  /**
   * 获取目标设备历史轨迹
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @return {[Array]}    [数组]
   */
  getDeviceHistorys(type, id){
    if (!type || !id){
      return
    }
    return trackLogic.getDeviceTrackHistorys(type, id)
  }
  /**
  * 获取轨迹速度显示状态
  * @param  {[string]} type [类型]
  * @param  {[string]} id [目标ID]
   */
  getShowDeviceSpeed(type, id){
    if (!type || !id){
      return
    }
    return trackLogic.getShowDeviceTrackSpeed(type, id)
  }
  /**
  * 获取目标轨迹动画是否移动完成
  * @param  {[string]} type [类型]
  * @param  {[string]} id [目标ID]
   */
  getTrackIsMoveEnd(type, id){
    if (!type || !id){
      return
    }
    return trackLogic.getTrackIsMoveEnd(type, id)
  }
  /**
   * 设置文字层级
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @param {[Number]} zIndex [层级]
   */
  setDeviceTextzIndex(type, id, zIndex){
    if (!type || !id){
      return
    }
    return trackLogic.setDeviceTrackTextzIndex(type, id, zIndex)
  }
  /**
   * 设置轨迹报警类型
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @param {[type]} state [报警类型]
   */
  setDeviceAlarmType(type, id, state){
    if (!type || !id){
      return
    }
    return trackLogic.setDeviceTrackAlarmType(type, id, state)
  }
  /**
   * 更新超速报警标记点UI
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @param  {[boolen]} state [是否显示速度]
   */
  updateDeviceOverspeedUI(type, id, state){
    if (!type || !id){
      return
    }
    return trackLogic.updateDeviceTrackOverspeedUI(type, id, state)
  }
  /**
   * 设置直播数据this.dataPool
   */
  setMapDataPool(data){
    if(!data){
      return
    }
    trackLogic.setDataPool(data)
  }
}
