import MapMarkerIcon from './Overlay/MapMarkerIcon'
import MapText from './Overlay/MapText'
import OverlayConfig from './OverlayConfig'
import AlarmIconType from './AlarmIconType'
import TrackType from './TrackType'
import TrackMathUtil from './TrackMathUtil'
import AlarmType from '../Alarm/AlarmType'
import AlarmConfig from '../Alarm/AlarmConfig'
import BroadcastCenter from '../../Framework/Broadcast/BroadcastCenter'
const broadcastCenter = BroadcastCenter.getInstance()
const trackMathUtil = TrackMathUtil.getInstance()
export default class AlarmOverlayLogic{
  static getInstance(){
    if(!this._instance){
      this._instance = new AlarmOverlayLogic()
    }
    return this._instance
  }
  constructor(){
    broadcastCenter.addEventListener(
      "trackUpdateSuccess", this.updatePosition.bind(this))
    broadcastCenter.addEventListener(
      "deleteAlarmMarker", this.deleteAlarmMarker.bind(this))
    broadcastCenter.addEventListener(
      "updateAlarmIconSize", this.onChangeTrackIconSizeEvent.bind(this))
    broadcastCenter.addEventListener(
      "updateAlarmPosition", this.updateAlarmPosition.bind(this))
  }
  /**
   * 初始化属性
   * @param  {[type]} overlayLogic [覆盖物逻辑对象]
   */
  init(overlayLogicObj){
    this.overlayList = {}       //覆盖物列表
    this.removeOverlayList = {}
    this.isShow = false //是否显示报警图标
    this.overlayLogicObj = overlayLogicObj
    this.mapboxgl = null
    this.defaultIconSize = 20 //默认报警图标大小
    this.curIconSize = this.defaultIconSize //报警图标大小
    this.overspeedAlarmList = {} //超速报警列表
  }
  /**
   * 更新警报
   * @param  {[mapboxgl]} mapboxgl [地图对象]
   * @param  {[Array]} data [警报数据]
   * @param  {[Number]} iconType [报警图标是否跟随运动员]
   */
  updateAlarm(mapboxgl, data, icon_type = AlarmIconType.FOLLOW){
    this.mapboxgl = mapboxgl
    this.iconType = icon_type
    for (let i = 0; i < data.length; ++i){
      let item = data[i]
      let info = item.info
      let player_id = info.id
      let overlay = this.overlayList[player_id] || {}
      overlay.data = item
      overlay.static_data = overlay.static_data || []
      overlay.static_data.push(item)
      this.overlayList[player_id] = overlay
    }
    this._updateUI()
  }
  /**
   * 设置警报
   * @param  {[mapboxgl]} mapboxgl [地图对象]
   * @param  {[Array]} data [警报数据]
   * @param  {[Number]} iconType [报警图标是否跟随运动员]
   */
  setAlarm(mapboxgl, data, icon_type = AlarmIconType.FOLLOW){
    let deleteList = []
    for (let key in this.overlayList){
      let isFind = false
      for (let i = 0; i < data.length; ++i){
        let item = data[i]
        let info = item.info
        let id = info.id
        if (id === key){
          isFind = true
          break
        }
      }
      if (!isFind){
        deleteList.push(key)
      }
    }
    for (let i = 0; i < deleteList.length; ++i){
      let key = deleteList[i]
      let item = this.overlayList[key]
      this.removeAlarmItem(item)
    }
    this.updateAlarm(mapboxgl, data, icon_type)
  }
  /**
   * 更新所有警报坐标
   */
  updatePosition(data){
    let isJump = data.isJump
    for(let key in data.removeOverlayList){
      for(let id in data.removeOverlayList[key]){
        this.removeOverlayList[id] = data.removeOverlayList[key][id]
      }
    }
    this._updateUI(isJump)
  }
  /**
   * 设置是否显示警报UI
   * @param {Boolean} isShow [是否显示]
   */
  setIsShowAlarm(isShow){
    this.isShow = isShow
    this._updateUI()
  }
  /**
   * 删除所有警报
   */
  removeAllAlarmItem(){
    for (let key in this.overlayList){
      let item = this.overlayList[key]
      this.removeAlarmItem(item)
    }
  }
  /**
   * 删除指定警报
   * @param  {[Object]} item [警报覆盖物数据]
   */
  removeAlarmItem(item){
    let iconUIObj = item.iconUIObj
    let textUIObj = item.textUIObj
    if(this.iconType === AlarmIconType.FOLLOW){
      iconUIObj && iconUIObj.remove() // 删除警报UI图标
    }
    else if(this.iconType === AlarmIconType.STATIC){
      if(iconUIObj){
        for (let i = 0; i < iconUIObj.length; i++) {
          iconUIObj[i] && iconUIObj[i].remove() // 删除警报UI图标
        }
      }
      if(textUIObj){
        for (let i = 0; i < textUIObj.length; i++) {
          textUIObj[i] && textUIObj[i].remove()
        }
      }
    }
    let data = item.data
    let info = data.info
    // let sn = info.sn
    let player_id = info.id
    let trackType = info.is_worker === 1 ? TrackType.WORKER : TrackType.PLAYER
    this.overlayLogicObj.setDeviceTextzIndex(
      trackType, player_id, OverlayConfig.markerIconzIndex[data.state])
    this.overlayLogicObj.setDeviceAlarmType(trackType, player_id, AlarmType.NORMAL)
    delete this.overlayList[player_id]
  }
  /**
   * 报警解除更新报警图标UI
   * @param  {[type]} data      [解除报警数据]
   * @param  {[type]} alarmType [报警类型]
   */
  updateAlarmIcon(data, alarmType){
    for (let i = 0; i < data.length; i++) {
      let item = data[i]
      if(this.overlayList[item.player_id]){
        this.overlayList[item.player_id].data.alarm[alarmType].state = false
        let alarm = this.overlayList[item.player_id].data.alarm
        let newState = ''
        for (let j = 0; j <  AlarmConfig.Priority.length; j++) {
           let curState = AlarmConfig.Priority[j]
           if(alarm[curState].state){
             newState = curState
             break
           }
        }
        this.overlayList[item.player_id].data.state = newState
        if(!newState){
          this.overlayList[item.player_id].data.state = AlarmType.NORMAL
        }
      }
    }
    this._updateUI()
  }
  /**
   * sos警报解除事件
   * @param  {[Array]} data [警报信息]
   */
  sosAlarmRelieveEvent(data){
    this.updateAlarmIcon(data, AlarmType.SOS)
  }
  /**
   * 超速警报解除事件
   * @param  {[Array]} data [警报信息]
   */
  overspeedAlarmRelieveEvent(data){
    this.updateAlarmIcon(data, AlarmType.OVERSPEED)
  }
  /**
   * 报警图片点击回调
   */
  onClickMarker(key){
    console.log(key)
    let item = this.overlayList[key]
    let data = item.data
    let info = data.info
    let state = data.state
    let sn = info.sn
    let clickData = {
      ...info,
      sn: sn,
      state: state,
      alarm_id: data.alarm[data.state].id
    }
    if(info.is_worker === 1){
      broadcastCenter.pushEvent('onClickWorkerMarker', clickData)
    }
    else{
      broadcastCenter.pushEvent('onClickPlayerMarker', clickData)
    }
  }
  /**
   * 删除报警图标
   */
  deleteAlarmMarker(data){
    let player_id = data.data.id
    if(!this.overlayList[player_id]){
      return
    }
    if(this.iconType === AlarmIconType.FOLLOW){
      if(this.overlayList[player_id].iconUIObj){
        this.overlayList[player_id].iconUIObj.remove()
        delete this.overlayList[player_id].iconUIObj
      }
    }
    else if(this.iconType === AlarmIconType.STATIC){
      if(this.overlayList[player_id].iconUIObj){
        for (let i = 0; i < this.overlayList[player_id].iconUIObj.length; i++) {
          let item = this.overlayList[player_id].iconUIObj[i]
          item && item.remove()
        }
        delete this.overlayList[player_id].iconUIObj
      }
      if(this.overlayList[player_id].textUIObj){
        for (let  i = 0; i < this.overlayList[player_id].textUIObj.length; i++) {
          let item = this.overlayList[player_id].textUIObj[i]
          item && item.remove()
        }
        delete this.overlayList[player_id].textUIObj
      }
    }
  }
  /**
   * 更新报警坐标
   * @param  {[type]} data [markerData：报警工作人员或运动员信息，passedPath：动画移动路径]
   */
  updateAlarmPosition(data){
    let markerData = data.markerData
    let passedPath = data.passedPath
    let item = this.overlayList[markerData.id]
    let iconUIObj = item && item.iconUIObj
    if(this.iconType === AlarmIconType.FOLLOW && iconUIObj){
      iconUIObj.setPosition(
        passedPath[ passedPath.length - 1 ].lng,
        passedPath[ passedPath.length - 1 ].lat
      )
    }
  }
  /**
   * 更新报警标记大小
   */
  onChangeTrackIconSizeEvent(value){
    if(this.curIconSize !== value + 2){
      this.curIconSize = value + 2
      for (let key in this.overlayList){
        let item = this.overlayList[key]
        let iconUIObj = item.iconUIObj
        if(item.data.info.is_worker === 0 && iconUIObj && this.iconType === AlarmIconType.FOLLOW){
          iconUIObj.setContent({ size: this.curIconSize })
        }
      }
    }
  }
  /**
   * 更新超速报警速度UI
   */
  _updateOverspeedUI(trackType, player_id, state){
    let isShowSpeed = this.overlayLogicObj.getShowDeviceSpeed(trackType, player_id)
    if(isShowSpeed){
      return
    }
    if(state === AlarmType.OVERSPEED){
      this.overspeedAlarmList[player_id] = true
      this.overlayLogicObj.updateDeviceOverspeedUI(trackType, player_id, true)
    }
    else if(this.overspeedAlarmList[player_id]){
      this.overspeedAlarmList[player_id] = false
      this.overlayLogicObj.updateDeviceOverspeedUI(trackType, player_id, false)
    }
  }
  /**
   * 更新所有警报的UI
   */
  _updateUI(isJump = false){
    if (!this.isShow){
      return
    }
    if(this.iconType === AlarmIconType.FOLLOW){
      this._updateFollowUI(isJump)
    }else if(this.iconType === AlarmIconType.STATIC){
      this._updateStaticUI()
    }
  }
  _updateFollowUI(isJump = false){
    for (let key in this.overlayList){
      let item = this.overlayList[key]
      let data = item.data
      let state = data.state
      let info = data.info
      let player_id = info.id
      let trackType = info.is_worker === 1 ? TrackType.WORKER : TrackType.PLAYER
      if (state === 0){
        this._updateOverspeedUI(trackType, player_id, state)
        this.removeAlarmItem(item)
      }
      else {
        let itemIsJump = this.removeOverlayList[key]
        if(isJump){
          itemIsJump = isJump
        }
        this._updateFollowItemUI(item, key, itemIsJump)
        this._updateOverspeedUI(trackType, player_id, state)
      }
    }
  }
  _updateStaticUI(){
    for (let key in this.overlayList){
      let item = this.overlayList[key]
      this._updateStaticItemUI(item)
    }
  }
  /**
   * 更新指定警报
   * @param  {[Object]} item [警报覆盖物数据]
   */
  _updateFollowItemUI(item, key, isJump = false){
    if (!item){
      console.warn("AlarmOverlayLogic-_updateFollowItemUI, 参数错误")
      return
    }
    let iconUIObj = item.iconUIObj
    let data = item.data
    let info = data.info
    let state = data.state
    let sn = info.sn
    let player_id = info.id
    let trackType = info.is_worker === 1 ? TrackType.WORKER : TrackType.PLAYER
    let iconSize = info.is_worker === 1 ? this.defaultIconSize : this.curIconSize
    let zIndex = OverlayConfig.markerIconzIndex[state]
    let position  = this.overlayLogicObj.getDevicePosition(trackType, player_id)
    if (!position){
      return
    }
    if (iconUIObj){
      //更新 UI对象坐标
      if(this.overlayLogicObj.getTrackIsMoveEnd(trackType, player_id) && isJump){
        iconUIObj.setPosition(position.lat, position.lng)
      }
      if(iconUIObj.getIsHide()){
        item.iconUIObj.show()
      }
      iconUIObj.setzIndex(zIndex)
      this.overlayLogicObj.setDeviceTextzIndex(trackType, player_id, zIndex)
      this.overlayLogicObj.setDeviceAlarmType(trackType, player_id, state)
      let markerIcon = this._getMarkerIconImage(state)
      if(markerIcon){
        iconUIObj.updateMarkerIcon(markerIcon)
      }else{
        iconUIObj.remove()
      }
    }
    else {
      let config = {
        ...OverlayConfig.CircleMarkerIcon,
        position : new window.L.latLng(position.lat, position.lng),
        zIndex : zIndex
      }
      let markerIcon = this._getMarkerIconImage(state)
      if(markerIcon){
        item.iconUIObj = new MapMarkerIcon(this.mapboxgl, markerIcon, config, 'follow_alarm_icon' + sn)
        item.iconUIObj.setContent({ size: iconSize })
        item.iconUIObj.hide()
        this.overlayList[player_id].iconUIObj = item.iconUIObj
        this.overlayLogicObj.setDeviceTextzIndex(trackType, player_id, zIndex)
        this.overlayLogicObj.setDeviceAlarmType(trackType, player_id, state)
        // item.iconUIObj.click(()=>this.onClickMarker(key))
        item.iconUIObj.on('click', ()=>this.onClickMarker(key))
      }
    }
  }
  _updateStaticItemUI(item){
    if (!item){
      console.warn("AlarmOverlayLogic-_updateStaticItemUI, 参数错误")
      return
    }
    let iconUIObj = item.iconUIObj || []
    let staticData = item.static_data
    for (let i = 0, len = staticData.length; i < len; i++) {
      let staticItem = staticData[i]
      let alarm = staticItem.alarm
      let info = staticItem.info
      // let sn = info.sn
      let player_id = info.id
      let trackType = info.is_worker === 1 ? TrackType.WORKER : TrackType.PLAYER
      let iconSize = info.is_worker === 1 ? this.defaultIconSize : this.curIconSize
      for(let key in alarm){
        if(Object.getOwnPropertyNames(alarm[key]).length <= 0){
          continue
        }
        if (!iconUIObj[i]){
          let markerIcon = this._getMarkerIconImage(Number(key))
          if(markerIcon){
            let position = {}
            let historys = []
            let index = 0
            if (alarm[key]){
              historys = this.overlayLogicObj.getDeviceHistorys(trackType, player_id)
              if(!historys){
                continue
              }
              index = trackMathUtil.binarySearch(historys, trackMathUtil.newDate(alarm[key].deviceDate).getTime())
              if(historys[index]){
                position = {lat: historys[index].lat, lng: historys[index].lng}
              }
            }
            if (!position || !position.lng || !position.lat){
              continue
            }
            let zIndex = OverlayConfig.markerIconzIndex[key]
            position = new window.L.latLng(position.lat, position.lng)
            let iconConfig = {
              ...OverlayConfig.CircleMarkerIcon,
              zIndex : zIndex,
              position : position
            }
            item.iconUIObj = item.iconUIObj || []
            item.iconUIObj[i] = new MapMarkerIcon(this.mapboxgl, markerIcon, iconConfig, 'static_alarm_icon' + i)
            item.iconUIObj[i].setContent({ size: iconSize })
            this.overlayList[player_id].iconUIObj[i] = item.iconUIObj[i]
            //超速报警显示速度
            if(Number(key) === AlarmType.OVERSPEED){
              let textConfig = {
                ...OverlayConfig.TextString,
                position : position,
                color: this.overlayLogicObj.getDeviceColor(trackType, player_id)
              }
              item.textUIObj = item.textUIObj || []
              item.textUIObj[i] = new MapText(this.mapboxgl, textConfig, 'static_alarm_text' + i)
              item.textUIObj[i].setContent({ text: info.speed + 'km/h' })
              item.textUIObj[i].setOffset()
            }
            else{
              item.textUIObj = item.textUIObj || []
              item.textUIObj[i] = undefined
            }
            this.overlayLogicObj.setDeviceTextzIndex(trackType, player_id, zIndex)
          }
        }
      }
    }
  }
  /**
   * 获取报警图片
   * @param  {[type]} state      [报警状态]
   * @param  {[type]} imageState [图片状态]
   */
  _getMarkerIconImage(state){
    let retImage = ''
    if(state === AlarmType.SOS){
      retImage = 'SOS'
    }
    else if(state === AlarmType.INEXCLUSIONZONE
        || state === AlarmType.OUTFENCE){
      retImage = 'LIMIT'
    }
    else if(state === AlarmType.STAY){
      retImage = 'STOP'
    }
    else if(state === AlarmType.OVERSPEED){
      retImage = 'OVERSPEED'
    }
    else if(state === AlarmType.OVERTIME){
      retImage = 'OVERTIME'
    }
    return retImage
  }
}
