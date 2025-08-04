
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
      // let server = (Math.floor(Math.random() * 4) + 1)
      // return 'https://wprd0'+ server +  '.is.autonavi.com/appmaptile?x=' + x + '&y=' + y + '&z=' + z + '&lang=zh_cn&size=1&scl=1&style=6'

      // 腾讯替换谷歌出错的瓦片
      let server = Math.floor(Math.random() * 4)
      let tencentY = parseInt( Math.pow(2, z).toString(), 10) - 1 - y
      return 'https://p' + server +'.map.gtimg.com/sateTiles/' + z + '/' + Math.floor(x / 16.0) + '/' + Math.floor(tencentY / 16.0) + '/' + x + '_' + tencentY + '.jpg'
    }
    //谷歌瓦片url mt{0,1,2,3} lyrs：m(路线图) t(地形图) p(带标签的地形图) s(卫星图) y(带标签的卫星图) h(标签层)
    let server = Math.floor(Math.random() * 4)
    return 'https://mt' + server + '.google.cn/vt/lyrs=s&hl=zh-CN&gl=cn&x='+ x + '&y=' + y + '&z=' + z + '&s=Galile'
  }
})
//高德卫星图
// const googleMapSatelliteLayer = new window.AMap.TileLayer.Satellite()
//高德路网
const roadNetLayer = new window.AMap.TileLayer.RoadNet()
// OSM图层
const osmLayer = new window.AMap.TileLayer({
  getTileUrl: function(x, y, z){
    let curPos = gps.calculationLatlng(x, y, z)
    // 是否在中国境内
    let inChina = z > 10 && window.AMap.GeometryUtil.isPointInRing([curPos.lng, curPos.lat], [
      [135.0831930000, 53.5535450000],
      [135.0831930000, 18.1671020000],
      [73.5054650000, 18.1671020000],
      [73.5054650000, 53.5535450000]
    ])
    if(inChina){
      let server = (Math.floor(Math.random() * 4) + 1)
      return 'https://wprd0'+ server +  '.is.autonavi.com/appmaptile?x=' + x + '&y=' + y + '&z=' + z + '&lang=zh_cn&size=1&scl=1&style=7'
    }
    let server = ['a', 'b', 'c']
    let index = Math.floor(Math.random() * server.length + 1) - 1
    return 'https://' + server[index] + '.tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png'
  }
})
//腾讯卫星图
const tencentLayer = new window.AMap.TileLayer({
  getTileUrl: function(x, y, z){
    // 腾讯瓦片
    let server = Math.floor(Math.random() * 4)
    let tencentY = parseInt( Math.pow(2, z).toString(), 10) - 1 - y
    return 'https://p' + server +'.map.gtimg.com/sateTiles/' + z + '/' + Math.floor(x / 16.0) + '/' + Math.floor(tencentY / 16.0) + '/' + x + '_' + tencentY + '.jpg'
  }
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
   * @param  {[Amap]} aMap [地图对象]
   */
  removeAllStaticItem(aMap){
    if (!aMap){
      return
    }
    this.removeGroundImage(aMap)
    this.removePolygon(aMap)
    this.removePolyline(aMap)
    googleMapSatelliteLayer.setMap(null)
    roadNetLayer.setMap(null)
    osmLayer.setMap(null)
  }
  /**
   * 绘制路线
   * @param  {[Object]} aMap        [地图对象]
   * @param  {[Object]} data        [地图数据]
   */
  drawRoute(aMap, data){
    if(!data || !data.map_draw){
      return
    }
    for (let i = 0; i < data.map_draw.length; i++) {
      let path = []
      let item = data.map_draw[i]
      let content = JSON.parse(item.content)
      for (let j = 0; j < content.length; j++) {
        let position = content[j].split(",")
        path.push(new window.AMap.LngLat(position[1], position[0]))
      }
      let config = {
        ...OverlayConfig.RoutePolyline,
        path:path
      }
      if(item.color){
        config.strokeColor = item.color
      }
      this.polylineArray.push(
        new MapPolyline(aMap, config))
    }
  }
  /**
   * 更新多边形覆盖物
   * @param  {[Object]} aMap        [地图对象]
   * @param  {[Object]} data        [地图数据]
   */
  updatePolygon(aMap, data){
    if(!data){
      return
    }
    for (let i = 0; i < data.length; i++) {
      let content = JSON.parse(data[i].content)
      let type = data[i].type
      let path = []
      for (let j = 0; j < content.length; j++) {
        path.push(new window.AMap.LngLat(content[j].x,content[j].y))
      }
      this.polygonArray.push(
        new MapPolygon(aMap, path, OverlayConfig.Polygon[enclosureType[type]]))
    }
  }
  /**
   * 更新图片覆盖物
   * @param  {[Object]} aMap        [地图对象]
   * @param  {[Object]} data        [地图数据]
   * @param  {Object} [config={}] [图片覆盖物配置属性]
   */
  updateGroundImage(aMap, data, config={}){
    let hasGroundImage = this.hasGroundImage(data)
    if(hasGroundImage){
      this.groundImageObj = new MapGroundImage(aMap, data, 'mapImage', config)
    }
    // 检查是否选定地图
    if (data.default_map_select > 0) {
      console.log("asdfasdfsd")
      this.setMapLayer(aMap, data.default_map_select)
    // 检查是否有定制图层
    }else if(hasGroundImage) {
      this.setMapLayer(aMap, MapType.CUSTOM)
    // 否则默认就是标准图
    }else{
      this.setMapLayer(aMap, MapType.NORMAL)
    }
  }
  /**
   * 是否有地图叠加图片
   * @param  {[object]}  data [地图信息]
   */
  hasGroundImage(data){
    console.log(167,'data',data)
    if(data){
      let hasMapImage = data.map_image && data.map_image.img_data
      let hasImageCoordinate = data.image_coordinate || data.default_image_coordinate
      console.log(hasMapImage, hasImageCoordinate)
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
  setMapLayer(aMap, type, isRoadNet){
    this.Maptype = type
    let features = []
    let roadNetMap = null
    if(isRoadNet){
      features = ['point']
      roadNetMap = aMap
    }

    switch (type) {
      case MapType.NORMAL:
        this._updateMapLayer(aMap, allMapFeatures, 0, null, null, null, null)
        break;
      case MapType.CUSTOM:
        this._updateMapLayer(aMap, [], this.groundImageOpacity, null, null, null, null)
        break;
      case MapType.SATELLITE:
        this._updateMapLayer(aMap, features, 0, aMap, roadNetMap, null, null)
        break;
      case MapType.OSM:
        this._updateMapLayer(aMap, [], 0, null, null, aMap, null)
        break;
      case MapType.TENCENT:
        this._updateMapLayer(aMap, features, 0, null, roadNetMap, null, aMap)
        break;
      default:
    }
  }
  /**
   * 移除图片覆盖物
   */
  removeGroundImage(aMap){
    if(!aMap || !this.groundImageObj){
      return
    }
    aMap.remove(this.groundImageObj.getRoot())
  }
  /**
   * 移除多边形
   */
  removePolygon(aMap){
    if(this.polygonArray.length <= 0){
      return
    }
    for (let i = 0; i < this.polygonArray.length; i++) {
      let item = this.polygonArray[i]
      aMap.remove(item.getRoot())
    }
  }
  /**
   * 移除地图路线
   */
  removePolyline(aMap){
    if(this.polylineArray.length <= 0){
      return
    }
    for (let i = 0; i < this.polylineArray.length; i++) {
      let item = this.polylineArray[i]
      aMap.remove(item.getRoot())
    }
  }
  /**
   * 更新地图类型
   * @param  {[object]} aMap          [地图对象]
   * @param  {[array]} features       [标准地图显示内容]
   * @param  {[number]} opacity       [定制地图透明度]
   * @param  {[object]} satelliteMap  [卫星图层地图对象]
   * @param  {[object]} roadNetMap    [路网图层地图对象]
   * @param  {[object]} osmMap        [osm图层地图对象]
   * @param  {[object]} tencentMap    [腾讯图层地图对象]
   */
  _updateMapLayer(aMap, features, opacity, satelliteMap, roadNetMap, osmMap, tencentMap){
    aMap.setFeatures(features)
    this.groundImageObj && this.groundImageObj.setOpacity(opacity)
    googleMapSatelliteLayer.setMap(satelliteMap)
    roadNetLayer.setMap(roadNetMap)
    osmLayer.setMap(osmMap)
    tencentLayer.setMap(tencentMap)
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
