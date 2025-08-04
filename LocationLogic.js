import TrackMathUtil from './TrackMathUtil'
import OverlayLogic from './OverlayLogic'
import OverlayConfig from './OverlayConfig'
import * as turf from '@turf/turf'

const trackMathUtil = TrackMathUtil.getInstance()
const overlayLogic = OverlayLogic.getInstance()
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
    this.circleMarker = null
    this.mapboxgl = null
  }

  _stopMoveInterval(){
    if(this.moveInterval){
      clearInterval(this.moveInterval)
      this.moveInterval = null
    }
  }
  /**
   * 构造一个Map类的实例
   * @param  {[string]} id [地图容器id]
   */
  initMap(id, options = {}){
    console.log('initMap', id, options)
    if(!id){
      return
    }
    overlayLogic.init()
    let mapObj = new window.L.map(id, {
      center: options.center || [23.13236, 113.258259], // 初始化中心点位置 [纬度, 经度]
      zoom: options.zoom || 13, // 初始化地图层级
      preferCanvas: true, // 默认值false,是否使用 Canvas 来渲染 Path（路径）.默认情况下，所有 Path 都是使用 SVG 进行渲染。
      attributionControl: true, // 是否将 attribution 版权控件添加到地图中。
      zoomControl: true, // 是否将 zoom 缩放控件添加到地图中。
      closePopupOnClick: true, // 点击地图时是否关闭弹窗。
      zoomSnap: 1, //
      minZoom: 1,
      maxZoom: 18,
      // 防闪烁优化配置
      zoomAnimation: true, // 启用缩放动画
      zoomAnimationThreshold: 4, // 缩放动画阈值
      fadeAnimation: true, // 启用淡入淡出动画
      markerZoomAnimation: true, // 标记点缩放动画
      // 性能优化
      renderer: window.L.canvas({ padding: 0.5 }), // 使用Canvas渲染器
      // 图层优化
      updateWhenIdle: true, // 空闲时更新
      updateWhenZooming: false, // 缩放时不更新
      keepBuffer: 2, // 保持缓冲区大小
      zIndex: 101
    })

    // 添加瓦片图层 - 使用高德地图路网
    let gaodeLayer = window.L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1', '2', '3', '4'],
      minZoom: 1,
      maxZoom: 18,
      // 防闪烁优化
      updateWhenIdle: true, // 空闲时更新
      updateWhenZooming: false, // 缩放时不更新
      keepBuffer: 2, // 保持缓冲区
      // 图片渲染优化
      crossOrigin: true, // 跨域支持
      // 缓存优化
      maxNativeZoom: 18, // 最大原生缩放级别
      maxZoom: 18, // 最大缩放级别
      // 性能优化
      tileSize: 256, // 瓦片大小
      zoomOffset: 0, // 缩放偏移
      // 防闪烁设置
      noWrap: false, // 允许瓦片环绕
      bounds: null, // 无边界限制
      // 加载优化
      loadingTimeout: 15000, // 加载超时时间
      updateInterval: 200, // 更新间隔
      zIndex: 99
    }).addTo(mapObj)
    
    // 备用方案：天地图（如果高德地图有问题）
    /*
    let baseLayer = window.L.tileLayer('https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=bd5f2267deee8b7d920515a1ccd9f0cd', {
      minZoom: 1,
      maxZoom: 18,
      zIndex: 1  // 设置底图层级
    }).addTo(mapObj)
    
    let labelLayer = window.L.tileLayer('https://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=bd5f2267deee8b7d920515a1ccd9f0cd', {
      minZoom: 1,
      maxZoom: 18,
      zIndex: 2  // 设置标注图层级，确保在底图之上
    }).addTo(mapObj)
    */
    
    // 确保图层正确加载
    gaodeLayer.on('load', function() {
      console.log('高德地图路网加载完成');
    });
    
    // 如果图层加载失败，尝试重新加载
    gaodeLayer.on('tileerror', function(e) {
      console.warn('高德地图路网加载失败，尝试重新加载');
      setTimeout(() => {
        gaodeLayer.redraw();
      }, 1000);
    });
    
    this.mapboxgl = mapObj
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
    if (len > 3 * 1000) {
      mapObj.setView(new window.L.latLng(targetCenterY, targetCenterX, targetZoom))
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
        mapObj.setView(
          new window.L.latLng(curCenterY, curCenterX),
          curZoom
        );
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
    console.log(mapObjBounds)
    let curCoordinate = []
    if (mapObjBounds && typeof mapObjBounds.getNorthEast === 'function' && typeof mapObjBounds.getSouthWest === 'function') {
      // 东北 西南
      const ne = mapObjBounds.getNorthEast();
      const sw = mapObjBounds.getSouthWest();
      curCoordinate = [
        [sw.lng, ne.lat], // 左上
        [ne.lng, ne.lat], // 右上
        [ne.lng, sw.lat], // 右下
        [sw.lng, sw.lat]  // 左下
      ];
    } else {
      // 其他情况
      console.warn('未知的 getBounds 返回结构', mapObjBounds);
      return;
    }

    console.log(curCoordinate)
    // 当前区域
    let curHeight = this.getDistance(curCoordinate[0][0], curCoordinate[0][1], curCoordinate[3][0], curCoordinate[3][1]) // 矩形左上与左下
    let curWidth = this.getDistance(curCoordinate[0][0], curCoordinate[0][1], curCoordinate[1][0], curCoordinate[1][1]) // 矩形左上与右上

    // 目标区域
    let coordinate = JSON.parse(src_coordinate) // 目标区域坐标
    let targetHeight2 = Number(coordinate[0].y) - Number(coordinate[1].y) //高：左上lat - 右下lat
    let targetWidth2 = Number(coordinate[1].x) - Number(coordinate[0].x) //长：右下lng - 左上lng

    console.log('coordinate', curCoordinate)
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
    // if (mapObj.getBearing() % 180 > 90) {
    //   n0 = this.containTolnglat(mapObj, l2[0], l0[1])
    //   n1 = this.containTolnglat(mapObj, l0[0], l0[1])
    //   // n2 = this.containTolnglat(mapObj, l0[0], l2[1])
    //   n3 = this.containTolnglat(mapObj, l2[0], l2[1])
    // } else {
    //   n0 = this.containTolnglat(mapObj, l0[0], l0[1])
    //   n1 = this.containTolnglat(mapObj, l2[0], l0[1])
    //   // n2 = this.containTolnglat(mapObj, l2[0], l2[1])
    //   n3 = this.containTolnglat(mapObj, l0[0], l2[1])
    // }
    n0 = this.containTolnglat(mapObj, l0[0], l0[1])
    n1 = this.containTolnglat(mapObj, l2[0], l0[1])
    // n2 = this.containTolnglat(mapObj, l2[0], l2[1])
    n3 = this.containTolnglat(mapObj, l0[0], l2[1])

    let targetHeight = this.getDistance(n0[0], n0[1], n3[0], n3[1]) // 矩形左上与左下
    let targetWidth = this.getDistance(n0[0], n0[1], n1[0], n1[1]) // 矩形左上与右上
    
    console.log(l0, l2, n0, n1, n3)

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
    zoom = zoom > 18 ? 18 : zoom

    console.log(Number(coordinate[0].x) + targetWidth2 / 2, Number(coordinate[0].y) - targetHeight2 / 2)
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
      // let config = {
      //   showMarker: false,
      //   // showCircle: false,
      //   panToLocation: true,
      //   zoomToAccuracy: false
      // }
      // let geolocation = this.initGeolocation(mapObj, config)
      // this.getCurrentPosition(geolocation, mapObj, config)
      // mapObj.setZoom(16)
      return
    }

    let param = this.getBounds(mapObj, data)

    // 偏移到目标中心点并设置地图层级
    mapObj.setView(
      new window.L.latLng([param.y, param.x]),
      param.zoom + ratio
    );

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
    // Leaflet 不支持地图旋转，只能通过 CSS 旋转整个地图容器
    // 注意：这种方式会影响所有控件和交互
    const mapContainer = mapObj.getContainer();
    // if (mapContainer) {
    //   mapContainer.style.transform = `rotate(${angle}deg)`;
    // }
    console.warn('Leaflet 不支持原生地图旋转，已使用 CSS 旋转整个容器');
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
    // 设置地图鼠标样式
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
    //       })
    // return geolocation
  }
  /**
   * 获取当前定位
   */
  getCurrentPosition(mapObj, geolocation, config = {}){
    console.log('getCurrentPosition')
    let showMarker = config.showMarker === false? false : true
    let panToLocation = config.panToLocation === true? true : false
    let zoomToAccuracy = config.zoomToAccuracy === true? true : false
    geolocation.getCurrentPosition((status,result)=>{
      if(status === 'complete'){
        let lng = result.position.lng
        let lat = result.position.lat
        if(showMarker){
          if(this.circleMarker){
            console.log('this.maker')
            this.circleMarker.setLatLng(new window.L.latLng(lat, lng))
            return
          }
          let el = document.createElement("div")
          el.innerHTML = OverlayConfig.LocationMarker.content
          let config = {
            ...OverlayConfig.LocationMarker,
            position: [lat, lng],
            color: '#000',
            circleMarkerSize: 14,
            element: el
          }
          this.circleMarker = new window.L.Marker(config).setLatLng(new window.L.latLng(lat, lng)).addTo(mapObj)
        }
        panToLocation && mapObj.panTo(new window.L.latLng(lat, lng))
        const corner = window.L.latLng(lat, lng)
        const bounds = window.L.latLngBounds(corner, corner)
        zoomToAccuracy && mapObj.fitBounds(bounds)
      }
    })
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
    for (let i = 0; i < controls.length; i++) {
      let item = controls[i] || ''
      let opt = options[item] || {}
      console.log('mapObj', mapObj)
      console.log('item', item)
      console.log('opt1', opt)
      switch (opt.position) {
        case 'LT':
          opt.position = 'topleft'
          break;
        case 'LB':
          opt.position = 'bottomleft'
          break;
        case 'RB':
          opt.position = 'bottomright'
          break;
        case 'RT':
          opt.position = 'topright'
          break;
        default:
      }
      console.log('opt2', opt)
      switch (item) {
        case 'AMap.Scale':
          console.log(window.L.control.scale(opt))
          // retControl[i] = window.L.control.scale(opt)
          console.log(retControl[i])
          // mapObj.addControl(retControl[i])
          // retControl[i] = window.L.control.scale(opt).addTo(mapObj)
          break;
        case 'AMap.ToolBar':
          // retControl[i] = window.L.control.layers(opt)
          // console.log(retControl[i])
          // mapObj.addControl(retControl[i])
          // retControl[i] = window.L.control.layers(opt).onAdd(mapObj)
          // retControl[i] = window.L.control.layers(opt).addTo(mapObj)
          break;
        default:
      }
    }
    return retControl
  }
  /**
   * 显示地图组件
   */
  showControl(data){
    let el = document.querySelector('.mapboxgl-control-container')
    if(el){
      el.style.display = ""
    }
  }
  /**
   * 隐藏地图组件
   */
  hiddenControl(data){
    let el = document.querySelector('.mapboxgl-control-container')
    if(el){
      el.style.display = "none"
    }
  }
  /**
   * 计算两个经纬度的距离 单位米
   */
  getDistance(lng1, lat1, lng2, lat2){
    // const from = turf.point([lng1, lat1])
    // const to = turf.point([lng2, lat2])
    // const distance = turf.distance(from, to, { units: 'meters' })
    const distance = this.mapboxgl.distance(window.L.latLng(lat1, lng1), window.L.latLng(lat2, lng2))
    // console.log('新getDistance', distance)
    console.log('欣欣distance', distance)
    return distance
  }
  /**
   * 计算线段距离 单位米
   * @param  {[array]} path [线段数组]
   */
  getDistanceOfLine(path){
    // turf.lineString(path)需要传入一个二维数组，每个子数组包含两个元素，分别是经度和纬度
    if (!Array.isArray(path) || path.length < 2) {
      return 0
    }
    let distance = 0
    // let res = 0
    // 检查每个点是否为有效的经纬度数组
    // for (let i = 0; i < path.length; i++) {
    //   if (!Array.isArray(path[i]) || path[i].length !== 2) {
    //     return;
    //   }
    //   if (i !== path.length -1) {
    //     res += this.mapboxgl.distance(window.L.latLng(path[i][1], path[i][0]), window.L.latLng(path[i+1][1], path[i+1][0]))
    //   }
    // }
    const line = turf.lineString(path)
    // console.log('原来getDistanceOfLine', window.AMap.GeometryUtil.distanceOfLine(path))
    distance = turf.length(line, { units: 'meters' })
    return distance
  }
  /**
   * 计算 p1 到线段 p2-p3 的最短地面距离，单位：米
   */
  getDistanceToSegment(lng1, lat1, lng2, lat2, lng3, lat3){
    // let distance = window.AMap.GeometryUtil.distanceToSegment(
    //   new window.AMap.LngLat(lng1, lat1),
    //   new window.AMap.LngLat(lng2, lat2),
    //   new window.AMap.LngLat(lng3, lat3)
    //  )
     // 构造点
    const pt = turf.point([lng1, lat1]);
    // // 构造线段
    const line = turf.lineString([
      [lng2, lat2],
      [lng3, lat3]
    ]);
    // 计算距离（单位：米）
    // console.log('原来getDistanceToSegment', distance)
    const distance = turf.pointToLineDistance(pt, line, { units: 'meters' })
    return distance
  }

  // ========== 图层管理方法 ==========
  
  /**
   * 获取图层管理器
   */
  getLayerManager() {
    return this.layerManager;
  }

  /**
   * 通过ID获取图层
   * @param {String} layerId - 图层标识
   */
  getLayerById(layerId) {
    return this.layerManager ? this.layerManager.getLayerById(layerId) : null;
  }

  /**
   * 通过图层类型获取图层
   * @param {Function} layerType - 图层类型构造函数
   */
  getLayersByType(layerType) {
    return this.layerManager ? this.layerManager.getLayersByType(layerType) : [];
  }

  /**
   * 获取所有图片图层
   */
  getImageLayers() {
    return this.layerManager ? this.layerManager.getImageLayers() : [];
  }

  /**
   * 获取所有标记图层
   */
  getMarkerLayers() {
    return this.layerManager ? this.layerManager.getMarkerLayers() : [];
  }

  /**
   * 设置图层透明度
   * @param {Object|Array} layers - 图层对象或图层数组
   * @param {Number} opacity - 透明度值 (0-1)
   */
  setLayerOpacity(layers, opacity) {
    if (this.layerManager) {
      this.layerManager.setLayerOpacity(layers, opacity);
    }
  }

  /**
   * 设置所有图片图层透明度
   * @param {Number} opacity - 透明度值 (0-1)
   */
  setImageLayersOpacity(opacity) {
    if (this.layerManager) {
      this.layerManager.setImageLayersOpacity(opacity);
    }
  }

  /**
   * 移除图层
   * @param {Object|Array} layers - 图层对象或图层数组
   */
  removeLayers(layers) {
    if (this.layerManager) {
      this.layerManager.removeLayers(layers);
    }
  }

  /**
   * 获取所有图层信息
   */
  getAllLayersInfo() {
    if (this.layerManager) {
      this.layerManager.printLayerInfo();
    }
  }
  /**
   * 经纬度坐标转换为容器像素坐标
   * @param  {[mapObj]} mapObj [地图对象]
   * @param  {[float]} lngX [经度]
   * @param  {[float]} latY [纬度]
   * @return {[array]}      [容器像素坐标]
   */
  lnglatTocontainer(mapObj, lngX, latY){
    console.log(lngX, latY)
    if(!mapObj || !lngX || !latY){
      return
    }
    const pixel = mapObj.latLngToContainerPoint(new window.L.latLng(latY, lngX));
    console.log('pixel', pixel)
    return [pixel.x, pixel.y];
  }
  /**
   * 容器像素坐标转换为经纬度坐标
   * @param  {[mapObj]} mapObj   [地图对象]
   * @param  {[int]} pixelX [像素X坐标]
   * @param  {[int]} pixelY [像素Y坐标]
   * @return {[array]}        [经纬度坐标]
   */
  containTolnglat(mapObj, pixelX, pixelY){
    console.log(pixelX, pixelY)
    if(!mapObj || !pixelX || !pixelY){
      return
    }
    const lnglat = mapObj.containerPointToLatLng(new window.L.point(pixelX, pixelY));
    console.log('lnglat', lnglat)
    return [lnglat.lng, lnglat.lat];
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
