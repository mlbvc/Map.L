export default class MapPolygon{
  constructor(aMap, data, config){
    this.aMap = aMap
    this.config = config || {}
    this.data = data
    this._polygon = null
    this.init()
  }
  init(){
    if (!this.aMap){
      console.log("初始化地图多边形失败！")
      return
    }
    this.addPolygon()
  }
  /**
   * 添加多边形覆盖物
   */
  addPolygon(){
    if(!this.data){
      return
    }
    console.log(this._polygon)
    console.log(this.data)
    this._polygon = new window.AMap.Polygon({
      path: this.data,
      bubble: this.config.bubble === false? false : true,
      strokeColor: this.config.strokeColor || '#b5292d', //线条颜色
      strokeOpacity: this.config.strokeOpacity || 0.9, //轮廓线透明度，取值范围[0,1]
      strokeWeight: this.config.strokeWeight || 3, //轮廓线宽度
      fillColor : this.config.fillColor || 'blue', //多边形填充颜色
      fillOpacity : this.config.fillOpacity || 0.2, //多边形填充透明度，取值范围[0,1]
      lineJoin: this.config.lineJoin || 'round', //折线拐点的绘制样式，默认值为'miter'尖角，其他 'round'圆角、'bevel'斜角
    })
    this.aMap.add(this._polygon)
  }
  getRoot(){
    return this._polygon
  }
}
