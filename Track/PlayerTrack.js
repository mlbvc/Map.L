
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
      this.textSize && this.text.setTextSize(this.textSize)
      this.text.setText(text)
      this.text.setOffsetInTextLength(text)
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
        this.aMap.setCenter(new window.AMap.LngLat(lng, lat))
        zIndexCircle = OverlayConfig.maxzIndex
        zIndexIcon = OverlayConfig.maxzIndex
        zIndexText = OverlayConfig.maxzIndex
      }
    }
    this.circleMarker && this.circleMarker.setCenterCircle(this.isCenter)
    this.iconMarker && this.iconMarker.setCenterIcon(this.isCenter)
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
        this.polyline.setOptions({
          strokeOpacity: this.polylineStrokeOpacity
        })
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
        this.polyline.setOptions({
          strokeWeight: this.polylineStrokeWeight
        })
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
        this.circleMarker.setCircleMarkerSize(diameter)
        this.circleMarker.setContent()
        this.circleMarker.setOffset()
      }
      if(this.iconMarker){
        this.iconMarker.setIconSize(value)
        this.iconMarker.setContent()
        this.iconMarker.setOffset()
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
      this.text.setFlag(Flags[this.data.country])
      this.text.setText(this.playerName)
      this.text.setOffsetInTextLength(this.playerName)
    }
  }
  /**
   * 更新轨迹运动员姓名大小
   */
  _updateTrackNameSize(value){
    if(value !== this.textSize){
      this.textSize = value
      if(this.text){
        this.text.setTextSize(value)
        this.text.setText(this.playerName)
        this.text.setOffsetInTextLength(this.playerName)
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
      this._updateTrackNameText()
    }
    if(oldData.image !== this.data.image){
      this._updateTrackMarkerIcon()
    }
    if(oldData.fadeOpacit !== this.data.fadeOpacit){
      let value = this.data.fadeOpacit
      this._updateTrackMarkerOpacit(value)
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
      this.iconMarker.setImage(this.data.image)
      this.iconMarker.setContent()
    }
  }
  /**
   * 设置轨迹标记点透明度
   */
  _updateTrackMarkerOpacit(value){
    this.text && this.text.setOpacity(this.playerName, value)
    if(this.iconMarker){
      this.iconMarker.setOpacity(value)
      this.iconMarker.setContent()
    }
    if(this.circleMarker){
      this.circleMarker.setOpacity(value)
      this.circleMarker.setContent()
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
    this.circleMarker && this.circleMarker.stopMove()
    this.iconMarker && this.iconMarker.stopMove()
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
        this.aMap.setCenter(new window.AMap.LngLat(lng, lat))
      }
      else {
        if (this.isMoveEnd){
          let targetPos = this.moveAlongArray[0]
          targetPos && this.aMap.setCenter(targetPos)
        }
      }
    }
  }
  /**
   * 更新UI颜色
   */
  _updateUIColor(){
    this.circleMarker && this.circleMarker.setContent({color:this.color})
    this.polyline && this.polyline.setOptions({strokeColor: this.color})
    this.text && this.text.setText(this.playerName, {color: this.color})
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
          this.text.setPosition(lng, lat)
          this.isMoveEnd = true
        }
        else {
          if (this.isMoveEnd){
            this.text.stopMove()
            let speed = this._getSpeed()
            let targetPos = this.moveAlongArray[0]
            if (targetPos && speed > 0){
              this.text.moveTo(targetPos.lng, targetPos.lat, speed)
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
        position: new window.AMap.LngLat(lng, lat),
        color: this.color,
      }
      this.text = new MapText(this.aMap, config, this.sn)
      this.textSize && this.text.setTextSize(this.textSize)
      this.text.setFlag(Flags[this.data.country])
      this.text.setText(this.playerName)
      this.data.fadeOpacit && this.text.setOpacity(this.playerName, this.data.fadeOpacit)
      this.text.setOffsetInTextLength(this.playerName)
      this.text.stopMove()
      this.markerCursor && this.text.setCursor(this.markerCursor)
      window.AMap.event.addListener(
        this.text.getRoot(), 'click', ()=>this._onClickMarker(this.text))
    }
  }
  /**
   * 更新或者初始化圆点标记
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateMarkers(isJump = false){
    if (!this._checkPosition()){
      this.circleMarker && this.circleMarker.stopMove()
      this.iconMarker && this.iconMarker.stopMove()
      console.warn('PlayerTrack-_updateMarkers, 参数错误')
      return
    }
    let lat = this.position.lat
    let lng = this.position.lng
    if (this.data.image){
      this._updateIconMarker(lng, lat, isJump)
      if (this.circleMarker){
        this.circleMarker.stopMove()
        this.aMap.remove(this.circleMarker.getRoot())
        this.circleMarker = null
      }
    }
    else {
      this._updateCircleMarker(lng, lat, isJump)
      if (this.iconMarker){
        this.iconMarker.stopMove()
        this.aMap.remove(this.iconMarker.getRoot())
        this.iconMarker = null
      }
    }
  }
  _updateCircleMarker(lng, lat, isJump = false){
    if(this.circleMarker){
      if(this.isDataUpdate){
        if (isJump){
          this.circleMarker.stopMove()
          this.circleMarker.setPosition(lng, lat)
          this.isMoveEnd = true
        }
        else {
          if (this.isMoveEnd){
            this.circleMarker.stopMove()
            let speed = this._getSpeed()
            let targetPos = this.moveAlongArray[0]
            if (targetPos && speed > 0){
              this.circleMarker.moveTo(targetPos.lng, targetPos.lat, speed)
              this.isMoveEnd = false
            }
          }
        }
      }
    }
    else{
      let config = {
        ...OverlayConfig.CircleMarker,
        color: this.color,
        position: new window.AMap.LngLat(lng, lat),
        defaultIconSize: this.defaultIconSize
      }
      this.circleMarker = new MapCircleMarker(this.aMap, config, this.sn)
      this.circleMarkerSize && this.circleMarker.setCircleMarkerSize(this.circleMarkerSize)
      this.data.fadeOpacit && this.circleMarker.setOpacity(this.data.fadeOpacit)
      this.circleMarker.setContent()
      this.circleMarker.setOffset()
      this.circleMarker.stopMove()
      this.markerCursor && this.circleMarker.setCursor(this.markerCursor)
      window.AMap.event.addListener(
        this.circleMarker.getRoot(), 'click', ()=>this._onClickMarker(this.circleMarker))
      window.AMap.event.addListener(
        this.circleMarker.getRoot(), 'moving', (e)=>this.onMarkerMoving(e))
      window.AMap.event.addListener(
        this.circleMarker.getRoot(), 'moveend', (e)=>this.onMarkerMoveend(e))
    }
  }
  _updateIconMarker(lng, lat, isJump = false){
    if(this.iconMarker){
      if(this.isDataUpdate){
        if (isJump){
          this.iconMarker.stopMove()
          this.iconMarker.setPosition(lng, lat)
          this.isMoveEnd = true
        }
        else {
          if (this.isMoveEnd){
            this.iconMarker.stopMove()
            let speed = this._getSpeed()
            let targetPos = this.moveAlongArray[0]
            if (targetPos && speed > 0){
              this.iconMarker.moveTo(targetPos.lng, targetPos.lat, speed)
              this.isMoveEnd = false
            }
          }
        }
      }
    }
    else{
      let config = {
        ...OverlayConfig.CircleMarkerIcon,
        position: new window.AMap.LngLat(lng, lat),
        defaultIconSize: this.defaultIconSize
      }
      this.iconMarker = new MapMarkerIcon(this.aMap, this.data.image, config, 'web')
      this.iconMarkerSize && this.iconMarker.setIconSize(this.iconMarkerSize)
      this.data.fadeOpacit && this.iconMarker.setOpacity(this.data.fadeOpacit)
      this.iconMarker.setContent()
      this.iconMarker.setOffset()
      this.iconMarker.stopMove()
      this.markerCursor && this.iconMarker.setCursor(this.markerCursor)
      window.AMap.event.addListener(
        this.iconMarker.getRoot(), 'click', ()=>this._onClickMarker(this.iconMarker))
      window.AMap.event.addListener(
        this.iconMarker.getRoot(), 'moving', (e)=>this.onMarkerMoving(e))
      window.AMap.event.addListener(
        this.iconMarker.getRoot(), 'moveend', (e)=>this.onMarkerMoveend(e))
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
    this.moveAlongArray = [] //待移动轨迹
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
      this.circleMarker.stopMove()
      this.aMap.remove(this.circleMarker.getRoot())
    }
    if (this.iconMarker){
      this.iconMarker.stopMove()
      this.aMap.remove(this.iconMarker.getRoot())
    }
    if (this.text){
      this.text.stopMove()
      this.aMap.remove(this.text.getRoot())
    }
    if (this.endMarker){
      this.endMarker.stopMove()
      this.aMap.remove(this.endMarker.getRoot())
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
