import BaseTrack from "./BaseTrack"
import MapText from '../Overlay/MapText'
import MapCircleMarker from '../Overlay/MapCircleMarker'
import MapMarkerIcon from '../Overlay/MapMarkerIcon'
import OverlayConfig from '../OverlayConfig'
import ColorCenter from '../Color/ColorCenter'
import AlarmType from '../../Alarm/AlarmType'
import BroadcastCenter from '../../../Framework/Broadcast/BroadcastCenter'
import SetUpType from '../../../Component/SetUp/SetUpType'
import * as Flags from '../../../FlagRoot'
const broadcastCenter = BroadcastCenter.getInstance()
const colorCenter = ColorCenter.getInstance()
export default class PlayerTrack extends BaseTrack {
  /**
   * 初始化
   */
  _init(){
    this.polyline = null
    this.text = null
    this.endMarker = null
    this.circleMarker = null
    this.iconMarker = null
    this.color = colorCenter.getColor()
    this.playerName = this.data.initials || this.data.name || ''
    this.isCenter = false //是否将运动员位置设为地图中心
    broadcastCenter.addEventListener(
      'updatePlayerNameText',
      this._updateTrackNameText.bind(this))
    broadcastCenter.addEventListener(
      'updatePlayerMarkerIcon',
      this._updateTrackMarkerIcon.bind(this))
  }
  /**
   * 根据设置参数更新运动员UI
   */
  updateOverlayConfig(data){
    for(let key in data){
      switch (key) {
        case SetUpType.TRACKOPT:
          this._updateTrackOpt(data[key])
          break;
        case SetUpType.TRACKLNG:
          this._updateTrackLng(data[key])
          break;
        case SetUpType.TRACKWIDTH:
          this._updateTrackWidth(data[key])
          break;
        case SetUpType.TRACKICONSIZE:
          this._updateTrackIconSize(data[key])
          break;
        case SetUpType.TRACKNAME:
          this._updateTrackName(data[key])
          break;
        case SetUpType.TRACKNAMESIZE:
          this._updateTrackNameSize(data[key])
          break;
        case SetUpType.MAPCURSOR:
          this._updateMapCursor(data[key])
          break;
        case SetUpType.SHOWSPEED:
          this._updateShowSpeed(data[key])
          break;
        default:
      }
    }
  }
  /**
   * 更新超速报警标记点UI
   * @param  {[boolen]} state [是否显示速度]
   */
  updateOverspeedUI(state){
    if(this.text){
      let text = this.playerName
      if(state){
        text = this.playerName + " " + this.curSpeed + "km/h"
      }
      this.text.setContent({
        size: this.textSize,
        text: text
      })
    }
  }
  /**
   * 追踪运动员
   * @param  {[type]} id [运动员id]
   */
  updateCenterPlayer(id){
    this.isCenter = this.data.id === id
    let zIndexCircle = OverlayConfig.CircleMarker.zIndex
    let zIndexIcon = OverlayConfig.CircleMarkerIcon.zIndex
    let zIndexText = OverlayConfig.TextString.zIndex
    if(this.isCenter){
      let lat = this.position.lat
      let lng = this.position.lng
      if(lat && lng){
        this.mapboxgl.panTo(new window.L.LatLng(lat, lng))
        zIndexCircle = OverlayConfig.maxzIndex
        zIndexIcon = OverlayConfig.maxzIndex
        zIndexText = OverlayConfig.maxzIndex
      }
    }
    this.circleMarker && this.circleMarker.setCenter(this.isCenter)
    this.iconMarker && this.iconMarker.setCenter(this.isCenter)
    this.circleMarker && this.circleMarker.setzIndex(zIndexCircle)
    this.iconMarker && this.iconMarker.setzIndex(zIndexIcon)
    this.text && this.text.setzIndex(zIndexText)
  }
  /**
   * 更新轨迹透明度
   */
  _updateTrackOpt(value){
    let newValue = Number(value/100)
    if(newValue !== this.polylineStrokeOpacity){
      this.polylineStrokeOpacity = newValue
      if(this.polyline){
        this.polyline.setLineOpacity(this.polylineStrokeOpacity)
      }
    }
  }
  /**
   * 更新轨迹长度
   */
  _updateTrackLng(value){
    let newValue = value * 1000 * 60
    if(newValue !== this.trackMemoryTime){
      this.trackMemoryTime = newValue
      this.isShowAllHistorys = value === -1
      this._updateData(true)
      this._updateUI(true)
      broadcastCenter.pushEvent('updateAlarmPosition', {
        markerData:this.data,
        passedPath: [this.getPosition()]
      })
    }
  }
  /**
   * 更新轨迹宽度
   */
  _updateTrackWidth(value){
    let newValue = Number(value)
    if(newValue !== this.polylineStrokeWeight){
      this.polylineStrokeWeight = newValue
      if(this.polyline){
        this.polyline.setLineWidth(this.polylineStrokeWeight)
      }
    }
  }
  /**
   * 更新标记点大小
   */
  _updateTrackIconSize(value){
    let diameter = value - 2
    diameter = diameter <= 0? 0.1 : diameter
    if(diameter !== this.circleMarkerSize){
      this.circleMarkerSize = diameter
      this.iconMarkerSize = value
      if(this.circleMarker){
        this.circleMarker.setContent({ size: diameter })
      }
      if(this.iconMarker){
        this.iconMarker.setContent({ size: value })
      }
      broadcastCenter.pushEvent('updateAlarmIconSize', value)
    }
  }
  /**
   * 更新轨迹运动员姓名
   */
  _updateTrackName(value){
    this.nameType = value
    if(value === 0){
      this.playerName = ' '
    }
    else if(value === 1){
      this.playerName = this.data.initials?this.data.initials:this.data.name
    }
    else if(value === 2){
      this.playerName = this.data.name
    }
    else if(value === 3){
      this.playerName = this.data.number_book
    }
    else{
      this.playerName = this.data.initials?this.data.initials:this.data.name
    }
    if(this.text){
      this.text.setContent({
        flag: Flags[this.data.country],
        text: this.playerName
      })
    }
  }
  /**
   * 更新轨迹运动员姓名大小
   */
  _updateTrackNameSize(value){
    if(value !== this.textSize){
      this.textSize = value
      if(this.text){
        this.text.setContent({ size: value })
      }
    }
  }
  /**
   * 更新标记点鼠标样式
   */
  _updateMapCursor(value){
    if(value !== this.markerCursor){
      this.markerCursor = value
      this.text && this.text.setCursor(this.markerCursor)
      this.circleMarker && this.circleMarker.setCursor(this.markerCursor)
      this.iconMarker && this.iconMarker.setCursor(this.markerCursor)
      this.endMarker && this.endMarker.setCursor(this.markerCursor)
    }
  }
  /**
   * 更新运动员标记点文本，图片
   */
  _updateSeverData(oldData){
    if(oldData.name !== this.data.name
      || oldData.initials !== this.data.initials
      || oldData.number_book !== this.data.number_book
      || oldData.country !== this.data.country){
      broadcastCenter.pushEvent('updatePlayerNameText')
    }
    if(oldData.image !== this.data.image){
      broadcastCenter.pushEvent('updatePlayerMarkerIcon')
    }
  }
  /**
   * 更新标记点名称
   */
  _updateTrackNameText(){
    this._updateTrackName(this.nameType)
  }
  /**
   * 更新标记点图片
   */
  _updateTrackMarkerIcon(){
    if(this.iconMarker){
      this.iconMarker.setContent({ image: this.data.image })
    }
  }
  /**
   * 更新速度显示状态
   */
  _updateShowSpeed(value){
    this.isShowSpeed = value
    this.updateOverspeedUI(value)
  }
  /**
   * 停止轨迹动画
   */
  _stopMove(){
    this.text && this.text.stopMove()
    this.endMarker && this.endMarker.stopMove()
  }
  /**
   * 显示轨迹
   */
  _showTrack(){
    this.text && this.text.show()
    this.polyline && this.polyline.show()
    this.circleMarker && this.circleMarker.show()
    this.iconMarker && this.iconMarker.show()
    this.endMarker && this.endMarker.show()
  }
  /**
   * 隐藏轨迹
   */
  _hideTrack(){
    this.text && this.text.hide()
    this.polyline && this.polyline.hide()
    this.circleMarker && this.circleMarker.hide()
    this.iconMarker && this.iconMarker.hide()
    this.endMarker && this.endMarker.hide()
  }
  /**
   * 更新UI
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateUI(isJump = false){
    this._updateCenterPos(isJump)
    this._updateMapText(isJump)
    this._updatePolyline(isJump)
    this._updateMarkers(isJump)
    this._updateEndMarkerIcon(isJump)
    this.isDataUpdate = false
  }
  /**
   * 更新追踪运动员地图中心
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateCenterPos(isJump = false){
    if(this.isDataUpdate && this.isCenter){
      if (isJump){
        let lat = this.position.lat
        let lng = this.position.lng
        this.mapboxgl.panTo(new window.L.LatLng(lat, lng))
      }
      else {
        if (this.isMoveEnd){
          let targetPos = this.moveAlongPolyline[0]
          targetPos && this.mapboxgl.panTo(
            new window.L.LatLng(targetPos.lat, targetPos.lng))
        }
      }
    }
  }
  /**
   * 更新UI颜色
   */
  _updateUIColor(){
    this.polyline && this.polyline.setLineColor(this.color)
    this.circleMarker && this.circleMarker.setContent({color:this.color})
    this.text && this.text.setContent({ color: this.color })
  }
  /**
   * 更新或者初始化文本
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateMapText(isJump = false){
    if (!this._checkPosition()){
      this.text && this.text.stopMove()
      console.warn('PlayerTrack-_updateMapText, 参数错误')
      return
    }
    let lat = this.position.lat
    let lng = this.position.lng
    
    if (this.text){
      if(this.isDataUpdate){
        if (isJump){
          this.text.stopMove()
          this.text.setPosition(lat, lng)
          this.isMoveEnd = true
        }
        else {
          if (this.isMoveEnd){
            this.text.stopMove()
            let duration = this._getDuration()
            let targetPos = this.moveAlongPolyline[0]
            if (targetPos && duration > 0){
              // 修复：只移动text，circleMarker通过_updateAnimationMarker同步跟随
              console.log('调用addMoveToAnimation - text', this.sn, this.text, targetPos, duration)
              this.animationLogic.addMoveToAnimation(this.sn, this.text, targetPos, duration)
              
              this.isMoveEnd = false
            }
          }
        }
      }
      if(this.isShowSpeed){
        this.updateOverspeedUI(true)
      }
    }
    else {
      let config = {
        ...OverlayConfig.TextString,
        position: new window.L.latLng(lat, lng),
        color: this.color,
      }
      this.text = new MapText(this.mapboxgl, config, this.sn)
      this.text.setContent({
        size: this.textSize,
        flag: Flags[this.data.country],
        text: this.playerName
      })
      this.text.setOffset()
      this.text.stopMove()
      this.markerCursor && this.text.setCursor(this.markerCursor)
      this.text.click(()=>this._onClickMarker(this.text))
      console.log('_updateMapText 添加动画监听')
      // 修复：通过AnimationLogic添加监听，确保轨迹同步
      this.animationLogic.addListenerMoving(this.sn, this.onMarkerMoving.bind(this))
      this.animationLogic.addListenerMoveend(this.sn, this.onMarkerMoveend.bind(this))
    }
  }
  /**
   * 更新或者初始化圆点标记
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateMarkers(isJump = false){
    if (!this._checkPosition()){
      console.warn('PlayerTrack-_updateMarkers, 参数错误')
      return
    }
    let lat = this.position.lat
    let lng = this.position.lng
    if (this.data.image){
      this._updateIconMarker(lng, lat, isJump)
      if (this.circleMarker){
        this.circleMarker.remove()
        this.circleMarker = null
      }
    }
    else {
      this._updateCircleMarker(lng, lat, isJump)
      if (this.iconMarker){
        this.iconMarker.remove()
        this.iconMarker = null
      }
    }
  }
  _updateCircleMarker(lng, lat, isJump = false){
    if(this.circleMarker){
      if(this.isDataUpdate){
        if (isJump){
          this.circleMarker.setPosition(lat, lng)
        }
        else {
          // 修复：在动画模式下也要更新circleMarker位置
          console.log('PlayerTrack _updateCircleMarker 动画模式', lng, lat)
          this.circleMarker.setPosition(lat, lng)
        }
      }
    }
    else{
      let config = {
        ...OverlayConfig.CircleMarker,
        color: this.color,
        position: new window.L.latLng(lat, lng),
        defaultIconSize: this.defaultIconSize
      }
      this.circleMarker = new MapCircleMarker(this.mapboxgl, config, this.sn)
      this.circleMarker.setContent({ size: this.circleMarkerSize })
      this.markerCursor && this.circleMarker.setCursor(this.markerCursor)
      this.circleMarker.click(()=>this._onClickMarker(this.circleMarker))
    }
  }
  _updateIconMarker(lng, lat, isJump = false){
    if(this.iconMarker){
      if(this.isDataUpdate){
        if (isJump){
          this.iconMarker.setPosition(lat, lng)
        }
        else {
          // 修复：在动画模式下也要更新iconMarker位置
          console.log('PlayerTrack _updateIconMarker 动画模式', lng, lat)
          this.iconMarker.setPosition(lat, lng)
        }
      }
    }
    else{
      let config = {
        ...OverlayConfig.CircleMarkerIcon,
        position: new window.L.latLng(lat, lng),
        defaultIconSize: this.defaultIconSize
      }
      this.iconMarker = new MapMarkerIcon(this.mapboxgl, this.data.image, config, this.sn, 'web')
      this.iconMarker.setContent({ size: this.iconMarkerSize })
      this.markerCursor && this.iconMarker.setCursor(this.markerCursor)
      this.iconMarker.click(()=>this._onClickMarker(this.iconMarker))
    }
  }
  /**
   * 更新动画标记 - 修复：确保标记跟随动画移动
   */
  _updateAnimationMarker(lng, lat){
    console.log('_updateAnimationMarker调用', lng, lat)
    // 更新circleMarker位置 - 这是关键，确保circleMarker跟随text移动
    if (this.circleMarker) {
      this.circleMarker.setPosition(lat, lng)
      console.log('更新circleMarker位置', lat, lng)
    }
    // 更新iconMarker位置
    if (this.iconMarker) {
      this.iconMarker.setPosition(lat, lng)
      console.log('更新iconMarker位置', lat, lng)
    }
  }
  /**
   * 销毁数据
   */
  _destroyData(){
    this.circleMarker = null
    this.iconMarker = null
    this.polyline = null
    this.text = null
    this.endMarker = null
    this.position = {lng: 0, lat: 0, locationTime: 0}  //坐标
    this.historysCount = 0  //轨迹长度
    this.moveAlongPolyline = [] //待移动轨迹数据
    this.moveEndPolylineData = [] //移动结束的轨迹，用来更新轨迹用
    this.polylinePath = [] //当前轨迹渲染数据
    this.endMarkerMoveArray = [] //折线尾部标记点待移动数组
    this.isDataUpdate = false //坐标是否更新
    this.isMoveEnd = true //是否移动完成
    this.isEndMarkerMoveEnd = true //折线最后标记点是否移动完成
  }
  /**
   * 销毁UI
   */
  _destroyUI(){
    if (this.circleMarker){
      this.circleMarker.remove()
    }
    if (this.iconMarker){
      this.iconMarker.remove()
    }
    if (this.endMarker){
      this.endMarker.stopMove()
      this.endMarker.remove()
    }
    if (this.text){
      this.text.stopMove()
      this.text.remove()
    }
    this._destroyPolyline()
  }
  /**
   * 报警图片点击回调
   */
  _onClickMarker(obj){
    let data = {
      ...this.data,
      state: obj.getAlarmType() || AlarmType.NORMAL
    }
    broadcastCenter.pushEvent('onClickPlayerMarker', data)
  }
}
