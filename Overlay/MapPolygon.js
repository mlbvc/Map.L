export default class MapPolygon{
  constructor(mapboxgl, data, config, id){
    this.mapboxgl = mapboxgl
    this.config = config || {}
    this.data = data
    this.polygonData = {}
    this.id = id
    this.layout_id = 'polygon_' + id
    this._polygon = null
    this.init()
  }
  init(){
    if (!this.mapboxgl || !this.config){
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
    let coordinates = this.data
    this._polygon = new window.L.polygon(coordinates, {
      color: this.config.strokeColor || '#3388ff',
      fillColor: this.config.fillColor,
      fillOpacity: this.config.fillOpacity,
      opacity: this.config.opacity || 1,
      weight: this.config.strokeWeight || 3,
      className: 'my-polygon'
    })
    this._polygon.addTo(this.mapboxgl)
    this.mapboxgl.fitBounds(this._polygon.getBounds())
  }
  /**
   * 移除多边形
   */
  remove(){
    if (this.mapboxgl.getLayer(this.layout_id)){
      this.mapboxgl.removeLayer(this.layout_id)
    }
    if(this.mapboxgl.getSource(this.layout_id)){
      this.mapboxgl.removeSource(this.layout_id)
    }
  }

  getRoot(){
    return this._polygon
  }
}
