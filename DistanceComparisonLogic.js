
import BroadcastCenter from '../../Framework/Broadcast/BroadcastCenter'
import MapPolyline from './Overlay/MapPolyline'
import MapCircleMarker from './Overlay/MapCircleMarker'
import MapText from './Overlay/MapText'
import OverlayConfig from './OverlayConfig'
const broadcastCenter = BroadcastCenter.getInstance()
export default class DistanceComparisonLogic{
  static getInstance(){
    if(!this._instance){
      this._instance = new DistanceComparisonLogic()
    }
    return this._instance
  }
  constructor(){
    this.init()
  }
  init(){
    this.playSecond = 5 //路程播放时间
    this.defaultColor = OverlayConfig.DistanceComparisonColor //默认路径颜色
    this.drawSumCount = 3 //需要重复播放路程对比的次数
    this.hideInterval = [] //播放路程结束淡出隐藏路程定时器
    this.setTimeout = [] //路程对比显示5秒后淡出定时器
    this.polylineMarkerArray = [] //路径起始标记点
    this.polylineArray = [] //路径数组
    this.distanceMarker = [] //路程标记点
    this.drawCount = [] //路程对比绘制次数
    this.selectData = {}
    broadcastCenter.addEventListener(
      "onChangeTrackOptEvent", this._onChangePolylineOpacity.bind(this))
    broadcastCenter.addEventListener(
      "onChangeTrackWidthEvent", this._onChangePolylineWidth.bind(this))
    broadcastCenter.addEventListener(
      "onChangeTrackNameSizeEvent", this._onChangeDistanceSize.bind(this))
  }
  /**
   * 更新路程对比
   * @param  {[Object]} aMap        [地图对象]
   * @param  {[Object]} data        [路程对比数据]
   */
  updateDistanceComparison(aMap, data){
    if(!aMap || !data){
      return
    }
    //重置路程对比数据
    this._clearTimeout()
    this._stopHideInterval()
    this._removePolylineMarker(aMap)
    this._removePolyline(aMap)
    this._removeDistanceMarker(aMap)
    this.drawCount = []
    this.selectData = {}
    //更新显示路程对比
    if(Number(data.id) >= 0){
      let distanceData = this._setDistanceData(data)
      let info = distanceData.transformInfo
      this.selectData = distanceData
      for (let i = 0; i < info.length; i++) {
        this.drawCount[i] = 1
        this._startDistanceInterval(aMap, info, i)
      }
    }
  }
  /**
   * 初始化设置路程对比数据
   */
  _setDistanceData(data){
    let ret = {}
    let maxPathLen = 0
    if(data.info && data.info.length > 0){
      for (let i = 0; i < data.info.length; i++) {
        let info = data.info[i]
        let content = JSON.parse(info.content)
        if(maxPathLen < content.length){
          maxPathLen = content.length
        }
      }
      let transformInfo = []
      for (let i = 0; i < data.info.length; i++) {
        let info = data.info[i]
        let path = []
        let content = JSON.parse(info.content)
        let addPointCount = maxPathLen - content.length
        // let loopCount = Math.ceil(addPointCount / content.length)
        for (let j = 0; j < content.length; j++) {
          let position = content[j].split(",")
          path.push(new window.AMap.LngLat(position[1], position[0]))
          if(j < addPointCount){
            let posLng = Number(position[1])
            let posLat = Number(position[0])
            // for (let k = 0; k < loopCount; k++) {
              posLng -= 0.000001
              let lnglat = new window.AMap.LngLat(posLng, posLat)
              // if(j < Number(addPointCount % content.length)){
                path.push(lnglat)
              // }
              // else{
              //   if(k < loopCount - 1){
              //     path.push(lnglat)
              //   }
              // }
            // }
          }
        }
        transformInfo.push({
          ...info,
          path: path
        })
      }
      ret = {
        ...data,
        transformInfo: transformInfo
      }
    }
    return ret
  }
  /**
   * 播放路线
   * @param  {[Object]} aMap  [地图对象]
   * @param  {[Object]} item  [一条路径数据]
   * @param  {[Number]} index [路径数组下标]
   */
  _startDistanceInterval(aMap, data, index){
    let item = data[index]
    this._clearTimeoutItem(index)
    this._stopHideIntervalItem(index)
    //创建更新路程线段
    if(!this.polylineArray[index]){
      let color = item.color || this.defaultColor
      let config = {
        ...OverlayConfig.DistanceComparisonPolyline,
        strokeColor: color,
        path:[item.path[0]],
      }
      if(this.polylineStrokeOpacity){
        config.strokeOpacity = this.polylineStrokeOpacity
      }
      if(this.polylineStrokeWeight){
        config.strokeWeight = this.polylineStrokeWeight
      }
      this.polylineArray[index] = new MapPolyline(aMap, config)
    }
    else{
      this.polylineArray[index].setPath([item.path[0]])
      let opacity = this.polylineStrokeOpacity || 0.8
      this.polylineArray[index].setOptions({strokeOpacity: opacity})
    }
    //创建更新路程线段起始标记点
    if(!this.polylineMarkerArray[index]){
      this.polylineMarkerArray[index] = new MapCircleMarker(aMap, {
        ...OverlayConfig.DistanceComparisonPolylineMarker,
        position:item.path[0],
      })
      window.AMap.event.addListener(
        this.polylineMarkerArray[index].getRoot(),
        'moving', (e)=>this.onMarkerMoving(e, aMap, data, index))
      window.AMap.event.addListener(
        this.polylineMarkerArray[index].getRoot(),
        'moveend', (e)=>this.onMarkerMoveend(e, aMap, data, index))
      window.AMap.event.addListener(
        this.polylineMarkerArray[index].getRoot(),
        'movealong', (e)=>this.onMarkerMovealong(e, aMap, data, index))
    }
    else{
      this.polylineMarkerArray[index].stopMove()
      this.polylineMarkerArray[index].setPosition(item.path[0].lng, item.path[0].lat)
    }
    //动画移动
    let distance = window.AMap.GeometryUtil.distanceOfLine(item.path)
    let speed = Number((distance / this.playSecond) * (60 * 60 / 1000))
    this.polylineMarkerArray[index].moveAlong(item.path, speed)
  }
  onMarkerMoving(e, aMap, data, index){
    this.polylineArray[index].setPath(e.passedPath)
  }
  onMarkerMoveend(e, aMap, data, index){}
  onMarkerMovealong(e, aMap, data, index){
    for (let i = 0; i < data.length; i++) {
      let markerItem = data[i]
      if(this.polylineMarkerArray[i]){
        this.polylineMarkerArray[i].stopMove()
        this.polylineMarkerArray[i].setPosition(markerItem.path[0].lng, markerItem.path[0].lat)
      }
      if(this.polylineArray[i]){
        let opacity = this.polylineStrokeOpacity || 0.8
        this.polylineArray[i].setOptions({strokeOpacity: opacity})
        this.polylineArray[i].setPath(markerItem.path)
      }
      //显示路程标记，清除定时器
      this._showDistance(aMap, markerItem, i)
      // 5秒后淡出隐藏路线对比
      if(this.selectData.id === markerItem.comparison_id){
        this._clearTimeoutItem(i)
        this.setTimeout[i] = setTimeout(()=>{
          this._loopShowDistanceComparison(aMap, data, i)
        },5000)
      }
      else{
        this.polylineMarkerArray[i] && this.polylineMarkerArray[i].stopMove()
        this._clearTimeoutItem(i)
      }
    }
  }
  /**
   * 重复播放路线
   * @param  {[Object]} aMap  [地图对象]
   * @param  {[Object]} item  [一条路径数据]
   * @param  {[Number]} index [路径数组下标]
   */
  _loopShowDistanceComparison(aMap, data, index){
    if(this.drawCount[index] >= this.drawSumCount){
      this.drawCount[index] = 0
      return
    }
    let opacity = this.polylineStrokeOpacity || 0.8
    this._stopHideIntervalItem(index)
    this.hideInterval[index] = setInterval(()=>{
      opacity = opacity - 0.1
      opacity = opacity.toFixed(1)
      if(opacity <= 0){
        opacity = 0
        this._stopHideIntervalItem(index)
        this.drawCount[index] ++
      }
      this.polylineArray[index]
        && this.polylineArray[index].setOptions({strokeOpacity: opacity})
      if(this.distanceMarker[index]){
        let text = data[index].length + 'm'
        if(data[index].height_diff !== null){
          text += ' / +' + data[index].height_diff + 'm'
        }
        this.distanceMarker[index].setOpacity(text, opacity)
      }
      if(opacity <= 0 && this.drawCount[index] <= this.drawSumCount){
        this._startDistanceInterval(aMap, data, index)
      }
    },200)
  }
  /**
   * 显示路程和爬高量
   * @param  {[Object]} aMap  [地图对象]
   * @param  {[Object]} item  [一条路径数据]
   * @param  {[Number]} index [路径数组下标]
   */
  _showDistance(aMap, data, index){
    if(Number(data.latitude) <= 0 ||
       Number(data.longitude) <= 0 ||
       Number(data.length) <= 0 ){
         this.distanceMarker[index] = null
         return
    }
    if(!this.distanceMarker[index]){
      let color = data.color || this.defaultColor
      this.distanceMarker[index] = new MapText(aMap, {
        ...OverlayConfig.DistanceComparisonMarker,
        position: new window.AMap.LngLat(data.longitude, data.latitude),
        color: color
      })
      this.distanceSize && this.distanceMarker[index].setTextSize(this.distanceSize)
      let text = data.length + 'm'
      if(data.height_diff !== null){
        text += ' / +' + data.height_diff + 'm'
      }
      this.distanceMarker[index].setText(text)
    }
    else{
      let text = data.length + 'm'
      if(data.height_diff !== null){
        text += ' / +' + data.height_diff + 'm'
      }
      this.distanceMarker[index].setOpacity(text , 1)
    }
  }
  /**
   * 删除路线标记点
   * @param  {[Object]} aMap [地图对象]
   */
  _removePolylineMarker(aMap){
    if(this.polylineMarkerArray.length <= 0){
      return
    }
    for (let i = 0; i < this.polylineMarkerArray.length; i++) {
      let item = this.polylineMarkerArray[i]
      item && item.stopMove()
      item && aMap.remove(item.getRoot())
      this.polylineMarkerArray[i] = null
    }
    this.polylineMarkerArray = []
  }
  /**
   * 删除路线
   * @param  {[Object]} aMap [地图对象]
   */
  _removePolyline(aMap){
    if(this.polylineArray.length <= 0){
      return
    }
    for (let i = 0; i < this.polylineArray.length; i++) {
      let item = this.polylineArray[i]
      item && aMap.remove(item.getRoot())
      this.polylineArray[i] = null
    }
    this.polylineArray = []
  }
  /**
   * 删除路程标记点
   * @param  {[Object]} aMap [地图对象]
   */
  _removeDistanceMarker(aMap){
    if(this.distanceMarker.length <= 0){
      return
    }
    for (let i = 0; i < this.distanceMarker.length; i++) {
      let item = this.distanceMarker[i]
      item && aMap.remove(item.getRoot())
      this.distanceMarker[i] = null
    }
    this.distanceMarker = []
  }
  /**
   * 停止淡出隐藏路程定时器
   */
  _stopHideInterval(){
    if(this.hideInterval.length > 0){
      for (let i = 0; i < this.hideInterval.length; i++) {
        if(this.hideInterval[i]){
          clearInterval(this.hideInterval[i])
          this.hideInterval[i] = null
        }
      }
      this.hideInterval = []
    }
  }
  /**
   * 停止指定隐藏路程定时器
   * @param  {[Number]} index [路线数组下标]
   */
  _stopHideIntervalItem(index){
    if(this.hideInterval[index]){
      clearInterval(this.hideInterval[index])
      this.hideInterval[index] = null
    }
  }
  /**
   * 清除延迟5秒淡出隐藏路程的setTimeout方法
   */
  _clearTimeout(){
    if(this.setTimeout.length > 0){
      for (let i = 0; i < this.setTimeout.length; i++) {
        if(this.setTimeout[i]){
          clearTimeout(this.setTimeout[i])
          this.setTimeout[i] = null
        }
      }
      this.setTimeout = []
    }
  }
  _clearTimeoutItem(index){
    if(this.setTimeout[index]){
      clearTimeout(this.setTimeout[index])
      this.setTimeout[index] = null
    }
  }
  /**
   * 设置路线透明度
   */
  _onChangePolylineOpacity(data){
    this.polylineStrokeOpacity = Number(data.value/100)
    for (let i = 0; i < this.polylineArray.length; i++) {
      let item = this.polylineArray[i]
      if(item){
        item.setOptions({
          strokeOpacity: this.polylineStrokeOpacity
        })
      }
    }
  }
  /**
   * 设置路线宽度
   */
  _onChangePolylineWidth(data){
    this.polylineStrokeWeight = Number(data.value)
    for (let i = 0; i < this.polylineArray.length; i++) {
      let item = this.polylineArray[i]
      if(item){
        item.setOptions({
          strokeWeight: this.polylineStrokeWeight
        })
      }
    }
  }
  /**
   * 设置路程标记大小
   */
  _onChangeDistanceSize(data){
    this.distanceSize = data.value
    for (let i = 0; i < this.distanceMarker.length; i++) {
      let item = this.distanceMarker[i]
      if(item){
        item.setTextSize(data.value)
        item.setText(item.getTextString())
      }
    }
  }
}
