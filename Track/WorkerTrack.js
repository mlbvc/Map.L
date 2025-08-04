import BaseTrack from "./BaseTrack"
import MapMarkerIcon from '../Overlay/MapMarkerIcon'
import MapText from '../Overlay/MapText'
import OverlayConfig from '../OverlayConfig'
import AlarmType from '../../Alarm/AlarmType'
import SetUpType from '../../../Component/SetUp/SetUpType'
import SetUpDefaultConfig from '../../../Component/SetUp/SetUpDefaultConfig'
import BroadcastCenter from '../../../Framework/Broadcast/BroadcastCenter'
const broadcastCenter = BroadcastCenter.getInstance()
export default class WorkerTrack extends BaseTrack {
  /**
   * 初始化
   */
  _init(){
    this.polyline = null
    this.text = null
    this.endMarker = null
    this.markerIcon = null
    this.color = OverlayConfig.WorkerTrack.color
    this.zIndex = OverlayConfig.WorkerTrack.zIndex
    this.trackMemoryTime = SetUpDefaultConfig[this.pageName].workerTracklngValue * 60 * 1000 || OverlayConfig.TrackMemoryTime //显示轨迹时间
    this.isShowAllHistorys = SetUpDefaultConfig[this.pageName].workerIsShoAllTrack //是否显示全部轨迹
  }
  /**
   * 根据设置参数更新工作人员UI
   */
  updateOverlayConfig(data){
    for(let key in data){
      switch (key) {
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
      let text = this.data.name
      if(state){
        text = this.data.name + " " + this.curSpeed + "km/h"
      }
      this.text.setText(text)
      this.text.setOffsetInTextLength(text)
    }
  }
  /**
   * 更新标记点鼠标样式
   */
  _updateMapCursor(value){
    this.markerCursor = value
    this.text && this.text.setCursor(this.markerCursor)
    this.markerIcon && this.markerIcon.setCursor(this.markerCursor)
    this.endMarker && this.endMarker.setCursor(this.markerCursor)
  }
  /**
   * 更新速度显示状态
   */
  _updateShowSpeed(value){
    this.isShowSpeed = value
    this.updateOverspeedUI(value)
  }
  /**
   * 更新运动员标记点文本，图片
   */
  _updateSeverData(oldData){
    if(oldData.name !== this.data.name){
      this._updateTrackNameText()
    }
  }
  /**
   * 更新标记点名称
   */
  _updateTrackNameText(){
    if(this.text){
      this.text.setText(this.data.name)
      this.text.setOffsetInTextLength(this.data.name)
    }
  }
  /**
   * 停止轨迹动画
   */
  _stopMove(){
    this.text && this.text.stopMove()
    this.markerIcon && this.markerIcon.stopMove()
    this.endMarker && this.endMarker.stopMove()
  }
  /**
   * 显示轨迹
   */
  _showTrack(){
    this.text && this.text.show()
    this.polyline && this.polyline.show()
    this.markerIcon && this.markerIcon.show()
    this.endMarker && this.endMarker.show()
  }
  /**
   * 隐藏轨迹
   */
  _hideTrack(){
    this.text && this.text.hide()
    this.polyline && this.polyline.hide()
    this.markerIcon && this.markerIcon.hide()
    this.endMarker && this.endMarker.hide()
  }
  /**
   * 更新UI
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateUI(isJump = false){
    this._updateMapText(isJump)
    this._updatePolyline(isJump)
    this._updateMarkerIcon(isJump)
    this._updateEndMarkerIcon(isJump)
    this.isDataUpdate = false
  }
  /**
   * 更新或者初始化工作人员标记
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateMarkerIcon(isJump = false){
    if(!this._checkPosition()){
      this.markerIcon && this.markerIcon.stopMove()
      console.warn('WorkerTrack-_updateMarkerIcon, 参数错误')
      return
    }
    let lat = this.position.lat
    let lng = this.position.lng
    if(this.markerIcon){
      if(this.isDataUpdate){
        if (isJump){
          this.markerIcon.stopMove()
          this.markerIcon.setPosition(lng, lat)
          this.isMoveEnd = true
        }
        else {
          if (this.isMoveEnd){
            this.markerIcon.stopMove()
            let speed = this._getSpeed()
            let targetPos = this.moveAlongArray[0]
            if (targetPos && speed > 0){
              this.markerIcon.moveTo(targetPos.lng, targetPos.lat, speed)
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
        zIndex: this.zIndex,
        defaultIconSize: this.defaultIconSize
      }
      this.markerIcon = new MapMarkerIcon(this.aMap, 'WORK_ICON', config, 'location')
      this.markerIcon.setContent()
      this.markerIcon.setOffset()
      this.markerIcon.stopMove()
      this.markerCursor && this.markerIcon.setCursor(this.markerCursor)
      window.AMap.event.addListener(
        this.markerIcon.getRoot(), 'click', ()=>this._onClickMarker(this.markerIcon))
      window.AMap.event.addListener(
        this.markerIcon.getRoot(), 'moving', (e)=>this.onMarkerMoving(e))
      window.AMap.event.addListener(
        this.markerIcon.getRoot(), 'moveend', (e)=>this.onMarkerMoveend(e))
    }
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
      this.text.setText(this.data.name)
      this.text.setOffsetInTextLength(this.data.name)
      this.text.stopMove()
      this.markerCursor && this.text.setCursor(this.markerCursor)
      window.AMap.event.addListener(
        this.text.getRoot(), 'click', ()=>this._onClickMarker(this.text))
    }
  }
  /**
   * 销毁数据
   */
  _destroyData(){
    this.markerIcon = null
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
    if (this.markerIcon){
      this.markerIcon.stopMove()
      this.aMap.remove(this.markerIcon.getRoot())
    }
    if (this.text){
      this.text.stopMove()
      this.aMap.remove(this.text.getRoot())
    }
    if(this.endMarker){
      this.endMarker.stopMove()
      this.aMap.remove(this.endMarker.getRoot())
    }
    this._destroyPolyline()
  }
  /**
   * 工作人员点击回调
   */
  _onClickMarker(obj){
    let data = {
      ...this.data,
      state: obj.getAlarmType() || AlarmType.NORMAL
    }
    broadcastCenter.pushEvent('onClickWorkerMarker', data)
  }
}
