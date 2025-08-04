
import Util from '../../Common/Utils/Util'
import OverlayConfig from './OverlayConfig'
import TrackFactory from './Track/TrackFactory'
import BroadcastCenter from '../../Framework/Broadcast/BroadcastCenter'
import TrackType from './TrackType'
const util = Util.getInstance()
const trackFactory = TrackFactory.getInstance()
const broadcastCenter = BroadcastCenter.getInstance()
export default class TrackLogic{
  static getInstance(){
    if(!this._instance){
      this._instance = new TrackLogic()
    }
    return this._instance
  }
  /**
   * 初始化属性
   */
  init(){
    this.overlayList = {}       //覆盖物列表
    this.removeOverlayList = {} //隐藏覆盖物列表
    this.dataPool = []          //数据池
    this.overlayConfigObj = {} //设置轨迹显示属性
    this.reFocus = false //是否重新聚焦窗口
    this.centerPlayerId = "" //追踪运动员id
    this.selectDeviceData = {} //实时定位选中设备数据
    this.markMoveMutipleData = {} //标记点播放倍速数据
    this.isShowTrack = true
    this._startTimer()
    //添加设置轨迹参数监听
    broadcastCenter.addEventListener("onChangeTrackOptEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    broadcastCenter.addEventListener("onChangeTrackLngEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    broadcastCenter.addEventListener("onChangeTrackWidthEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    broadcastCenter.addEventListener("onChangeTrackIconSizeEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    broadcastCenter.addEventListener("onChangeTrackNameEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    broadcastCenter.addEventListener("onChangeTrackNameSizeEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    broadcastCenter.addEventListener("onChangeMapCursorEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    broadcastCenter.addEventListener("onChangeShowSpeedEvent",
      this._onChangeOverlayConfigEvent.bind(this))
    //中心运动员监听
    broadcastCenter.addEventListener('updateCenterPlayer',
      this._updateCenterPlayer.bind(this))
    //更新设备标记点UI监听
    broadcastCenter.addEventListener('onUpdateDeviceTrackUI',
      this._updateDeviceTrackUI.bind(this))
    //更新播放倍速监听
    broadcastCenter.addEventListener('updateProgressBarMutiple',
      this._onChangeMarkMoveMutiple.bind(this))
    //窗口聚焦失焦监听
    broadcastCenter.addEventListener("window_onfocus",
      this._windowOnfocus.bind(this))
    broadcastCenter.addEventListener("window_onblur",
      this._windowOnblur.bind(this))
  }
  /**
   * 删除所有覆盖物对象
   * @param  {[Amap]} aMap [地图对象]
   */
  removeAllTarckItem(aMap){
    if (!aMap){
      return
    }
    for (let type in this.overlayList){
      let list = this.overlayList[type]
      for (let key in list){
        this._removeTarckItem(type, key)
      }
    }
    this.overlayList = {}  //覆盖物列表
  }
  /**
   * 更新地图
   * @param  {[AMap]} aMap [地图对象]
   * @param  {[Object]} data [轨迹数据]
   * @param  {[Date]} curTime [当前播放时间]
   * @param  {[Boolean]} isJump [是否使用跳点方式]
   */
  updateMapTrack(aMap, data, curTime, isJump = false){
    // this.updateMapDirectTrack(aMap, data, curTime, isJump)
    this.dataPool.push({
      aMap: aMap,
      data: util.deepCopy(data),
      curTime: curTime,
      isJump: isJump,
      isUpdating: false,
    })
  }
  /**
   * 直接更新地图，不优化
   * @param  {[AMap]} aMap [地图对象]
   * @param  {[Object]} data [轨迹数据]
   * @param  {[Date]} curTime [当前播放时间]
   * @param  {[Boolean]} isJump [是否使用跳点方式]
   */
  updateMapDirectTrack(aMap, data, curTime, isJump = false){
    this._setDeletableTag()
    this._updateOverlayListItem(aMap, data)
    this._updateData(data, curTime, isJump)
    this._removeDeletableItem()
  }
  /**
   * 设置轨迹显示状态
   */
  setShowStatus(isShow){
    this.isShowTrack = isShow
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        if(isShow){
          item.showTrack()
        }
        else{
          item.hideTrack()
        }
      }
    }
  }
  /**
   * 停止轨迹动画
   */
  stopTrackMove(){
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        item.stopMove()
      }
    }
  }
  /**
   * 获取目标设备颜色
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @return {[string]}    [颜色]
   */
  getDeviceTrackColor(type, id){
    if (!type || !id){
      return
    }
    if (this.overlayList[type] && this.overlayList[type][id]){
      return this.overlayList[type][id].getColor()
    }
  }
  /**
   * 获取目标设备坐标
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @return {[Object]}    [坐标]
   */
  getDeviceTrackPosition(type, id){
    if (!type || !id){
      return
    }
    if (this.overlayList[type] && this.overlayList[type][id]){
      return this.overlayList[type][id].getPosition()
    }
  }
  /**
   * 获取目标设备历史轨迹
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @return {[Array]}    [数组]
   */
  getDeviceTrackHistorys(type, id){
    if (!type || !id){
      return
    }
    if (this.overlayList[type] && this.overlayList[type][id]){
      return this.overlayList[type][id].getHistorys()
    }
  }
  /**
   * 获取轨迹速度显示状态
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   */
  getShowDeviceTrackSpeed(type, id){
    if (!type || !id){
      return
    }
    if (this.overlayList[type] && this.overlayList[type][id]){
      return this.overlayList[type][id].getShowSpeed()
    }
  }
  /**
   * 判断运动员是否在屏幕外
   */
  isPlayerOffScreen(aMap) {
    if (!aMap) {
      return
    }
    if (this.overlayList[TrackType.PLAYER]) {
      for (let id in this.overlayList[TrackType.PLAYER]) {
        let item = this.overlayList[TrackType.PLAYER][id]
        if (item) {
          let position = item.getPosition()
          let mapBounds = aMap.getBounds()
          if (position) {
            let isPointInBounds = mapBounds.contains(
              new window.AMap.LngLat(position.lng, position.lat))
            if (!isPointInBounds) {
              return true
            }
          }
        }
      }
      return false
    }
    return false
  }
  /**
   * 调整地图范围
   */
  setPlayerFitView(aMap){
    if (!aMap || !this.overlayList[TrackType.PLAYER]) {
      return
    }
    let allPlayersMarker = []
    for (let id in this.overlayList[TrackType.PLAYER]) {
      let item = this.overlayList[TrackType.PLAYER][id]
      if (item) {
        let marker = item.getTextMarker()
        if (marker) {
          allPlayersMarker.push(marker)
        }
      }
    }
    aMap.setFitView(allPlayersMarker)
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
    if (this.overlayList[type] && this.overlayList[type][id]){
      return this.overlayList[type][id].getIsMoveEnd()
    }
  }
  /**
   * 设置文字层级
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @param {[Number]} zIndex [层级]
   */
  setDeviceTrackTextzIndex(type, id, zIndex){
    if (!type || !id){
      return
    }
    if (this.overlayList[type] && this.overlayList[type][id]){
      this.overlayList[type][id].setTextZIndex(zIndex)
    }
  }
  /**
   * 设置轨迹报警类型
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @param {[type]} state [报警类型]
   */
  setDeviceTrackAlarmType(type, id, state){
    if (!type || !id){
      return
    }
    if (this.overlayList[type] && this.overlayList[type][id]){
      this.overlayList[type][id].setAlarmType(state)
    }
  }
  /**
   * 更新超速报警标记点UI
   * @param  {[string]} type [类型]
   * @param  {[string]} id [目标ID]
   * @param  {[boolen]} state [是否显示速度]
   */
  updateDeviceTrackOverspeedUI(type, id, state){
    if (!type || !id){
      return
    }
    if (this.overlayList[type] && this.overlayList[type][id]){
      this.overlayList[type][id].updateOverspeedUI(state)
    }
  }
  /**
   * 设置轨迹颜色
   * @param {[string]} type  [类型]
   * @param {[string]} id    [ID]
   * @param {[Color]} color [颜色]
   */
  setDeviceTrackColor(type, id, color){
    if(!type || !id || !color){
      return
    }
    this.overlayList[type] && this.overlayList[type][id] &&
    this.overlayList[type][id].setColor(color)
  }
  /**
   * 设置this.dataPool
   */
  setDataPool(data){
    this.dataPool = data
  }
  /**
   * 浏览器获得焦点
   */
  _windowOnfocus(){
    this.reFocus = true
  }
  /**
   * 浏览器失去焦点
   */
  _windowOnblur(){}
  /**
   * 开启定时器，使用优化算法
   * @return {[type]} [description]
   */
  _startTimer(){
    this._removeTimer()
    this.timer = setInterval(()=>{
      if (this.dataPool.length <= 0){
        return
      }
      let target = this.dataPool[0]
      let data = target.data
      let aMap = target.aMap
      let curTime = target.curTime
      let isJump = target.isJump
      let isUpdating = target.isUpdating
      if (!isUpdating){
        //一个数据包第一次进行更新
        //更新设备删除标记
        target.isUpdating = true
        this._setDeletableTag()
        this._updateOverlayListItem(aMap, data)
        this._removeDeletableItem()
      }
      let updateData = data.splice(0,OverlayConfig.TrackUpdateCount)
      this._updateData(updateData, curTime, isJump)
      //如果轨迹数据已经更新完了，删除该数据包
      if (data.length <= 0){
        this.dataPool.shift()
      }
    }, OverlayConfig.TrackUpdateTime)
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
   * 更新数据
   * @param  {[Object]} data [轨迹数据]
   * @param  {[Date]} curTime [当前播放时间]
   * @param  {[Boolean]} isJump [是否使用跳点方式]
   */
  _updateData(data, curTime, isJump = false){
    if (!data || data.length <= 0 || !this.isShowTrack){
      return
    }
    let isJumpState = isJump
    //重新聚焦窗口，使用跳点方式将轨迹数据更新到最新状态
    if(this.reFocus){
      isJumpState = true
      this.reFocus = false
    }
    for (let i = 0; i < data.length; ++i){
      let item = data[i]
      let type = item.type
      let id = item.id
      this.removeOverlayList[type] = this.removeOverlayList[type] || {}
      let itemIsJump = this.removeOverlayList[type][id]
      if(isJumpState){
        itemIsJump = isJumpState
      }
      this.overlayList[type] && this.overlayList[type][id] &&
      this.overlayList[type][id].updateData(item, curTime, itemIsJump)
      this.removeOverlayList[type][id] = false
    }
    broadcastCenter.pushEvent("trackUpdateSuccess", {
      isJump: isJumpState,
      removeOverlayList: this.removeOverlayList
    })
  }
  /**
   * 更新或者初始化覆盖物列表状态
   * @param  {[AMap]} aMap [地图对象]
   * @param  {[Object]} item [单个设备轨迹信息]
   */
  _updateOverlayListItem(aMap, data){
    if (!aMap || !data || data.length <= 0){
      return
    }
    for (let i = 0; i < data.length; ++i){
      let item = data[i]
      let type = item.type
      let id = item.id
      this.overlayList[type] = this.overlayList[type] || {}
      if (this.overlayList[type][id]){
        this.overlayList[type][id].setDeletable(false)
      }
      else {
        this.overlayList[type][id] = trackFactory.create(type, aMap, item)
        this.overlayList[type][id].updateOverlayConfig(this.overlayConfigObj)
        this.overlayList[type][id].updateCenterPlayer(this.centerPlayerId)
        this.overlayList[type][id].updateDeviceTrackUI(this.selectDeviceData)
        this.overlayList[type][id].updateProgressBarMutiple(this.markMoveMutipleData.mutiple)
        this.overlayList[type][id].updateTrackMoveState(this.markMoveMutipleData.state)
        this.setDeviceTrackColor(type, id, item.uniqueColor)
      }
    }
  }
  /**
   * 设置删除标记
   */
  _setDeletableTag(){
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        item.setDeletable(true)
      }
    }
  }
  /**
   * 删除被标记的对象
   */
  _removeDeletableItem(){
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        if (item.getDeletable()){
          this._removeTarckItem(type, key)
        }
      }
    }
  }
  /**
   * 删除指定轨迹
   * @param {[string]} type  [类型]
   * @param {[string]} id    [ID]
   */
  _removeTarckItem(type, key){
    let item = this.overlayList[type][key]
    item.destroy()
    broadcastCenter.pushEvent("deleteAlarmMarker", item)
    this.removeOverlayList[type][key] = true
  }

  /**
   * 设置轨迹透明度，长度，宽度，标记点大小，标记点姓名，姓名大小属性
   * @param  {[type]} data [description]
   */
  _onChangeOverlayConfigEvent(data){
    this.overlayConfigObj[data.key] = data.value
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        item && item.updateOverlayConfig(this.overlayConfigObj)
      }
    }
  }
  /**
   * 追踪运动员
   * @param  {[type]} id [运动员id]
   */
  _updateCenterPlayer(id){
    this.centerPlayerId = id
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        item && item.updateCenterPlayer(id)
      }
    }
  }
  /**
   * 实时定位选中运动员
   * @param  {[type]} data [description]
   */
  _updateDeviceTrackUI(data){
    this.selectDeviceData = data
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        item && item.updateDeviceTrackUI(data)
      }
    }
  }
  /**
   * 更新标记点移动倍速
   * @param  {[type]} data [标记点移动倍速]
   */
  _onChangeMarkMoveMutiple(data){
    this.markMoveMutipleData = data
    for (let type in this.overlayList){
      let list  = this.overlayList[type]
      for (let key in list){
        let item = list[key]
        item && item.updateProgressBarMutiple(data.mutiple)
        item && item.updateTrackMoveState(data.state)
      }
    }
  }
}
