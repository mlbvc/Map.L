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
    broadcastCenter.addEventListener(
      'updateWorkerNameText',
      this._updateTrackNameText.bind(this))
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
      this.text.setContent({ text: text })
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
      broadcastCenter.pushEvent('updateWorkerNameText')
    }
  }
  /**
   * 更新标记点名称
   */
  _updateTrackNameText(){
    if(this.text){
      this.text.setContent({ text: this.data.name })
    }
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
      console.warn('WorkerTrack-_updateMarkerIcon, 参数错误')
      return
    }
    let lat = this.position.lat
    let lng = this.position.lng
    if(this.markerIcon){
      if(this.isDataUpdate){
        if (isJump){
          this.markerIcon.setPosition(lat, lng)
        }
      }
    }
    else{
      let config = {
        ...OverlayConfig.CircleMarkerIcon,
        position: new window.L.latLng(lat, lng),
        zIndex: this.zIndex,
        defaultIconSize: this.defaultIconSize
      }
      this.markerIcon = new MapMarkerIcon(this.mapboxgl, 'WORK_ICON', config, this.sn, 'location')
      this.markerIcon.setContent()
      this.markerCursor && this.markerIcon.setCursor(this.markerCursor)
      this.markerIcon.click(()=>this._onClickMarker(this.markerIcon))
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
          this.text.setPosition(lat, lng)
          this.isMoveEnd = true
        }
        else {
          if (this.isMoveEnd){
            this.text.stopMove()
            let duration = this._getDuration()
            let targetPos = this.moveAlongPolyline[0]
            if (targetPos && duration > 0){
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
      this.text.setContent({ text: this.data.name })
      this.text.setOffset()
      this.text.stopMove()
      this.markerCursor && this.text.setCursor(this.markerCursor)
      this.text.click(()=>this._onClickMarker(this.text))
      this.animationLogic.addListenerMoving(this.sn, this.onMarkerMoving.bind(this))
      this.animationLogic.addListenerMoveend(this.sn, this.onMarkerMoveend.bind(this))
    }
  }
  /**
   * 更新动画标记
   */
  _updateAnimationMarker(lng, lat){
    this.markerIcon && this.markerIcon.setPosition(lat, lng)
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
      this.markerIcon.remove()
    }
    if(this.endMarker){
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
