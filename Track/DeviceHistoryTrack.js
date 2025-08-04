import DeviceTrack from "./DeviceTrack"
import MapText from '../Overlay/MapText'
import MapCircleMarker from '../Overlay/MapCircleMarker'
import OverlayConfig from '../OverlayConfig'
import UICenter from '../../../Framework/UI/UICenter'
const UI = UICenter.getInstance()
export default class DeviceHistoryTrack extends DeviceTrack {
  /**
  * 初始化
  */
  _init(){
    this.circleMarker = null
    this.polyline = null
    this.text = null
    this.markerInfo = null //标记点信息
    this.massMarkerGroup = [] //历史轨迹标记点数组
    this.massHistorysArray = [] //历史轨迹数组
    this.selectedData = {}
    this.color = OverlayConfig.devicesHistoryPolylineColor
  }
  /**
  * 显示轨迹
  */
  _showTrack(){
    this.text && this.text.show()
    this.polyline && this.polyline.show()
    this.markerInfo && this.markerInfo.show()
    this.circleMarker && this.circleMarker.show()
    if(this.massMarkerGroup){
      for (let i = 0; i < this.massMarkerGroup.length; i++) {
        this.massMarkerGroup[i] && this.massMarkerGroup[i].show()
      }
    }
  }
  /**
  * 隐藏轨迹
  */
  _hideTrack(){
    this.text && this.text.hide()
    this.polyline && this.polyline.hide()
    this.markerInfo && this.markerInfo.hide()
    this.circleMarker && this.circleMarker.hide()
    if(this.massMarkerGroup){
      for (let i = 0; i < this.massMarkerGroup.length; i++) {
        this.massMarkerGroup[i] && this.massMarkerGroup[i].hide()
      }
    }
  }
  /**
  * 更新UI
  * @param  {Boolean} [isJump=false] [是否使用跳点方式]
  */
  _updateUI(isJump = false){
    this._updateMapText(isJump)
    this._updatePolyline(isJump)
    this._updateCircleMarkers(isJump)
    this._updateMapMassHistory()
    this._updateMapMarkerInfo()
    this.isDataUpdate = false
  }
  /**
  * 更新或者初始化标记点信息
  */
  _updateMapMarkerInfo(){
    if (!this.markerInfo){
      let config = {
        ...OverlayConfig.TextString,
        zIndex: OverlayConfig.maxzIndex
      }
      this.markerInfo = new MapText(this.aMap, config, this.sn)
      this.markerInfo.hide()
    }
    else{
      if(this.selectedData.index &&
        (this.selectedData.index > this.data.historys.length - 1)){
        this._closeMarkerInfo(this.selectedData)
      }
    }
  }
  /**
  * 更新或者初始化圆点标记
  * @param  {Boolean} [isJump=false] [是否使用跳点方式]
  */
  _updateCircleMarkers(isJump = false){
    if (!this._checkPosition()){
      this.circleMarker && this.circleMarker.stopMove()
      console.warn('PlayerTrack-_updateCircleMarkers, 参数错误')
      return
    }
    let lat = this.position.lat
    let lng = this.position.lng
    this._updateCircleMarker(lng, lat, isJump)
  }
  _updateCircleMarker(lng, lat, isJump = false){
    if(this.circleMarker){
      if(this.isDataUpdate && isJump){
        this.circleMarker.setPosition(lng, lat)
      }
    }
    else{
      this.circleMarker = new MapCircleMarker(this.aMap, {
        position: new window.AMap.LngLat(lng, lat)}, this.sn)
      this.circleMarker.stopMove()
      window.AMap.event.addListener(
        this.circleMarker.getRoot(), 'click', ()=>this._onClickMarker(this.circleMarker))
    }
  }
  /**
  * 历史地位标记点
  */
  _updateMapMassHistory(){
    let historys = this.data.historys
    let historysLength = historys.length
    let addCount = this.addCount
    if (!historys || historysLength <= 0){
      return
    }
    if (addCount > 0){
      //如果有新增
      for (let i = historysLength - addCount ; i < historysLength; ++i){
        let prePos = this.massHistorysArray[this.massHistorysArray.length - 1]
        if (this.massLastPos && this.massLastPos.lng === historys[i].lng &&
          this.massLastPos.lat === historys[i].lat &&
          this.massLastPos.locationTime === historys[i].locationTime){
          this.massMarkerGroup.push(undefined)
          continue
        }
        if (prePos && prePos.lng === historys[i].lng &&
          prePos.lat === historys[i].lat &&
          prePos.locationTime === historys[i].locationTime){
          this.massMarkerGroup.push(undefined)
          continue
        }
        let marker = new MapCircleMarker(this.aMap, {
          position: new window.AMap.LngLat(historys[i].lng, historys[i].lat)
        }, this.sn)
        let selectedData = { ...historys[i], index: i }
        window.AMap.event.addListener(
          marker.getRoot(), 'click', ()=>this._onClickMarker(marker, selectedData))
        this.massMarkerGroup.push(marker)
        this.massHistorysArray.push(historys[i])
      }
      this.massLastPos = this.massHistorysArray[this.massHistorysArray.length - 1]
    }
    else if(addCount < 0) {
      //如果有减少
      let spliceCount = 0
      let spliceMass = []
      for(let i = historysLength; i < historysLength + Math.abs(addCount); ++i){
        spliceCount += 1
        if(this.massMarkerGroup[i]){
          spliceMass.push(this.massMarkerGroup[i].getRoot())
        }
      }
      this.aMap.remove(spliceMass)
      this.massMarkerGroup.splice(historysLength, spliceCount)
      this.massHistorysArray.splice(historysLength, spliceCount)
      this.massLastPos = this.massHistorysArray[this.massHistorysArray.length - 1]
    }
  }
  /**
  * 销毁数据
  */
  _destroyData(){
    this.circleMarker = null
    this.polyline = null
    this.text = null
    this.markerInfo = null
    this.massMarkerGroup = [] //历史轨迹标记点数组
    this.position = {lng: 0, lat: 0, locationTime: 0}  //坐标
    this.historysCount = 0  //轨迹长度
    this.massHistorysArray = [] //历史轨迹数组
    this.polylinePath = [] //当前轨迹渲染数据
    this.isDataUpdate = false //坐标是否更新
  }
  /**
  * 销毁UI
  */
  _destroyUI(){
    if (this.circleMarker){
      this.aMap.remove(this.circleMarker.getRoot())
    }
    if (this.text){
      this.aMap.remove(this.text.getRoot())
    }
    this.markerInfo && this.aMap.remove(this.markerInfo.getRoot())
    this._destroyMassMarkerGroup()
    this._destroyPolyline()
  }
  /**
  * 销毁历史轨迹标记点数组
  */
  _destroyMassMarkerGroup(){
    let destroyMassMarkerGroup = []
    for (let i = 0; i < this.massMarkerGroup.length; i++) {
      let item = this.massMarkerGroup[i]
      item && destroyMassMarkerGroup.push(item.getRoot())
    }
    this.aMap.remove(destroyMassMarkerGroup)
  }
  /**
  * 设置标记点this.text的内容，text不显示
  */
  _onUpdateMarkersUI(data){
    if(this.text){
      this.text.hide()
    }
  }
  /**
  * 设备标记点击回调
  */
  _onClickMarker(obj, data){
    let selectedData = data
    if(!data){
      let historys = this.data.historys
      selectedData = historys[historys.length - 1]
      selectedData.index = historys.length - 1
    }
    this.selectedData = selectedData
    if(this.markerInfo){
      let title = UI.GT('DeviceInfoTitle')
      this.markerInfo.setHistorySelectedText({
        content: this.sn,
        locationTime: title.locationTime + selectedData.locationTime,
        lnglat: title.lat + selectedData.lat + title.lng + selectedData.lng
      })
      this.markerInfo.setOffset(0, -140)
      this.markerInfo.setPosition(selectedData.lng, selectedData.lat)
      this.markerInfo.show()
    }
    for (let i = 0; i < this.massMarkerGroup.length; i++) {
      let zIndex = OverlayConfig.CircleMarker.zIndex
      if(i === selectedData.index){
        zIndex = OverlayConfig.maxzIndex
      }
      if(this.massMarkerGroup[i]){
        this.massMarkerGroup[i].setzIndex(zIndex)
      }
    }
    if(document.getElementById('historySelectedContent')){
      document.getElementById('historySelectedContent').onclick = ()=>this._closeMarkerInfo(selectedData)
    }
  }
  /**
  * 关闭标记点信息
  */
  _closeMarkerInfo(data){
    this.markerInfo && this.markerInfo.hide()
    this.massMarkerGroup[data.index] &&
    this.massMarkerGroup[data.index].setzIndex(OverlayConfig.CircleMarker.zIndex)
  }
}
