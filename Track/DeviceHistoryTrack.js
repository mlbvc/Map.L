import DeviceTrack from "./DeviceTrack"
 import MapText from '../Overlay/MapText'
 import MapCircleMarker from '../Overlay/MapCircleMarker'
 import OverlayConfig from '../OverlayConfig'
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
       this.markerInfo = new MapText(this.mapboxgl, config, this.sn)
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
         this.circleMarker.setPosition(lat, lng)
       }
     }
     else{
       this.circleMarker = new MapCircleMarker(this.mapboxgl, {
         position: new window.L.latLng(lat, lng)
       }, this.sn)
       this.circleMarker.stopMove()
       this.circleMarker.click(()=>this._onClickMarker(this.circleMarker))
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
         let marker = new MapCircleMarker(this.mapboxgl, {
           position: new window.L.latLng(historys[i].lat, historys[i].lng)
         }, 'device_history_marker' + i)
         let selectedData = { ...historys[i], index: i }
         marker.click(()=>this._onClickMarker(marker, selectedData))
         this.massMarkerGroup.push(marker)
         this.massHistorysArray.push(historys[i])
       }
       this.massLastPos = this.massHistorysArray[this.massHistorysArray.length - 1]
     }
     else if(addCount < 0) {
       //如果有减少
       let spliceCount = 0
       for(let i = historysLength; i < historysLength + Math.abs(addCount); ++i){
         spliceCount += 1
         if(this.massMarkerGroup[i]){
           this.massMarkerGroup[i].remove()
         }
       }
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
       this.circleMarker.remove()
     }
     if (this.text){
       this.mapboxgl.remove(this.text.getRoot())
     }
     this.markerInfo && this.markerInfo.remove()
     this._destroyMassMarkerGroup()
     this._destroyPolyline()
   }
   /**
    * 销毁历史轨迹标记点数组
    */
   _destroyMassMarkerGroup(){
     for (let i = 0; i < this.massMarkerGroup.length; i++) {
       let item = this.massMarkerGroup[i]
       item && item.remove()
     }
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
       this.markerInfo.setSelectedContent({
         title: this.sn,
         time: "定位时间：" + selectedData.locationTime,
         lnglat: "纬度：" + selectedData.lat + "，经度：" + selectedData.lng
       })
       this.markerInfo.setOffset(0, -140)
       this.markerInfo.setPosition(selectedData.lat, selectedData.lng)
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
     if(document.getElementById('selectedContent')){
       document.getElementById('selectedContent').onclick = ()=>this._closeMarkerInfo(selectedData)
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
