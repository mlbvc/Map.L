import MapPolyline from '../Overlay/MapPolyline'
import MapCircleMarker from '../Overlay/MapCircleMarker'
import OverlayConfig from '../OverlayConfig'
import SetUpDefaultConfig from '../../../Component/SetUp/SetUpDefaultConfig'
import BroadcastCenter from '../../../Framework/Broadcast/BroadcastCenter'
import Util from '../../../Common/Utils/Util'
import * as turf from '@turf/turf'

const broadcastCenter = BroadcastCenter.getInstance()
const util = Util.getInstance()
export default class BaseTrack{
  /**
   *  构造函数
   * @param {[mapboxgl]} mapboxgl [地图对象]
   * @param {[Object]} data [轨迹数据]
   */
  constructor(mapboxgl, data, animationLogic){
    this.deletable = false    //删除标记
    this.mapboxgl = mapboxgl          //地图对象
    this.data = data          //轨迹数据
    this.sn = data.sn         //设备号
    this.markerCursor = data.markerCursor || 'pointer' //鼠标选中样式
    this.curTime = new Date() //当前时间
    this.position = {lng: 0, lat: 0, locationTime: 0}  //坐标
    this.color = "#000"
    this.markMoveMutiple = 0 //播放倍率
    this.historysCount = 0  //轨迹长度
    this.moveAlongPolyline = [] //待移动轨迹数据
    this.moveEndPolylineData = [] //移动结束的轨迹，用来更新轨迹用
    this.polylinePath = [] //当前轨迹渲染数据
    this.endMarkerMoveArray = [] //折线尾部标记点待移动数组
    this.isDataUpdate = false //坐标是否更新
    this.isMoveEnd = true //是否移动完成
    this.isEndMarkerMoveEnd = true //折线最后标记点是否移动完成
    this.pageName = data.pageName || "Default" //创建标记点的页面，根据页面设置轨迹长度，是否显示全部轨迹，标记点大小默认值
    this.trackMemoryTime = SetUpDefaultConfig[this.pageName].tracklngValue * 60 * 1000 || OverlayConfig.TrackMemoryTime //显示轨迹时间
    this.isShowAllHistorys = SetUpDefaultConfig[this.pageName].isShoAllTrack //是否显示全部轨迹
    this.defaultIconSize = SetUpDefaultConfig[this.pageName].iconSize //标记点默认大小
    this.isLegsState = data.isLegsState //是否是赛段模式（直播页选中赛段）
    this.curSpeed = 0
    this.isShowSpeed = false // 是否显示速度
    this.animationLogic = animationLogic
    this._init()
    this._updateData(true)
    this._updateUI(true)
  }
  /**
   * 更新数据
   * @param  {[Object]} data [轨迹数据]
   * @param  {[Date]} curTime [当前播放时间]
   */
  updateData(data, curTime, isJump = false){
    if (!data || !curTime){
      console.warn('BaseTrack-updateData, 参数错误')
      return
    }
    //被标记删除情况下，不更新
    if (this.deletable){
      return
    }
    let oldData = util.deepCopy(this.data)
    this.data = util.deepCopy(data)
    this.curTime = curTime
    this.isLegsState = data.isLegsState
    this._updateData(isJump)
    this._updateUI(isJump)
    this._updateSeverData(oldData)
  }
  /**
   * 服务端信息修改，更新标记点文本，图片
   */
  _updateSeverData(oldData){}
  /**
   * 更新标记点名称
   */
  _updateTrackNameText(){}
  /**
   * 更新标记点图片
   */
  _updateTrackMarkerIcon(){}
  /**
   * 追踪运动员
   * @param  {[type]} id [运动员id]
   */
  updateCenterPlayer(id){}
  /**
   * 实时定位更新选中标记点UI
   * @param  {[type]} data [选中设备数据]
   */
  updateDeviceTrackUI(data){}
  /**
   * 更新运动员轨迹显示数据
   * @param  {[type]} data [轨迹配置]
   */
  updateOverlayConfig(data){}
  /**
   * 更新轨迹动画速度
   */
  updateProgressBarMutiple(value){
    this.markMoveMutiple = value
  }
  /**
   * 更新轨迹移动状态
   * @param  {Boolean} [state=true] [状态]
   */
  updateTrackMoveState(state = true){
    this.isMoveEnd = state
  }
  /**
   * 设置删除标志
   * @param {Boolean} [deletable=true] [删除标志]
   */
  setDeletable(deletable = true){
    this.deletable = deletable
  }
  /**
   * 停止轨迹动画
   */
  stopMove(){
    this.isMoveEnd = true
    this.isEndMarkerMoveEnd = true
    this._stopMove()
  }
  /**
   * 显示轨迹
   */
  showTrack(){
    this._showTrack()
  }
  /**
   * 隐藏轨迹
   */
  hideTrack(){
    this._hideTrack()
  }
  /**
   * 停止轨迹动画,子类实现
   */
  _stopMove(){}
  /**
   * 显示轨迹,子类实现
   */
  _showTrack(){}
  /**
   * 隐藏轨迹,子类实现
   */
  _hideTrack(){}
  /**
   * 获得颜色
   * @return {[String]} [颜色]
   */
  getColor(){
    //被标记删除情况下，不返回
    if (this.deletable){
      return
    }
    return this.color
  }
  /**
   * 设置颜色
   * @param {[String]} color [颜色]
   */
  setColor(color){
    if (!color){
      console.warn('BaseTrack-setColor, 参数错误')
      return
    }
    this.color = color
    this._updateUIColor()
  }
  /**
   * 获取坐标
   * @return {[Object]} [坐标]
   */
  getPosition(){
    //被标记删除情况下，不返回
    if (this.deletable){
      return
    }
    return this.position
  }
  /**
   * 获取历史轨迹
   */
  getHistorys(){
    if(this.deletable){
      return
    }
    return this.data.historys
  }
  /**
   * 获取轨迹速度显示状态
   */
  getShowSpeed(){
    return this.isShowSpeed
  }
  /**
   * 获取文本覆盖物对象
   */
  getTextMarker(){
    if(!this.text){
      return
    }
    return this.text
  }
  /**
   * 获取动画轨迹是否移动完成
   */
  getIsMoveEnd(){
    return this.isMoveEnd
  }
  /**
   * 获取删除标记
   */
  getDeletable(){
    return this.deletable
  }
  /**
   * 设置文字层级
   * @param {[Number]} zIndex [层级]
   */
  setTextZIndex(zIndex){
    if (this.text){
      this.text.setzIndex(zIndex)
    }
  }
  /**
   * 设置轨迹报警类型
   * @param {[type]} state [报警类型]
   */
  setAlarmType(state){
    if(this.text){
      this.text.setAlarmType(state)
    }
  }
  /**
   * 更新超速报警标记点UI
   * @param  {[boolen]} state [是否显示速度]
   */
  updateOverspeedUI(state){}
  /**
   * 销毁
   */
  destroy(){
    this._destroyUI()
    this._destroyData()
  }
  /**
   * 标记点动画移动回调
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  onMarkerMoving(e){
    console.log('basetrak -------onMarkerMoving----------------', e.passedPath[0])
    //更新设置报警图标位置
    broadcastCenter.pushEvent('updateAlarmPosition', {
      markerData:this.data,
      passedPath: e.passedPath
    })
    // 修复：在移动过程中更新circleMarker位置，确保同步
    this._updateAnimationMarker(e.passedPath[0].lng, e.passedPath[0].lat)
    
    // 修复：调用_updatePolyline，与MAP版本保持一致
    this._updatePolyline()
  }
  /**
   * 标记点动画节点结束回调
   */
  onMarkerMoveend(e){
    console.log('onMarkerMoveend++++++++++++++++++++++++++++++++++', e.passedPath[0])
    let lastPolylineData = this.moveAlongPolyline[0]
    lastPolylineData && this.moveEndPolylineData.push(lastPolylineData)
    this.popPos = lastPolylineData
    this.moveAlongPolyline.splice(0,1)
    this.isMoveEnd = true
    this.isDataUpdate = true
    // 重新启用这个关键调用！这是circleMarker跟随移动的关键
    this._updateAnimationMarker(e.passedPath[0].lng, e.passedPath[0].lat)
    
    // 修复：移动结束时确保轨迹线包含最新位置
    if (this.polyline && e.passedPath[0]) {
      let currentPos = e.passedPath[0]
      let currentPath = this.polyline.config.path || []
      
      // 确保最后一个点是当前位置
      let lastPoint = currentPath[currentPath.length - 1]
      if (!lastPoint || lastPoint[0] !== currentPos.lat || lastPoint[1] !== currentPos.lng) {
        let newPath = [...currentPath, [currentPos.lat, currentPos.lng]]
        console.log('onMarkerMoveend 确保轨迹完整', newPath.length)
        this.polyline.setPath(newPath)
      }
    }
    
    this._updateUI()
  }
  /**
   * 初始化
   */
  _init(){}
  /**
   * 更新数据
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateData(isJump = false){
    console.log('_updateData data', this.data)
    let data = this.data
    let historys = data.historys
    if (!historys || historys.length <= 0){
      return
    }
    let lng = historys[historys.length - 1].lng
    let lat = historys[historys.length - 1].lat
    let locationTime = historys[historys.length - 1].locationTime
    if(this.position.lat !== lat || this.position.lng !== lng){
      this.isDataUpdate = true
    }
    this.position = {lng:lng, lat: lat, locationTime: locationTime}
    //记录轨迹变化数据
    let historysLength = historys.length
    let addCount = historysLength - this.historysCount
    this.historysCount = historysLength
    this.addCount = addCount
    if (isJump){
      //如果是跳点模式，则初始化数据，并返回
      this.isDataUpdate = true
      this.isMoveEnd = true
      this.isEndMarkerMoveEnd = true
      this.moveAlongPolyline = []
      this.moveEndPolylineData = []
      this.popPos = null
      this.lastPos = null
      this._getJumpSpeed()
      return
    }
    if (addCount > 0){
      //如果有新增
      for (let i = historysLength - addCount - 1 ; i < historysLength; ++i){
        let prePos = this.moveAlongPolyline[this.moveAlongPolyline.length - 1]
        if (this.lastPos && this.lastPos.lng === historys[i].lng &&
           this.lastPos.lat === historys[i].lat &&
           this.lastPos.locationTime === historys[i].locationTime){
          continue
        }
        if (prePos && prePos.lng === historys[i].lng &&
           prePos.lat === historys[i].lat &&
           prePos.locationTime === historys[i].locationTime){
          continue
        }
        this.moveAlongPolyline.push(historys[i])
        console.log('this.moveAlongPolyline',  this.moveAlongPolyline)
      }
      this.lastPos = this.moveAlongPolyline[this.moveAlongPolyline.length - 1]
    }
    // this._getMoveSpeed()
  }
  /**
   * 更新或者初始化折线
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updatePolyline(isJump = false){
    console.log('basetrak_updatePolyline___________________________________________________')
    if (!this._checkPosition()){
      console.warn('PlayerTrack-_updatePolyline, 参数错误')
      return
    }
    let data = this.data
    let isLegsState = this.isLegsState //是否选中赛段，显示全部轨迹
    let isShowAllHistorys = this.isShowAllHistorys
    let targetTime = this.curTime.getTime() - this.trackMemoryTime //轨迹拖尾截断时间
    let historys = []
    let polylinePath = []
    console.log('this.data', this.data)
    console.log('isJump', isJump)
    if (isJump){
      this.endMarkerMoveArray = []
      this.endMarkerPopPos = null
      this.polylinePath = []
      historys = data.historys || []
      //计算轨迹时间范围内的轨迹点
      let lastPoint = historys[historys.length - 1]
      let lastPointCount = 0
      for (let i = historys.length - 1; i >= 0; --i){
        let polylineData = historys[i]
        let curTime = util.newDate(polylineData.locationTime)
        let cutLimit = data.limitDateTime && (data.limitDateTime > curTime.getTime()) //是否截断限制时间前的轨迹
        if ((!isLegsState && !isShowAllHistorys && (targetTime > curTime.getTime())) || cutLimit){
          //如果超出轨迹时间范围，退出循环
          break
        }
        if( i === historys.length - 1){
          if(this.text){
            lastPointCount += 1
          }
        }
        else if (polylineData.lng === lastPoint.lng &&
            polylineData.lat === lastPoint.lat &&
            polylineData.locationTime === lastPoint.locationTime){
          lastPointCount += 1
        }
      }
      for (let i = historys.length - lastPointCount - 1; i >= 0; --i){
        let polylineData = historys[i]
        let curTime = util.newDate(polylineData.locationTime)
        let cutLimit = data.limitDateTime && (data.limitDateTime > curTime.getTime()) //是否截断限制时间前的轨迹
        if ((!isLegsState && !isShowAllHistorys && (targetTime > curTime.getTime())) || cutLimit){
          //如果超出轨迹时间范围，退出循环
          this.jumpCutTime = polylineData.locationTime //记录跳点后最后一个点的定位时间
          break
        }
        this.polylinePath.push(polylineData)
      }
      polylinePath = this.polylinePath
      // 注释原代码：完全避免添加当前位置，防止连线问题
      // if(this.polylinePath.length > 0){
      //   this.text && this.polylinePath.unshift({
      //     ...this.text.getPosition(),
      //     locationTime: this.polylinePath[0].locationTime
      //   })
      // }
    }
    else {
      if (this.polylinePath.length <= 0 && (this.trackMemoryTime || isShowAllHistorys || isLegsState)){
        // 注释原代码：完全避免添加当前位置，防止连线问题
        // let locationTime = util.getCurrentDateStr('all', this.curTime)
        // if(!isShowAllHistorys && !isLegsState && this.jumpCutTime){
        //   locationTime = this.jumpCutTime
        // }
        // this.text && this.polylinePath.unshift({
        //   ...this.text.getPosition(),
        //   locationTime: locationTime
        // })
      }
      //将动画移动的数据放入线段数组
      if (this.moveEndPolylineData.length > 0){
        for (let i = 0; i < this.moveEndPolylineData.length; ++i){
          let polylineData = this.moveEndPolylineData[i]
          this.polylinePath.unshift(polylineData)
        }
      }
      this.moveEndPolylineData = []
      polylinePath = []
      
      // 添加完整的历史轨迹数据到polylinePath
      historys = data.historys || []
      for (let i = 0; i < historys.length; ++i){
        let polylineData = historys[i]
        if(polylineData.locationTime){
          let curTime = util.newDate(polylineData.locationTime)
          let cutLimit = data.limitDateTime && (data.limitDateTime > curTime.getTime()) //是否截断限制时间前的轨迹
          if ((!isLegsState && !isShowAllHistorys && (targetTime > curTime.getTime())) || cutLimit){
            //如果超出轨迹时间范围，退出循环
            break
          }
        }
        polylinePath.push(polylineData)
      }
      
      //将最终的线段数组放入用于显示线段的数组中
      for (let i = 0; i < this.polylinePath.length; ++i){
        let polylineData = this.polylinePath[i]
        if(polylineData.locationTime){
          let curTime = util.newDate(polylineData.locationTime)
          let cutLimit = data.limitDateTime && (data.limitDateTime > curTime.getTime()) //是否截断限制时间前的轨迹
          if ((!isLegsState && !isShowAllHistorys && (targetTime > curTime.getTime())) || cutLimit){
            //如果超出轨迹时间范围，退出循环
            break
          }
        }
        // 避免重复添加相同的点
        let isDuplicate = polylinePath.some(p => 
          p.lng === polylineData.lng && 
          p.lat === polylineData.lat && 
          p.locationTime === polylineData.locationTime
        )
        if (!isDuplicate) {
          polylinePath.push(polylineData)
        }
      }
      //若显示线段数组为空，放入一个最新点
      if(polylinePath.length <= 0){
        this.polylinePath[0] && polylinePath.push(this.polylinePath[0])
      }
    }
    let polylinePathData = []
    let lastPathData = {}
    // 修复：完全不添加当前位置，避免连线问题
    // 连线问题的根源就是添加了当前位置，导致轨迹线连接到不连续的点
    // if(this.text && polylinePath.length > 0){
    //   polylinePathData.push([this.text.getPosition().lat, this.text.getPosition().lng])
    // }
    for (let i = 0; i < polylinePath.length; ++i){
      let polylineData = polylinePath[i]
      //标记定位时间异常点
      let isErrorPos = false
      if(i >= 1){
        isErrorPos = this._getErrorPosState(
          polylinePath[i].locationTime, polylinePath[i - 1].locationTime)
      }
      else{
        isErrorPos = this._getErrorPosState(
          util.getCurrentDateStr('all', this.curTime), polylinePath[i].locationTime)
      }
      if(isErrorPos){
        break
      }
      lastPathData = polylineData
      polylinePathData.push([polylineData.lat, polylineData.lng])
    }
    if(polylinePathData.length > 1){
      if(!isLegsState && (!isShowAllHistorys || this.trackMemoryTime > 0)){
        //折线最后标记点待移动数组
        if(Object.keys(lastPathData).length > 0 && (
          this.endMarkerMoveArray.length <= 0 || (this.endMarkerMoveArray.length > 0
          && this.endMarkerMoveArray[this.endMarkerMoveArray.length - 1].lat !== lastPathData.lat
          && this.endMarkerMoveArray[this.endMarkerMoveArray.length - 1].lng !== lastPathData.lng
          && this.endMarkerMoveArray[this.endMarkerMoveArray.length - 1].locationTime !== lastPathData.locationTime)
        ))
        {
          this.endMarkerMoveArray.push(lastPathData)
        }
        //连接折线最后标记点坐标
        if(this.endMarker){
          if(!isJump){
            // 修复：完全不添加endMarker位置，避免连线问题
            // 连线问题的根源就是添加了当前标记位置
            // for (let i = this.endMarkerMoveArray.length - 1; i >= 0; --i) {
            //   let item = this.endMarkerMoveArray[i]
            //   if(util.dateComparison(item.locationTime, lastPathData.locationTime) === -1){
            //     polylinePathData.push([item.lat, item.lng])
            //   }
            // }
            // polylinePathData.push([this.endMarker.getPosition().lat, this.endMarker.getPosition().lng])
          }
        }
      }
    }
    else{
      this.endMarkerMoveArray = []
      this.endMarkerPopPos = null
      this.text && this.endMarker && this.endMarker.setPosition(
        this.text.getPosition().lat, this.text.getPosition().lng)
    }
    if (!isLegsState && !isShowAllHistorys && this.trackMemoryTime <= 0){
      polylinePathData = []
      this.endMarkerMoveArray = []
    }
    // 修复：不添加当前位置，避免连线问题
    // 如果没有轨迹数据，就不显示轨迹线，而不是添加当前位置
    // if(polylinePathData.length <= 0){
    //   polylinePathData.push([this.text.getPosition().lat, this.text.getPosition().lng])
    // }
    console.log('polylinePathData', polylinePathData.length, polylinePathData)
    console.log('polylinePath', polylinePath.length, polylinePath)
    console.log('this.data.historys', this.data.historys ? this.data.historys.length : 'null')
    
    // 修复：确保轨迹线正常更新
    if (this.polyline){
      if(polylinePathData && polylinePathData.length > 0){
        this.polyline.setPath(polylinePathData)
      }
    }
    else {
      if(polylinePathData && polylinePathData.length > 0){
        let config = {
          ...OverlayConfig.Polyline,
          path: polylinePathData,
          strokeColor: this.color,
        }
        if(this.polylineStrokeOpacity){
          config.strokeOpacity = this.polylineStrokeOpacity
        }
        if(this.polylineStrokeWeight){
          config.strokeWeight = this.polylineStrokeWeight
        }
        this.polyline = new MapPolyline(this.mapboxgl, config, this.sn)
      }
    }
  }
  /**
   * 更新或初始化折线最末标记点
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateEndMarkerIcon(isJump = false){
    if(this.isShowAllHistorys || this.isLegsState || this.trackMemoryTime <= 0){
      return
    }
    if(!this.polyline || (this.polyline && this.polyline.getPath().length <= 0)){
      this.endMarker && this.endMarker.stopMove()
      if(this.text){
        let position = this.text.getPosition()
        this.endMarker && this.endMarker.setPosition(position.lat, position.lng)
      }
      return
    }
    let targetPos = this.endMarkerMoveArray[0]
    if(!targetPos){
      return
    }
    if(this.endMarker){
      if(isJump){
        this.endMarker.stopMove()
        this.endMarker.setPosition(targetPos.lat, targetPos.lng)
        this.isEndMarkerMoveEnd = true
      }
      else{
        if(this.isEndMarkerMoveEnd){
          this.endMarker.stopMove()
          let duration = this._getEndMarkerDuration()
          if(targetPos && duration > 0){
            console.log('调用addMoveToAnimation', 'this.sn + end', this.sn + 'end')
            // this.endMarker.moveTo(targetPos.lng, targetPos.lat, speed)
            this.animationLogic.addMoveToAnimation(this.sn + 'end', this.endMarker, targetPos, duration)
            this.isEndMarkerMoveEnd = false
          }
        }
      }
    }
    else{
      let config = {
        ...OverlayConfig.InvisibleMarker,
        position: new window.L.latLng(targetPos.lat, targetPos.lng)
      }
      this.endMarker = new MapCircleMarker(this.mapboxgl, config, this.sn)
      this.endMarker.stopMove()
      console.log('addListenerMoveend==============')
      this.animationLogic.addListenerMoveend(this.sn + 'end', this._onEndMarkerMoveend.bind(this))
    }
  }
  _onEndMarkerMoveend(e){
    this.endMarkerPopPos = this.endMarkerMoveArray[0]
    this.endMarkerMoveArray.splice(0,1)
    this.isEndMarkerMoveEnd = true
  }
  /**
   * 更新UI
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updateUI(isJump = false){
    console.log('basetrak_updateUI---------------')
  }
  /**
   * 更新UI颜色
   */
  _updateUIColor(){}
  /**
   * 更新动画标记 - 实现：让所有标记跟随text移动
   */
  _updateAnimationMarker(lng, lat){
    console.log('BaseTrack _updateAnimationMarker调用', lng, lat)
    // 调用子类的具体实现
    if (this._updateCircleMarker) {
      this._updateCircleMarker(lng, lat, false) // false表示非跳点模式
    }
    if (this._updateIconMarker) {
      this._updateIconMarker(lng, lat, false)
    }
    if (this._updateMapText) {
      // text已经通过动画移动了，不需要再次设置位置
      // this._updateMapText(lng, lat, false)
    }
  }
  /**
   * 销毁数据
   */
  _destroyData(){
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
  _destroyUI(){}
  /**
   * 销毁折线UI
   */
  _destroyPolyline(){
    this.polyline && this.polyline.remove()
  }
  /**
   * 检查坐标
   * @return {[Boolean]} [是否有效]
   */
  _checkPosition(){
    let position = this.getPosition() || {}
    let lat = position.lat && position.lat.toString()
    let lng = position.lng && position.lng.toString()
    if (!position || (!lat || !lng)){
      return false
    }
    return true
  }
  /**
   *  获取两点移动时间
   */
  _getDuration(){
    console.log('_getDuration')
    // let markMoveMutiple = this.markMoveMutiple || 1
    let duration = 0
    if (this.moveAlongPolyline.length > 0){
      let curPos = this.popPos || this.moveAlongPolyline[0]
      let targetPos = this.moveAlongPolyline[0]
      if (!targetPos){
        return 0
      }
      duration = util.newDate(targetPos.locationTime).getTime() - util.newDate(curPos.locationTime).getTime()
      duration = Math.abs(duration / 1000)
      if(duration > 90){
        duration = 10
      }
      if(duration === 0){
        this.popPos = this.moveAlongPolyline[0]
        this.moveAlongPolyline.splice(0,1)
        this.isMoveEnd = true
        this.isDataUpdate = true
        this._updateUI()
        return 0
      }
    }
    // duration = duration / markMoveMutiple
    return duration
  }
  /**
   * 获取计算折线最末标记点移动时间
   */
  _getEndMarkerDuration(){
    // let markMoveMutiple = this.markMoveMutiple || 1
    let duration = 0
    if (this.endMarkerMoveArray.length > 0){
      let curPos = this.endMarkerPopPos
      let targetPos = this.endMarkerMoveArray[0]
      if (!targetPos){
        return 0
      }
      if(!curPos){
        let targetPosTime = util.newDate(targetPos.locationTime).getTime()
        let popPosTime = targetPosTime - this.trackMemoryTime
        curPos = {
          ...this.endMarker.getPosition(),
          locationTime: util.getCurrentDateStr('all', new Date(popPosTime))
        }
      }
      duration= util.newDate(targetPos.locationTime).getTime() - util.newDate(curPos.locationTime).getTime()
      duration = Math.abs(duration / 1000)
    }

    // duration = duration / markMoveMutiple
    return duration
  }
  /**
   * 获取计算轨迹速度
   */
  _getMoveSpeed(){
    let speed = 0
    if (this.moveAlongPolyline.length > 0){
      let curPos = this.popPos || this.moveAlongPolyline[0]
      let targetPos = this.moveAlongPolyline[0]
      if (!targetPos){
        this.curSpeed = 0
        return
      }
      // let distance = window.AMap.GeometryUtil.distance(
      //   new window.mapboxgl.LngLat(targetPos.lng, targetPos.lat),
      //   new window.mapboxgl.LngLat(curPos.lng, curPos.lat)
      // )
      let distance = turf.distance(
        [targetPos.lng, targetPos.lat],
        [curPos.lng, curPos.lat],
        { units: 'meters' }
      )
      if (distance <= 0.2){
        this.curSpeed = 0
        return
      }
      let time = util.newDate(targetPos.locationTime).getTime() - util.newDate(curPos.locationTime).getTime()
      time = Math.abs(time / 1000)
      if(time > 90){
        time = 10
      }
      speed = Number((distance / time) * (60 * 60 / 1000))
      this.curSpeed = speed.toFixed(2)
    }
  }
  /**
   * 获取跳点模式移动速度
   */
  _getJumpSpeed(){
    let historys = this.data.historys
    let position = this.position
    let distance = 0
    let time = 0
    let speed = 0
    if(historys.length >= 2){
      let popPos = historys[historys.length - 2]

      // distance = window.AMap.GeometryUtil.distance(
      //   [popPos.lng, popPos.lat],
      //   [position.lng, position.lat]
      // )
      distance = turf.distance(
        [popPos.lng, popPos.lat],
        [position.lng, position.lat],
        { units: 'meters' }
      )
      time = util.newDate(position.locationTime).getTime() - util.newDate(popPos.locationTime).getTime()
      time = Math.abs(time / 1000)
      speed = Number((distance / time) * (60 * 60 / 1000))
      speed = speed.toFixed(2)
    }
    this.curSpeed = speed
  }
  /**
   * 定位点定位时间是否异常
   * @param {[type]} time1 [点的定位时间]
   * @param {[type]} time2 [上一个点的定位时间]
   */
  _getErrorPosState(time1, time2){
    if(time1 && time2
      && (util.dateDiff(time1 , time2) >= OverlayConfig.TrackErrorTime)
      && this.trackMemoryTime <= OverlayConfig.TrackErrorTime
      && !this.isShowAllHistorys
      && !this.isLegsState){
      return true
    }
    return false
  }
}
