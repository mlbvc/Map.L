import MapPolyline from '../Overlay/MapPolyline'
import MapCircleMarker from '../Overlay/MapCircleMarker'
import OverlayConfig from '../OverlayConfig'
import SetUpDefaultConfig from '../../../Component/SetUp/SetUpDefaultConfig'
import BroadcastCenter from '../../../Framework/Broadcast/BroadcastCenter'
import Util from '../../../Common/Utils/Util'
const broadcastCenter = BroadcastCenter.getInstance()
const util = Util.getInstance()
export default class BaseTrack{
  /**
   *  构造函数
   * @param {[AMap]} aMap [地图对象]
   * @param {[Object]} data [轨迹数据]
   */
  constructor(aMap, data){
    this.deletable = false    //删除标记
    this.aMap = aMap          //地图对象
    this.data = data          //轨迹数据
    this.sn = data.sn         //设备号
    this.markerCursor = data.markerCursor || 'pointer' //鼠标选中样式
    this.curTime = new Date() //当前时间
    this.position = {lng: 0, lat: 0, locationTime: 0}  //坐标
    this.color = "#000"
    this.markMoveMutiple = 0 //播放倍率
    this.historysCount = 0  //轨迹长度
    this.moveAlongArray = [] //待移动轨迹
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
    return this.text.getRoot()
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
    console.log('onMarkerMoving----------------')
    //更新设置报警图标位置
    broadcastCenter.pushEvent('updateAlarmPosition', {
      markerData:this.data,
      passedPath: e.passedPath
    })
    this._updatePolyline()
  }
  /**
   * 标记点动画节点结束回调
   */
  onMarkerMoveend(e){
    let lastPolylineData = this.moveAlongPolyline[0]
    lastPolylineData && this.moveEndPolylineData.push(lastPolylineData)
    this.popPos = lastPolylineData
    this.moveAlongArray.splice(0,1)
    this.moveAlongPolyline.splice(0,1)
    this.isMoveEnd = true
    this.isDataUpdate = true
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
      this.moveAlongArray = []
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
        let lngLat = new window.AMap.LngLat(historys[i].lng, historys[i].lat)
        this.moveAlongArray.push(lngLat)
      }
      this.lastPos = this.moveAlongPolyline[this.moveAlongPolyline.length - 1]
    }
  }
  /**
   * 更新或者初始化折线
   * @param  {Boolean} [isJump=false] [是否使用跳点方式]
   */
  _updatePolyline(isJump = false){
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
      //如有轨迹，将标记点坐标放入线段数组开头
      if(this.polylinePath.length > 0){
        this.text && this.polylinePath.unshift({
          ...this.text.getPosition(),
          locationTime: this.polylinePath[0].locationTime
        })
      }
    }
    else {
      if (this.polylinePath.length <= 0 && (this.trackMemoryTime || isShowAllHistorys || isLegsState)){
        //如无线段，将标记点坐标放入线段数组开头，使第一次动画移动有线段
        let locationTime = util.getCurrentDateStr('all', this.curTime)
        if(!isShowAllHistorys && !isLegsState && this.jumpCutTime){
          locationTime = this.jumpCutTime
        }
        this.text && this.polylinePath.unshift({
          ...this.text.getPosition(),
          locationTime: locationTime
        })
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
        polylinePath.push(polylineData)
      }
      //若显示线段数组为空，放入一个最新点
      if(polylinePath.length <= 0){
        this.polylinePath[0] && polylinePath.push(this.polylinePath[0])
      }
    }
    let polylinePathData = []
    let lastPathData = {}
    if(this.text && polylinePath.length > 0){
      polylinePathData.push(this.text.getPosition())
    }
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
      polylinePathData.push(new window.AMap.LngLat(polylineData.lng, polylineData.lat))
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
            for (let i = this.endMarkerMoveArray.length - 1; i >= 0; --i) {
              let item = this.endMarkerMoveArray[i]
              if(util.dateComparison(item.locationTime, lastPathData.locationTime) === -1){
                polylinePathData.push(new window.AMap.LngLat(item.lng, item.lat))
              }
            }
            polylinePathData.push(this.endMarker.getPosition())
          }
        }
      }
    }
    else{
      this.endMarkerMoveArray = []
      this.endMarkerPopPos = null
      this.text && this.endMarker && this.endMarker.setPosition(
        this.text.getPosition().lng, this.text.getPosition().lat)
    }
    if (!isLegsState && !isShowAllHistorys && this.trackMemoryTime <= 0){
      polylinePathData = []
      this.endMarkerMoveArray = []
    }
    if(polylinePathData.length <= 0){
      polylinePathData.push(this.text.getPosition()) //线段属性lineCap不是'butt'时，path属性长度不能小于1
    }
    console.log(polylinePathData)
    if (this.polyline){
      this.polyline.setPath(polylinePathData)
    }
    else {
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
      this.polyline = new MapPolyline(this.aMap, config, this.sn)
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
        this.endMarker && this.endMarker.setPosition(position.lng, position.lat)
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
        this.endMarker.setPosition(targetPos.lng, targetPos.lat)
        this.isEndMarkerMoveEnd = true
      }
      else{
        if(this.isEndMarkerMoveEnd){
          this.endMarker.stopMove()
          let speed = this._getEndMarkerSpeed()
          if(targetPos && speed > 0){
            this.endMarker.moveTo(targetPos.lng, targetPos.lat, speed)
            this.isEndMarkerMoveEnd = false
          }
        }
      }
    }
    else{
      let config = {
        ...OverlayConfig.InvisibleMarker,
        position: new window.AMap.LngLat(targetPos.lng, targetPos.lat)
      }
      this.endMarker = new MapCircleMarker(this.aMap, config, this.sn)
      this.endMarker.stopMove()
      window.AMap.event.addListener(
        this.endMarker.getRoot(), 'moveend', (e)=>this._onEndMarkerMoveend(e))
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
  _updateUI(isJump = false){}
  /**
   * 更新UI颜色
   */
  _updateUIColor(){}
  /**
   * 销毁数据
   */
  _destroyData(){
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
  _destroyUI(){}
  /**
   * 销毁折线UI
   */
  _destroyPolyline(){
    this.polyline && this.aMap.remove(this.polyline.getRoot())
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
   * 获取计算轨迹速度
   */
  _getSpeed(){
    let retSpeed = 0
    let speed = 10
    let markMoveMutiple = this.markMoveMutiple || 1
    if (this.moveAlongPolyline.length > 0){
      let curPos = this.popPos || this.moveAlongPolyline[0]
      let targetPos = this.moveAlongPolyline[0]
      if (!targetPos){
        this.curSpeed = 0
        return 0
      }
      let distance = window.AMap.GeometryUtil.distance(
        new window.AMap.LngLat(targetPos.lng, targetPos.lat),
        new window.AMap.LngLat(curPos.lng, curPos.lat)
      )
      if (distance <= 0.2){
        this.popPos = this.moveAlongPolyline[0]
        this.moveAlongArray.splice(0,1)
        this.moveAlongPolyline.splice(0,1)
        this.isMoveEnd = true
        this.isDataUpdate = true
        this._updateUI()
        this.curSpeed = 0
        return 0
      }
      let time = util.newDate(targetPos.locationTime).getTime() - util.newDate(curPos.locationTime).getTime()
      time = Math.abs(time / 1000)
      if(time > 90){
        time = 10
      }
      speed = Number((distance / time) * (60 * 60 / 1000))
      this.curSpeed = speed.toFixed(2)
      if (time <= 0 || speed <= 0){
        speed = 10
      }
    }
    let addSpeed = 0
    if(this.moveAlongPolyline.length > 10){
      addSpeed = this.moveAlongPolyline.length * 1 * markMoveMutiple
    }
    retSpeed = speed * markMoveMutiple + addSpeed
    return retSpeed
  }
  /**
   * 获取计算折线最末标记点速度
   */
  _getEndMarkerSpeed(){
    let retSpeed = 0
    let speed = 10
    let markMoveMutiple = this.markMoveMutiple || 1
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
      let distance = window.AMap.GeometryUtil.distance(
        new window.AMap.LngLat(targetPos.lng, targetPos.lat),
        new window.AMap.LngLat(curPos.lng, curPos.lat)
      )
      if (distance <= 0.2){
        this._onEndMarkerMoveend()
        return 0
      }
      let time = util.newDate(targetPos.locationTime).getTime() - util.newDate(curPos.locationTime).getTime()
      time = Math.abs(time / 1000)
      speed = Number((distance / time) * (60 * 60 / 1000))
      if (time <= 0 || speed <= 0){
        speed = 100
      }
    }
    let addSpeed = this.endMarkerMoveArray.length * 1 * markMoveMutiple
    retSpeed = speed * markMoveMutiple + addSpeed
    return retSpeed
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
      distance = window.AMap.GeometryUtil.distance(
        [popPos.lng, popPos.lat],
        [position.lng, position.lat]
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
