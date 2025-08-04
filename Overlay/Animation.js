export default class Animation {
  constructor(){
    this.animation = null
    this.moveendCallback = null
    this.movingCallback = null
    this.movealongCallback = null
  }
  /**
   * 标记点移动到目标点
   * @param  {[object]} marker   [标记点对象]
   * @param  {[object]} target   [目标点]
   * @param  {[number]} duration [移动时间]
   */
  markerMoveTo(marker, target, duration){
    console.log('markerMoveTo------------')
    if(!marker || !target || !duration){
      console.warn('AnimationLogic-markerMoveTo 参数错误')
      return
    }
    let path = []
    path[0] = marker.getLatLng()
    path.push(target)
    let points = this._getPoints(path)
    let times = [duration * 1000] // 转为毫秒
    this._markerMove(marker, points, times)
  }
  /**
   * 标记点在线段上移动
   * @param  {[object]} marker   [标记点对象]
   * @param  {[array]}  path     [线段数组]
   * @param  {[number]} duration [移动时间]
   */
  markerMoveAlong(marker, path, duration){
    console.log('markerMoveAlong______________')
    if(!marker || !path || !duration){
      console.warn('AnimationLogic-markerMoveAlong 参数错误')
      return
    }
    let points = this._getPoints(path)
    let totalDistance = this._getTotalDistance(path)
    let times = this._getTimes(path, totalDistance, duration * 1000)
    this._markerMove(marker, points, times)
  }
  /**
   * 停止动画
   */
  markerStop(){
    this._markerStop()
  }
  /**
   * 设置两点移动结束回调
   */
  initMoveendCallback(callback){
    this.moveendCallback = callback
  }
  /**
   * 设置两点移动中回调
   */
  initMovingCallback(callback){
    this.movingCallback = callback
  }
  /**
   * 设置线段移动结束回调
   */
  initMovealongCallback(callback){
    this.movealongCallback = callback
  }
  /**
   * 标记点移动动画
   * @param  {[object]} marker   [标记点对象]
   * @param  {[array]}  points   [运动线段]
   * @param  {[array]}  times    [时间数组]
   */
  _markerMove(marker, points, times){
    console.log('_markerMove___________________')
    let start = null
    let time = times[0]
    let i = 0
    function resetPoint(timeStamp){
      if(!start) {
        start = timeStamp
      }
      let remaining = timeStamp - start
      if(i >= points.length - 1){
        this._markerStop()
        marker.setLatLng(points[i])
        let finalPoint = points[i]
        this.movealongCallback && this.movealongCallback({ passedPath: [{lng: finalPoint.lng, lat: finalPoint.lat}] })
        return
      }
      if(remaining >= time){
        i++
        time = times[i]
        start = 0
        marker.setLatLng(points[i])
        let point = points[i]
        this.moveendCallback && this.moveendCallback({ passedPath: [{lng: point.lng, lat: point.lat}] })
      }
      else{
        let percentDone  = remaining / time
        let p1 = points[i]
        let p2 = points[i + 1]
        let x1 = p1.lng
        let y1 = p1.lat
        let x2 = p2.lng
        let y2 = p2.lat
        let dx = x2 - x1
        let dy = y2 - y1
        let lnglat = new window.L.latLng(y1 + dy * percentDone, x1 + dx * percentDone)
        marker.setLatLng(lnglat)
        this.movingCallback && this.movingCallback({ passedPath: [{lng: lnglat.lng, lat: lnglat.lat}] })
        this.animation = this._requestAniFrame()(resetPoint.bind(this))
      }
    }
    this._markerStop()
    this.animation = this._requestAniFrame()(resetPoint.bind(this))
  }
  /**
   * 停止标记点动画
   */
  _markerStop(){
    if(this.animation){
      this._cancelAnimation()(this.animation)
      this.animation = null
    }
  }

  /**
   * 调起动画
   */
  _requestAniFrame(){
    return  window.requestAnimationFrame ||
        // Older versions Chrome/Webkit
        window.webkitRequestAnimationFrame ||
        // Firefox < 23
        window.mozRequestAnimationFrame ||
        // opera
        window.oRequestAnimationFrame ||
        // ie
        window.msRequestAnimationFrame
  }
  /**
   * 停止动画
   */
  _cancelAnimation(){
    return  window.cancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.cancelRequestAnimationFrame
  }


  /**
   * 点转换成mapbox的lnglat格式
   * @param  {[array]} data [线段数组]
   */
  _getPoints(data){
    let points = []
    for (let i = 0; i < data.length; i++) {
      let x = data[i].lng || data[i].lon || data[i].longitude // 经度
      let y = data[i].lat || data[i].latitude // 纬度
      points[i] = new window.L.latLng(y, x)
    }
    return points
  }
  /**
   * 获取线段总距离
   * @param  {[array]} data [线段数组]
   */
  _getTotalDistance(data){
    let distance = 0
    for (let i = 1; i < data.length; i++) {
      let p1 = data[i - 1]
      let p2 = data[i]
      let x1 = p1.lng || p1.lon || p1.longitude
      let y1 = p1.lat || p1.latitude
      let x2 = p2.lng || p2.lon || p2.longitude
      let y2 = p2.lat || p2.latitude
      let dx = Math.abs(x2 - x1)
      let dy = Math.abs(y2 - y1)
      distance +=  Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
    }
    return distance
  }
  /**
   * 获取线段每两点的移动时间数组
   * @param  {[array]}  data          [线段数组]
   * @param  {[number]} totalDistance [总距离]
   * @param  {[number]} duration      [总时间]
   */
  _getTimes(data, totalDistance, duration){
    let times = []
    for (let i = 1; i < data.length; i++) {
      let p1 = data[i - 1]
      let p2 = data[i]
      let x1 = p1.lng || p1.lon || p1.longitude
      let y1 = p1.lat || p1.latitude
      let x2 = p2.lng || p2.lon || p2.longitude
      let y2 = p2.lat || p2.latitude
      let dx = Math.abs(x2 - x1)
      let dy = Math.abs(y2 - y1)
      let distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
      times[i - 1] = Math.floor(duration * (distance / totalDistance))
    }
    return times
  }
}
