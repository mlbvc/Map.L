export default class AnimationLogic {
  static getInstance() {
    if (!this._instance) {
      this._instance = new AnimationLogic()
    }
    return this._instance
  }

  constructor(){
    this.dataPool = []
    this.animationFrame = null
    this.movingCallback = {}
    this.moveendCallback = {}
    this.movealongCallback = {}
    this.isUpdateAnimation = true
    this.pausedTime = {}
    this.moveMutiple = 1
    this.isRunning = false
  }
  startAnimation(){
    if (this.isRunning) return
    this.isRunning = true
    
    const animate = (timeStamp) => {
      if (!this.isRunning) return
      
      for (let i = this.dataPool.length - 1; i >= 0; i--) {
        const item = this.dataPool[i]
        if (!item) continue
        
        if (!this.isUpdateAnimation) {
          // 暂停状态，记录暂停时间
          if (!this.pausedTime[item.id]) {
            this.pausedTime[item.id] = timeStamp
          }
          continue
        }
        
        // 恢复播放时，调整开始时间
        if (this.pausedTime[item.id]) {
          const pauseDuration = timeStamp - this.pausedTime[item.id]
          item.startTime += pauseDuration
          delete this.pausedTime[item.id]
        }
        
        // 检查是否到达终点
        if (item.index >= item.points.length - 1) {
          const moveend = this.moveendCallback[item.id]
          const movealong = this.movealongCallback[item.id]
          const finalPoint = item.points[item.points.length - 1]
          
          // 设置最终位置
          if (item.marker.setLatLng) {
            item.marker.setLatLng([finalPoint.lat, finalPoint.lng])
          } else if (item.marker.setPosition) {
            item.marker.setPosition(finalPoint.lat, finalPoint.lng)
          }
          
          // 触发回调
          moveend && moveend({ passedPath: [finalPoint] })
          movealong && movealong({ passedPath: [finalPoint] })
          
          this.dataPool.splice(i, 1)
          continue
        }
        
        const segmentDuration = item.times[item.index] / this.moveMutiple
        const elapsed = timeStamp - item.startTime
        
        if (elapsed >= segmentDuration) {
          // 移动到下一个点
          item.index++
          item.startTime = timeStamp
          
          const moveend = this.moveendCallback[item.id]
          if (item.index < item.points.length) {
            const currentPoint = item.points[item.index]
            moveend && moveend({ passedPath: [currentPoint] })
            
            // 设置标记位置
            if (item.marker.setLatLng) {
              item.marker.setLatLng([currentPoint.lat, currentPoint.lng])
            } else if (item.marker.setPosition) {
              item.marker.setPosition(currentPoint.lat, currentPoint.lng)
            }
          }
        } else {
          // 插值计算当前位置
          const progress = elapsed / segmentDuration
          const p1 = item.points[item.index]
          const p2 = item.points[item.index + 1]
          
          if (p1 && p2) {
            const lat = p1.lat + (p2.lat - p1.lat) * progress
            const lng = p1.lng + (p2.lng - p1.lng) * progress
            
            const moving = this.movingCallback[item.id]
            moving && moving({ passedPath: [{lng: lng, lat: lat}] })
            
            // 设置标记位置
            if (item.marker.setLatLng) {
              item.marker.setLatLng([lat, lng])
            } else if (item.marker.setPosition) {
              item.marker.setPosition(lat, lng)
            }
          }
        }
      }
      
      if (this.isRunning && this.dataPool.length > 0) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.isRunning = false
      }
    }
    
    this.animationFrame = requestAnimationFrame(animate)
  }
  stopAnimation(){
    console.log('暂停============================')
    if(this.animationFrame){
      this._cancelAnimation()(this.animationFrame)
      this.animationFrame = null
    }
  }
  addMoveToAnimation(id, marker, target, duration){
    console.log('addMoveToAnimation移动', id, marker)
    console.log('target', target)
    console.log('duration', duration)
    if(!id || !marker || !target || !duration){
      console.warn('AnimationLogic-addMoveToAnimation 参数错误')
      return
    }
    
    // 回滚：使用原来的逻辑，但修复数据格式
    let path = []
    path[0] = marker.getPosition()
    path.push(target)
    console.log('path', path)
    let points = this._getPoints(path)
    let times = [duration * 1000] // 转为毫秒
    this.dataPool.push({
      id: id,
      marker: marker,
      points: points,
      times: times,
      startTime: performance.now(),
      index: 0
    })
    console.log('AnimationLogic dataPool:', this.dataPool)
    // 启动动画循环
    if (!this.isRunning) {
      this.startAnimation()
    }
  }
  addMoveAlongAnimation(id, marker, path, duration){
    console.log('addMoveAlongAnimation移动中')
    if(!id || !marker || !path || !duration){
      console.warn('AnimationLogic-addMoveAlongAnimation 参数错误')
      return
    }
    let points = this._getPoints(path)
    let totalDistance = this._getTotalDistance(path)
    let times = this._getTimes(path, totalDistance, duration * 1000)
    this.dataPool.push({
      id: id,
      marker: marker,
      points: points,
      times: times,
      startTime: performance.now(),
      index: 0
    })
    console.log(this.dataPool)
  }
  addListenerMoving(id, callback){
    console.log('调用addListenerMoving', id, callback)
    this.movingCallback[id] = callback
  }
  addListenerMoveend(id, callback){
    console.log('调用addListenerMoveend', id, callback)
    this.moveendCallback[id] = callback
  }
  addListenerMovealong(id, callback){
    this.movealongCallback[id] = callback
  }
  setMoveMutiple(data){
    this.moveMutiple = data.mutiple || this.moveMutiple
  }
  setAnimationUpdateState(isUpdate){
    this.isUpdateAnimation = isUpdate
  }
  getAnimationUpdateState(){
    return this.isUpdateAnimation
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
      let x = data[i].lng || data[i].lon || data[i].longitude || data[i][0]
      let y = data[i].lat || data[i].latitude || data[i][1]
      points[i] = {lng: x, lat: y}
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
