import BaseTrack from "./BaseTrack"
 import MapText from '../Overlay/MapText'
 import MapCircleMarker from '../Overlay/MapCircleMarker'
 import OverlayConfig from '../OverlayConfig'
 import ColorCenter from '../Color/ColorCenter'
 import BroadcastCenter from '../../../Framework/Broadcast/BroadcastCenter'
 const broadcastCenter = BroadcastCenter.getInstance()
 const colorCenter = ColorCenter.getInstance()
 export default class DeviceTrack extends BaseTrack {
   /**
    * 初始化
    */
   _init(){
     this.circleMarker = null
     this.text = null
     this.color = colorCenter.getColor()
     this.onlineStateColor = this.data.isOnline? this.color : OverlayConfig.offlineMarkerColor
     this.isOnline = this.data.isOnline
     this.isSelectedDeivce = false
   }
   /**
    * 显示轨迹
    */
   _showTrack(){
     this.text && this.text.show()
     this.circleMarker && this.circleMarker.show()
   }
   /**
    * 隐藏轨迹
    */
   _hideTrack(){
     this.text && this.text.hide()
     this.circleMarker && this.circleMarker.hide()
   }
   /**
    * 更新UI
    * @param  {Boolean} [isJump=false] [是否使用跳点方式]
    */
   _updateUI(isJump = false){
     this._updateMapText(isJump)
     this._updateCircleMarkers(isJump)
     this._updateUIColor()
     this.isDataUpdate = false
   }
   _updateUIColor(){
     if(this.isOnline === this.data.isOnline){
       return
     }
     let color = this.color
     if(!this.data.isOnline){
       color = OverlayConfig.offlineMarkerColor
     }
     this.onlineStateColor = color
     this.isOnline = this.data.isOnline
     if(!this.isSelectedDeivce){
        this.text && this.text.setContent({ color: color })
     }
     this.circleMarker && this.circleMarker.setContent({color:color})
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
       if(this.isDataUpdate && isJump){
         this.text.setPosition(lat, lng)
         this._onUpdateMarkersUI()
       }
     }
     else {
       let config = {
         ...OverlayConfig.TextString,
         position: new window.L.latLng(lat, lng),
         color: this.onlineStateColor,
       }
       this.text = new MapText(this.mapboxgl, config, this.sn)
       this._onUpdateMarkersUI()
       this.text.stopMove()
       this.text.click(()=>this._onClickMarker(this.text))
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
       let config = {
         ...OverlayConfig.CircleMarker,
         position: new window.L.lat(lat, lng),
         color: this.onlineStateColor
       }
       this.circleMarker = new MapCircleMarker(this.mapboxgl, config, this.sn)
       this.circleMarker.setContent()
       this.circleMarker.stopMove()
       this.circleMarker.click(()=>this._onClickMarker(this.circleMarker))
     }
   }
   /**
    * 销毁数据
    */
   _destroyData(){
     this.circleMarker = null
     this.text = null
     this.position = {lng: 0, lat: 0, locationTime: 0}  //坐标
     this.historysCount = 0  //轨迹长度
     this.isDataUpdate = false //坐标是否更新
     this.isSelectedDeivce = false
   }
   /**
    * 销毁UI
    */
   _destroyUI(){
     if (this.circleMarker){
       this.circleMarker.remove()
     }
     this.text && this.text.remove()
     this._destroyPolyline()
   }
   /**
    * 设备标记点击回调
    */
   _onClickMarker(obj){
     if(this.isSelectedDeivce){
       return
     }
     let data = {
       ...this.data
     }
     broadcastCenter.pushEvent('onClickDeviceMarker', data)
   }
   /**
    * 更新选中标记点UI
    */
   updateDeviceTrackUI(data){
     if(!data){
       this.isSelectedDeivce = false
       this._reSetDeviceUI()
       return
     }
     this.isSelectedDeivce = data.sn === this.sn
     this._onUpdateMarkersUI()
     //地图中心移动到选中设备位置
     if(this.isSelectedDeivce){
       let position = data.historys[data.historys.length - 1]
       this.mapboxgl.setCenter([position.lng, position.lat])
     }
   }
   /**
    * 更新选择标记点text的UI
    */
   _onUpdateMarkersUI(){
     if(this.isSelectedDeivce){
       //选中的设备
       let position = this.position
       if(this.text){
         this.text.setSelectedContent({
           title: this.sn,
           time: "定位时间：" + position.locationTime,
           lnglat: "纬度：" + position.lat + "，经度：" + position.lng
         })
         this.text.setOffset(0, -120)
         this.text.setzIndex(OverlayConfig.maxzIndex)
       }
       this.circleMarker && this.circleMarker.setzIndex(OverlayConfig.maxzIndex)
       if(document.getElementById('selectedContent')){
         document.getElementById('selectedContent').onclick = ()=>this._closeMarkerInfo()
       }
       else{
         setTimeout(()=>{
           if(document.getElementById('selectedContent')){
             document.getElementById('selectedContent').onclick = ()=>this._closeMarkerInfo()
           }
         }, 500)
       }
     }
     else{
       this._reSetDeviceUI()
     }
   }
   /**
    * 关闭设备信息
    */
   _closeMarkerInfo(){
     this.isSelectedDeivce = false
     this._reSetDeviceUI()
     broadcastCenter.pushEvent('closeMarkerInfo')
   }
   /**
    * 重置不被选中的标记点UI
    */
   _reSetDeviceUI(){
     if(this.text){
       this.text.setContent({
         text: this.sn,
         color: this.onlineStateColor
       })
       this.text.setOffset()
       this.text.setzIndex(OverlayConfig.TextString.zIndex)
     }
     this.circleMarker && this.circleMarker.setzIndex(OverlayConfig.CircleMarker.zIndex)
   }
 }
