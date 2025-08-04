
import TrackMathUtil from './TrackMathUtil'
import OverlayLogic from './OverlayLogic'
import UrlCenter from '../../Framework/Url/UrlCenter'
const trackMathUtil = TrackMathUtil.getInstance()
const overlayLogic = OverlayLogic.getInstance()
const urlCenter = UrlCenter.getInstance()
export default class LocationLogic{
  static getInstance(){
    if(!this._instance)
      this._instance = new LocationLogic()
    return this._instance
  }
  constructor(){
    this.init()
  }
  init(){
    this.moveInterval = null // 平移定时器
  }

  _stopMoveInterval(){
    if(this.moveInterval){
      clearInterval(this.moveInterval)
      this.moveInterval = null
    }
  }
  /**
   * 初始化地图语言
   */
  initMapLang(){
    //默认中文
    let lang = urlCenter.getLangMode() || "C"
    lang = lang.toUpperCase()
    let map_lang_obj = {
      'C': 'zh_cn',
      'E': 'en'
    }
    return map_lang_obj[lang]
  }
  /**
   * 构造一个Map类的实例
   * @param  {[string]} id [地图容器id]
   */
  initMap(id, opts={}){
    if(!id){
      return
    }
    overlayLogic.init()
    let mapObj = new window.AMap.Map(id, {
       resizeEnable: opts.resizeEnable === true? true : false, //是否监控地图容器尺寸变化
       zoom: opts.zoom || 16, //地图显示的缩放级别
       zooms:opts.zooms || [4,20], //地图显示的缩放级别范围
       expandZoomRange:opts.resizeEnable === false? false : true, //是否支持可以扩展最大缩放级别
       labelzIndex: opts.labelzIndex || 100, //大于110即可将底图上的默认标注显示在覆盖物（圆、折线、面）之上
       lang: this.initMapLang() || 'zh_cn', //地图语言类型
       animateEnable: opts.animateEnable === false? false : true, //地图平移过程中是否使用动画
       isHotspot: opts.isHotspot === true? true : false, //是否开启地图热点和标注的hover效果
       rotateEnable: opts.rotateEnable === false? false : true, //地图是否可旋转
       zoomEnable: opts.zoomEnable === false? false : true, //地图是否可缩放
       jogEnable: opts.jogEnable === true? true : false, //地图是否使用缓动效果
       touchZoom: opts.touchZoom === false? false : true, //是否可通过多点触控缩放浏览地图
       touchZoomCenter: opts.touchZoomCenter || 0, //双指缩放的中心, 等于1以地图中心为中心
       features:opts.features || [],//['bg','point','road','building'], //设置地图上显示的元素种类
       showBuildingBlock: opts.showBuildingBlock === true? true : false, //设置地图显示3D楼块效果
       preloadMode: opts.preloadMode === false? false : true, //设置地图的预加载模式
       keyboardEnable: opts.keyboardEnable === false? false : true, //是否可通过键盘旋转地图
       pitchEnable:opts.pitchEnable === true? true : false, //是否允许设置俯仰角度
       doubleClickZoom: opts.doubleClickZoom === true? true : false, //否可通过双击鼠标缩放地图
       viewMode: opts.viewMode || '3D'
    })
    return mapObj
  }
  /**
   * 设置地图滑动限制范围
   * @param {[object]} data   [赛事信息]
   * @param {[object]} mapObj [地图对象]
   */
  setLimitBounds(mapObj, data){
    this.setBounds(mapObj, data)
    mapObj.getLimitBounds() && mapObj.clearLimitBounds()
    mapObj.setLimitBounds(mapObj.getBounds())
  }

  /**
   * 移动地图中心点到指定层级位置
   * @param  {[object]} mapObj [地图对象]
   * @param  {[Number]} x      [目标点x]
   * @param  {[Number]} y      [目标点y]
   * @param  {[Number]} zoom   [地图层级]
   */
  visualBoundsSign(mapObj, x, y, zoom) {
    if(!mapObj){
      return
    }
    this._stopMoveInterval()

    // 当前区域中心点
    let curCenter = mapObj.getCenter()
    let curCenterX = curCenter.lng
    let curCenterY = curCenter.lat
    let curZoom = mapObj.getZoom()

    let targetCenterX = x
    let targetCenterY = y
    let targetZoom = zoom

    // 计算两点之前距离，若太大则直接设置，不做效果处理
    let len = this.getDistance(curCenterX, curCenterY, targetCenterX, targetCenterY)
    console.log('len', len)
    if (len > 3 * 1000) {
      mapObj.setZoomAndCenter(targetZoom, [targetCenterX, targetCenterY]);
      return
    }

    let tempZ = targetZoom - curZoom
    let tempX = targetCenterX - curCenterX
    let tempY = targetCenterY - curCenterY

    // 目标位置基本无距离，则只需设置地图层级
    if (Math.abs(tempX) < 0.0001 && Math.abs(tempY) < 0.0001) {
      mapObj.setZoom(targetZoom);
      return
    }

    let stop = false
    // 地图层级太大时，分的份数提高一些，增加顺滑性
    let num = curZoom > 18 ? 25 : 20
    this.moveInterval = setInterval(()=>{

      curCenterX += tempX / num
      curCenterY += tempY / num
      curZoom += (tempZ / num)

      stop = tempX > 0 ? curCenterX > targetCenterX : curCenterX < targetCenterX
      stop = tempY > 0 ? curCenterY > targetCenterY : curCenterY < targetCenterY
      if (stop) {
        this._stopMoveInterval()
      } else {
        mapObj.setZoomAndCenter(curZoom, [curCenterX, curCenterY]);
      }
    }, 100)
  }
  /**
   * 移动地图中心点到指定层级位置
   * @param {[object]} data   [赛事信息]
   * @param {[object]} mapObj [地图对象]
   */
  visualBounds(mapObj, data, ratio = 0) {
    if(!data || !mapObj){
      return
    }
    let src_coordinate = data.src_coordinate || data.default_src_coordinate
    if(!src_coordinate){
      console.log("未设置显示范围经纬度")
      return
    }

    let param = this.getBounds(mapObj, data)
    this.visualBoundsSign(mapObj, param.x, param.y, param.zoom + ratio)
  }

  /**
   * 获取可视坐标中心点及地图层级
   * @param {[object]} data   [赛事信息]
   * @param {[object]} mapObj [地图对象]
   */
  getBounds(mapObj, data) {
    let src_coordinate = data.src_coordinate || data.default_src_coordinate
    if(!src_coordinate){
      console.log("未设置显示范围经纬度")
      return
    }
    // 当前地图区域, 初始地图边角坐标
    let mapObjBounds = mapObj.getBounds()
    console.log('mapbounds', mapObjBounds)
    let curCoordinate = []
    if(mapObjBounds.CLASS_NAME === 'AMap.ArrayBounds') { // 容错处理，mac下safari对象不一致
      curCoordinate = mapObjBounds.path
    } else {
      let mapNorthEast = mapObjBounds.northeast
      let mapSouthWest = mapObjBounds.southwest
      curCoordinate = [
        [mapSouthWest.lng, mapNorthEast.lat],
        [mapNorthEast.lng, mapNorthEast.lat],
        [mapNorthEast.lng, mapSouthWest.lat],
        [mapSouthWest.lng, mapSouthWest.lat]
      ]
    }

    console.log('cccccccccc', curCoordinate)
    // 当前区域
    let curHeight = this.getDistance(curCoordinate[0][0], curCoordinate[0][1], curCoordinate[3][0], curCoordinate[3][1])
    console.log('当前高度00-01-30-31', curCoordinate[0][0], curCoordinate[0][1], curCoordinate[3][0], curCoordinate[3][1])
    console.log('curHeight', curHeight) // 矩形左上与左下
    let curWidth = this.getDistance(curCoordinate[0][0], curCoordinate[0][1], curCoordinate[1][0], curCoordinate[1][1]) // 矩形左上与右上
    console.log('当前宽度00-01-10-11', curCoordinate[0][0], curCoordinate[0][1], curCoordinate[1][0], curCoordinate[1][1])
    console.log('curWidth', curWidth)
    // 目标区域
    let coordinate = JSON.parse(src_coordinate) // 目标区域坐标
    let targetHeight2 = Number(coordinate[0].y) - Number(coordinate[1].y) //高：左上lat - 右下lat
    let targetWidth2 = Number(coordinate[1].x) - Number(coordinate[0].x) //长：右下lng - 左上lng

    console.log('ccccccccccurcoordinate', curCoordinate)
    // 目标经纬度坐标转换回平面像素坐标
    let l0 = this.lnglatTocontainer(mapObj, coordinate[0].x, coordinate[0].y)
    // let l1 = this.lnglatTocontainer(mapObj, coordinate[1].x, coordinate[0].y)
    let l2 = this.lnglatTocontainer(mapObj, coordinate[1].x, coordinate[1].y)
    // let l3 = this.lnglatTocontainer(mapObj, coordinate[0].x, coordinate[1].y)

    // (与当前区域显示同比例)重组新矩阵经纬度坐标
    let n0 = 0
    let n1 = 0
    // let n2 = 0
    let n3 = 0
    // 180度是上下倒置所以不用处理，90度是x轴与y轴互换了
    if (mapObj.getRotation() % 180 > 90) {
      n0 = this.containTolnglat(mapObj, l2[0], l0[1])
      n1 = this.containTolnglat(mapObj, l0[0], l0[1])
      // n2 = this.containTolnglat(mapObj, l0[0], l2[1])
      n3 = this.containTolnglat(mapObj, l2[0], l2[1])
    } else {
      n0 = this.containTolnglat(mapObj, l0[0], l0[1])
      n1 = this.containTolnglat(mapObj, l2[0], l0[1])
      // n2 = this.containTolnglat(mapObj, l2[0], l2[1])
      n3 = this.containTolnglat(mapObj, l0[0], l2[1])
    }

    console.log('n0', n0)
    console.log('n1', n1)
    console.log('n3', n3) 

    console.log(mapObj.getRotation() % 180 > 90)
    let targetHeight = this.getDistance(n0[0], n0[1], n3[0], n3[1]) // 矩形左上与左下
    console.log('矩形左上与左下00-01-30-31', n0[0], n0[1], n3[0], n3[1])
    console.log('targetHeight', targetHeight)
    let targetWidth = this.getDistance(n0[0], n0[1], n1[0], n1[1]) // 矩形左上与右上
    console.log('矩形左上与右上00-01-10-11', n0[0], n0[1], n1[0], n1[1])
    console.log('targetWidth', targetWidth)
    // 计算出高度缩放的等级值
    let maxHeight = 0;
    let minHeight = 0;
    if (curHeight > targetHeight) {
      maxHeight = curHeight
      minHeight = targetHeight
    } else {
      maxHeight = targetHeight
      minHeight = curHeight
    }

    let levelHeight = 0;
    while(maxHeight > minHeight && levelHeight <= 200) {
      maxHeight *= 0.933
      levelHeight += 0.1
    }
    // 计算出长度缩放的等级值
    let maxWidth = 0;
    let minWidth = 0;
    if (curWidth > targetWidth) {
      maxWidth = curWidth
      minWidth = targetWidth
    } else {
      maxWidth = targetWidth
      minWidth = curWidth
    }

    let levelWidth = 0;
    while(maxWidth > minWidth && levelWidth <= 200) {
      maxWidth *= 0.933
      levelWidth += 0.1
    }

    // 计算出目标区域是需放大或缩小
    let zoom = mapObj.getZoom()
    if (curHeight > targetHeight) {
      if (curWidth > targetWidth) {
        // 含了目标区域的长与高
        zoom += (levelHeight > levelWidth ?  levelWidth : levelHeight) - 0.1 // 目标区域需要放大时，计算是max小于min（即范围超过了才跳出循环所以要减掉一级）
      } else {
        // 只含目标区域的高
        zoom -= levelWidth
      }
    } else if (curWidth > targetWidth){
      // 只含目标区域的长
      zoom -= levelHeight.toFixed(1)
    } else {
      // 不含目标区域的长与高
      zoom -= levelHeight > levelWidth ?  levelHeight : levelWidth
    }
    zoom = zoom > 20 ? 20 : zoom

    return {
      zoom: zoom,
      x: Number(coordinate[0].x) + targetWidth2 / 2,
      y: Number(coordinate[0].y) - targetHeight2 / 2
    }
  }

  /**
   * 设置地图显示范围
   * @param {[object]} data   [赛事信息]
   * @param {[object]} mapObj [地图对象]
   */
  setBounds(mapObj, data, ratio = 0){
    if(!data || !mapObj){
      return
    }
    let src_coordinate = data.src_coordinate || data.default_src_coordinate
    if(!src_coordinate){
      console.log("未设置显示范围经纬度")
      // let geolocation = this.initGeolocation(mapObj, {
      //   showMarker: false,
      //   showCircle: false,
      //   panToLocation: true,
      //   zoomToAccuracy: false
      // })
      // this.getCurrentPosition(mapObj, geolocation)
      // mapObj.setZoom(16)
      return
    }

    let param = this.getBounds(mapObj, data)

    // 偏移到目标中心点并设置地图层级
    mapObj.setZoomAndCenter(param.zoom + ratio, [param.x, param.y]);

  }
  /**
   * 设置地图中心
   * @param {[object]} mapObj [地图对象]
   * @param  {[float]} lng    [经度]
   * @param  {[float]} lat    [纬度]
   */
  setMapCenter(mapObj, lng, lat){
    if(!mapObj){
      return
    }
    mapObj.setCenter([lng, lat])
  }
  /**
   * 设置地图旋转角度
   * @param {[object]} mapObj [地图对象]
   * @param  {[float]} angle    [旋转角度]
   */
  setRotation(mapObj, angle){
    if(!mapObj){
      return
    }
    mapObj.setRotation(angle)
  }
  /**
   * 设置地图鼠标样式
   * @param {[object]} mapObj [地图对象]
   * @param  {[string]} value    [鼠标样式]
   */
  setMapCursor(mapObj, value){
    if(!mapObj){
      return
    }
    mapObj.setDefaultCursor(value)
  }
  /**
   * 初始化定位
   * @param  {[object]} mapObj [地图对象]
   * @param  {[object]} config [参数配置]
   */
  initGeolocation(mapObj, config = {}){
    // let geolocation = new window.AMap.Geolocation({
    //         enableHighAccuracy: config.enableHighAccuracy === false? false : true, //是否使用高精度定位，默认:true
    //         timeout: config.timeout || 3000,          //超过10秒后停止定位，默认：无穷大
    //         noIpLocate: config.noIpLocate || 0,
    //         noGeoLocation: config.noGeoLocation || 0,
    //         showButton: config.showButton === true? true : false,        //显示定位按钮，默认：false
    //         showMarker: config.showMarker === false? false : true,        //定位成功后在定位到的位置显示点标记，默认：true
    //         showCircle: config.showCircle === true? true : false,        //定位成功后用圆圈表示定位精度范围，默认：false
    //         panToLocation: config.panToLocation === true? true : false,     //定位成功后将定位到的位置作为地图中心点，默认：false
    //         zoomToAccuracy:config.zoomToAccuracy === true? true : false,      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
    //       })
    // mapObj.addControl(geolocation)
    // return geolocation
  }
  /**
   * 获取当前定位
   */
  getCurrentPosition(mapObj, geolocation, config = {}){
    geolocation.getCurrentPosition()
  }
  /**
   * 添加地图控件
   * @param {[object]} mapObj       [地图对象]
   * @param {[array]} controls     [添加的控件数组 例：['AMap.Scale', 'AMap.ToolBar']]
   * @param {Object} [options={}] [对应的控件配置 例：{ 'AMap.Scale': {} }]
   */
  addMapControl(mapObj, controls, options={}){
    if(!mapObj || !controls){
      return
    }
    let retControl = []
    window.AMap.plugin(controls, function(){
      for (let i = 0; i < controls.length; i++) {
        let item = controls[i] || ''
        let opt = options[item] || {}
        switch (item) {
          case 'AMap.Scale':
            retControl[i] = new window.AMap.Scale(opt)
            mapObj.addControl(retControl[i])
            break;
          case 'AMap.ToolBar':
            retControl[i] = new window.AMap.ToolBar(opt)
            mapObj.addControl(retControl[i])
            break;
          default:
        }
      }
    })
    return retControl
  }
  /**
   * 显示地图组件
   */
  showControl(data){
    for (let i = 0; i < data.length; i++) {
      data[i].show()
    }
  }
  /**
   * 隐藏地图组件
   */
  hiddenControl(data){
    for (let i = 0; i < data.length; i++) {
      data[i].hide()
    }
  }
  /**
   * 计算两个经纬度的距离 单位米
   */
  getDistance(lng1, lat1, lng2, lat2){
    console.log('getDistance', lng1, lat1, lng2, lat2)
    let distance = window.AMap.GeometryUtil.distance(
      new window.AMap.LngLat(lng1, lat1),
      new window.AMap.LngLat(lng2, lat2)
    )
    console.log('distance', distance)
    console.log('------')
    return distance
  }
  /**
   * 计算线段距离 单位米
   * @param  {[array]} path [线段数组]
   */
  getDistanceOfLine(path){
    return window.AMap.GeometryUtil.distanceOfLine(path)
  }
  /**
   * 计算 p1 到线段 p2-p3 的最短地面距离，单位：米
   */
  getDistanceToSegment(lng1, lat1, lng2, lat2, lng3, lat3){
    let distance = window.AMap.GeometryUtil.distanceToSegment(
      new window.AMap.LngLat(lng1, lat1),
      new window.AMap.LngLat(lng2, lat2),
      new window.AMap.LngLat(lng3, lat3)
    )
    return distance
  }
  /**
   * 经纬度坐标转换为容器像素坐标
   * @param  {[mapObj]} aMap [地图对象]
   * @param  {[float]} lngX [经度]
   * @param  {[float]} latY [纬度]
   * @return {[array]}      [容器像素坐标]
   */
  lnglatTocontainer(aMap, lngX, latY){
    console.log(aMap, lngX, latY)
    if(!aMap || !lngX || !latY){
      return
    }
    let pixel = aMap.lnglatTocontainer([lngX, latY])
    console.log('lnglatTocontainer', pixel)
    return [pixel.getX(), pixel.getY()]
  }
  /**
   * 容器像素坐标转换为经纬度坐标
   * @param  {[mapObj]} aMap   [地图对象]
   * @param  {[int]} pixelX [像素X坐标]
   * @param  {[int]} pixelY [像素Y坐标]
   * @return {[array]}        [经纬度坐标]
   */
  containTolnglat(aMap, pixelX, pixelY){
    console.log(aMap, pixelX, pixelY)
    if(!aMap || !pixelX || !pixelY){
      return
    }
    let lnglat = aMap.containTolnglat(new window.AMap.Pixel(pixelX, pixelY))
    console.log('containTolnglat', lnglat)
    return [lnglat.getLng(), lnglat.getLat()]
  }
  /**
   * 二分法查询目标时间的索引值
   * @param  {[type]} historys   [轨迹数据]
   * @param  {[type]} targetTime [目标时间，当前播放的时间]
   */
  binarySearch(historys, targetTime){
    return trackMathUtil.binarySearch(historys, targetTime)
  }
  /**
   * 排序，去重历史轨迹
   */
  transformHistorys(historys){
    return trackMathUtil.transformHistorys(historys)
  }
}
