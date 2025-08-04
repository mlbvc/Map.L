import GPS from '../../Common/Utils/GPS'
import MapGroundImage from './Overlay/MapGroundImage'
import MapPolygon from './Overlay/MapPolygon'
import MapPolyline from './Overlay/MapPolyline'
import OverlayConfig from './OverlayConfig'
import MapType from './MapType'
import BroadcastCenter from '../../Framework/Broadcast/BroadcastCenter'
const gps = GPS.getInstance()
const broadcastCenter = BroadcastCenter.getInstance()
const allMapFeatures = ['bg','point','road','building']
const enclosureType = {
  '0': 'NORMAL',
  '1': 'SAFE',
  '2': 'DANGER'
}
//谷歌卫星图
const googleMapSatelliteLayer = new window.AMap.TileLayer({
  getTileUrl: function(x, y, z){
    let curPos = gps.calculationLatlng(x, y, z)
    //澳门谷歌卫星图出错区域
    let inMacaoError = z >= 12 && window.AMap.GeometryUtil.isPointInRing([curPos.lng, curPos.lat], [
      [113.63301516112768, 22.112849526726297],
      [113.63301516112768, 22.208693962686002],
      [113.54369310872157, 22.208693962686002],
      [113.54369310872157, 22.112849526726297]
    ])
    //香港谷歌卫星图出错区域
    let inHkError = z >= 12 && window.AMap.GeometryUtil.isPointInRing([curPos.lng, curPos.lat], [
      [113.90574163728911, 22.4403070651439],
      [113.90639272896364, 22.521559198512975],
      [114.1256616418024, 22.516848239580323],
      [114.1259228280804, 22.55736165002399],
      [114.34579523633012, 22.556401162647894],
      [114.3451085908223, 22.516791354897254],
      [114.43250864307385, 22.521106770532864],
      [114.43266183625083, 22.276860846720247],
      [114.34511453400474, 22.277813937877962],
      [114.34511453400474, 22.151139887830286],
      [113.90553930603288, 22.151162788920253],
      [113.86149513680871, 22.151162788920253],
      [113.86149513680871, 22.196263480159704],
      [113.8178331131007, 22.196263480159704],
      [113.8178331131007, 22.439817177916446]
    ])
    if(inMacaoError || inHkError){
      // 高德替换谷歌出错的瓦片
      // return 'http://wprd0'+ (Math.floor(Math.random() * 4) + 1).toString() +  '.is.autonavi.com/appmaptile?x=' + x + '&y=' + y + '&z=' + z + '&lang=zh_cn&size=1&scl=1&style=6'

      // 腾讯替换谷歌出错的瓦片
      let tencentY = parseInt( Math.pow(2, z).toString(), 10) - 1 - y
      return 'https://p' + Math.floor(Math.random() * 4) +'.map.gtimg.com/sateTiles/' + z + '/' + Math.floor(x / 16.0) + '/' + Math.floor(tencentY / 16.0) + '/' + x + '_' + tencentY + '.jpg'
    }
    //谷歌瓦片url mt{0,1,2,3,} lyrs：m(路线图) t(地形图) p(带标签的地形图) s(卫星图) y(带标签的卫星图) h(标签层)
    return 'https://mt' + Math.floor(Math.random() * 4) + '.google.cn/vt/lyrs=s&hl=zh-CN&gl=cn&x='+ x + '&y=' + y + '&z=' + z + '&s=Galile'
  }
})
//高德卫星图
// const googleMapSatelliteLayer = new window.AMap.TileLayer.Satellite()
//高德路网
const roadNetLayer = new window.L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
  subdomains: ['1', '2', '3', '4'],
  minZoom: 1,
  maxZoom: 18
})

export default class StaticOverlayLogic{
  static getInstance(){
    if(!this._instance){
      this._instance = new StaticOverlayLogic()
    }
    return this._instance
  }
  constructor(){
    //添加设置覆盖地图透明度监听
    broadcastCenter.addEventListener(
      "onChangeMapOptEvent", this._onChangeMapOptEvent.bind(this))
  }
  init(){
    this.polygonArray = []
    this.polylineArray = []
    this.groundImageOpacity = 1
    this.Maptype = null
  }
  /**
   * 删除所有覆盖物对象
   * @param  {[mapbox]} mapbox [地图对象]
   */
  removeAllStaticItem(mapbox){
    if (!mapbox){
      return
    }
    this.removeGroundImage(mapbox)
    this.removePolygon(mapbox)
    this.removePolyline(mapbox)
    
    // 移除卫星图层和路网图层
    mapbox.removeLayer(this.satelliteLayer)
    mapbox.removeLayer(this.roadNetLayer)
  }
  /**
   * 绘制路线
   * @param  {[Object]} mapbox        [地图对象]
   * @param  {[Object]} data        [地图数据]
   */
  drawRoute(mapbox, data){
    if(!data || !data.map_draw){
      return
    }
    for (let i = 0; i < data.map_draw.length; i++) {
      let path = []
      let item = data.map_draw[i]
      let content = JSON.parse(item.content)
      for (let j = 0; j < content.length; j++) {
        let position = content[j].split(",")
        path.push([position[1], position[0]])
      }
      let config = {
        ...OverlayConfig.RoutePolyline,
        path:path
      }
      if(item.color){
        config.strokeColor = item.color
      }
      this.polylineArray.push(new MapPolyline(mapbox, config, 'static_draw_route_' + i))
    }
  }
  /**
   * 更新多边形覆盖物
   * @param  {[Object]} mapbox        [地图对象]
   * @param  {[Object]} data        [地图数据]
   */
  updatePolygon(mapbox, data){
    if(!data){
      return
    }
    for (let i = 0; i < data.length; i++) {
      let content = JSON.parse(data[i].content)
      let type = data[i].type
      let id = data[i].id
      let path = []
      for (let j = 0; j < content.length; j++) {
        // lng-x, lat-y
        path.push([content[j].y,content[j].x])
      }
      this.polygonArray.push(
        new MapPolygon(mapbox, path, OverlayConfig.Polygon[enclosureType[type]], "static_polygon" + id))
    }
  }
  /**
   * 更新图片覆盖物
   * @param  {[Object]} mapbox        [地图对象]
   * @param  {[Object]} data        [地图数据]
   * @param  {Object} [config={}] [图片覆盖物配置属性]
   */
  updateGroundImage(mapbox, data, config={}){
    console.log('isHasGroundImage', this.hasGroundImage(data))
    console.log('updateGroundImage', data, config)
    if(this.hasGroundImage(data)){
      this.groundImageObj = new MapGroundImage(mapbox, data, 'mapImage', config)
      this.Maptype = MapType.CUSTOM
      console.log('this.groundImageObj', this.groundImageObj)
    }else{
      // debugger
      // mapbox.setFeatures(allMapFeatures)
      // 标注图层 - 显示中文街道名称
      window.L.tileLayer('https://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=bd5f2267deee8b7d920515a1ccd9f0cd', {
        // subdomains: [0, 1, 2, 3, 4, 5, 6, 7],
        minZoom: 1,
        maxZoom: 18
      }).addTo(mapbox)

      window.L.tileLayer('https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=bd5f2267deee8b7d920515a1ccd9f0cd', {
        // attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        // subdomains: [0, 1, 2, 3, 4, 5, 6, 7],
        maxZoom: 18
      }).addTo(mapbox)
      
      // 如果需要显示路网
      window.L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        subdomains: ['1', '2', '3', '4'],
        minZoom: 1,
        maxZoom: 18
      }).addTo(mapbox)
    }
  }
  /**
   * 是否有地图叠加图片
   * @param  {[object]}  data [地图信息]
   */
  hasGroundImage(data){
    if(data){
      let hasMapImage = data.map_image && data.map_image.img_data
      let hasImageCoordinate = data.image_coordinate || data.default_image_coordinate
      if(hasMapImage && hasImageCoordinate){
        return true
      }
      return false
    }
    return false
  }
  /**
   * 设置覆盖图层
   */
  setMapLayer(mapbox, type, isRoadNet){
    this.Maptype = type
    switch (type) {
      case MapType.NORMAL:
        this._updateMapLayer(mapbox, allMapFeatures, 0, false)
        break;
      case MapType.CUSTOM:
        this._updateMapLayer(mapbox, [], this.groundImageOpacity, false)
        break;
      case MapType.SATELLITE:
        if(isRoadNet){
          this._updateMapLayer(mapbox, ['point'], 0, true, isRoadNet)
        }
        else{
          this._updateMapLayer(mapbox, [], 0, true, isRoadNet)
        }
        break;
      default:
    }
  }
  /**
   * 移除图片覆盖物
   */
  removeGroundImage(mapbox){
    if(!mapbox || !this.groundImageObj){
      return
    }
    mapbox.remove(this.groundImageObj.getRoot())
  }
  /**
   * 移除多边形
   */
  removePolygon(mapbox){
    for (let i = 0; i < this.polygonArray.length; i++) {
      let item = this.polygonArray[i]
      item && item.remove()
    }
  }
  /**
   * 移除地图路线
   */
  removePolyline(mapbox){
    if(this.polylineArray.length <= 0){
      return
    }
    for (let i = 0; i < this.polylineArray.length; i++) {
      let item = this.polylineArray[i]
      item.remove()
    }
  }
  /**
   * 更新地图类型
   * @param  {[type]} mapbox          [地图对象]
   * @param  {[type]} features      [标准地图显示内容]
   * @param  {[type]} opacity       [定制地图透明度]
   * @param  {[type]} showSatellite [是否显示卫星地图]
   */
  _updateMapLayer(mapbox, features, opacity, showSatellite, isRoadNet = false){
    console.log('mapbox', opacity, features, showSatellite, isRoadNet)
    
    // Leaflet 地图处理
    if (mapbox && typeof mapbox.addLayer === 'function') {
     
      // 设置自定义地图透明度
      this.groundImageObj && this.groundImageObj.setOpacity(opacity)
      
      // 如果需要显示卫星图
      if(showSatellite){
        // 创建卫星图层
        window.L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
          subdomains: ['1', '2', '3', '4'],
          minZoom: 1,
          maxZoom: 18
        }).addTo(mapbox)
        
        // 如果需要显示路网
        if(isRoadNet){
          window.L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1', '2', '3', '4'],
            minZoom: 1,
            maxZoom: 18
          }).addTo(mapbox)
        }
      }
    }
  }
  /**
   * 设置覆盖地图透明度
   */
  _onChangeMapOptEvent(data){
    this.groundImageOpacity = Number(data.value/100)
    if(this.Maptype === MapType.CUSTOM){
      this.groundImageObj && this.groundImageObj.setOpacity(this.groundImageOpacity)
    }
  }
}
