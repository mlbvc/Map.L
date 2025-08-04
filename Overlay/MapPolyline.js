export default class MapPolyline{
  /**
   * 构造方法
   * @param {[mapboxgl]} mapboxgl     高德地图对象
   * @param {[Object]} config 折线配置
   * @param {Number} [id=0]   折线ID
   */
  constructor(mapboxgl, config, id = 0){
    this.mapboxgl = mapboxgl
    this.config = config
    this.id = id
    this.layout_id = 'polyline_' + id
    this.polylineData = {}
    this._polyline = null
    this.isHide = false
    this.init()
  }
  /**
   * 初始化圆点标记，加入地图中
   */
  init(){
    if (!this.mapboxgl || !this.config){
      console.log("初始化地图折线失败！")
      return
    }
    const { path } = this.config
    // 修复：使用Canvas渲染器，优化性能减少闪烁
    const renderer = window.L.canvas({ 
      padding: 0.5,
      tolerance: 0 // 减少容差，提高精度
    })
    
    // 修复：计算固定像素宽度，不随zoom变化
    const baseWeight = this.config.strokeWeight || 3
    const currentZoom = this.mapboxgl.getZoom()
    const baseZoom = 13 // 基准zoom级别
    
    this._polyline = new window.L.polyline(path, {
      stroke: true,
      color: this.config.strokeColor || '#3388ff',
      weight: baseWeight, // 使用固定宽度
      opacity: this.config.strokeOpacity || 1,
      // 使用Canvas渲染器
      renderer: renderer,
      // 关键：禁用zoom时的宽度缩放
      smoothFactor: 0,
      noClip: false,
      interactive: false,
      // 添加自定义属性
      pane: 'overlayPane',
      ...this.config
    })
    
    // 存储基础配置
    this._baseWeight = baseWeight
    this._baseZoom = baseZoom
    console.log('path', path , this._polyline.getBounds())
    
    // 修复：监听zoom事件，保持固定线宽
    this.mapboxgl.on('zoom', () => {
      if (this._polyline) {
        // 实时调整线宽，保持视觉上的固定粗细
        const currentZoom = this.mapboxgl.getZoom()
        const zoomDiff = currentZoom - this._baseZoom
        const scaleFactor = Math.pow(2, -zoomDiff * 0.5) // 反向缩放
        const adjustedWeight = Math.max(1, this._baseWeight * scaleFactor)
        
        this._polyline.setStyle({
          weight: adjustedWeight
        })
      }
    })
    
    this.mapboxgl.on('zoomend', () => {
      if (this._polyline && this.config.path) {
        console.log('zoom结束，重置轨迹线')
        // 重新设置坐标，确保位置正确
        this._polyline.setLatLngs(this.config.path)
        // 重置为基础线宽
        this._polyline.setStyle({
          weight: this._baseWeight
        })
      }
    })
    
    // 直接添加到地图
    this._polyline.addTo(this.mapboxgl)
    
    // 注释fitBounds，防止自动缩放
    // path.length > 0 && this.mapboxgl.fitBounds(this._polyline.getBounds())
   
  }
  /**
   * 设置折线数据
   */
  setPath(path){
    this.config.path = path
    if (this._polyline && path && path.length > 0) {
      // 修复：确保坐标格式正确，防止zoom时位置错误
      console.log('MapPolyline setPath - 原始path:', path)
      
      // 验证并转换坐标格式
      const validPath = path.map(point => {
        if (Array.isArray(point) && point.length >= 2) {
          return [point[0], point[1]] // [lat, lng]
        }
        return point
      }).filter(point => 
        Array.isArray(point) && 
        !isNaN(point[0]) && !isNaN(point[1])
      )
      
      console.log('MapPolyline setPath - 处理后path:', validPath)
      this._polyline.setLatLngs(validPath)
    }
  }
  /**
   * 修改折线属性
   */
  setLineColor(color){
    if(color === undefined || color === null){
      return
    }
    this.config.strokeColor = color
    this._polyline.setStyle({
      color
    })
    // this._setPaintProperty('line-color', color)
  }
  /**
   * 修改折线宽度
   */
  setLineWidth(width){
    if(isNaN(width) || width === undefined || width === null){
      return
    }
    this.config.strokeWeight = width
    this._polyline.setStyle({
      weight: width
    })
    // this._setPaintProperty('line-width', width)
  }
  /**
   * 设置折线透明度
   */
  setLineOpacity(opacity){
    if(isNaN(opacity) || opacity === undefined || opacity === null){
      return
    }
    this.config.strokeOpacity = opacity
    this._polyline.setStyle({
      opacity
    })
    // this._setPaintProperty('line-opacity', opacity)
  }
  
  /**
   * 获取折线数据
   */
  getPath(path){
    return this.config.path
  }
  /**
   * 返回ID
   */
  getID(){
    return this.id
  }
  /**
   * 获取是否隐藏折线
   */
  getIsHide(){
    return this.isHide
  }
  /**
   * 获取折线对象
   */
  getRoot(){
    return this.layout_id
  }
  /**
   * 显示折线
   */
  show(){
    this.isHide = false
    // this._setLayoutProperty('visibility', 'visible')
  }
  /**
   * 隐藏折线
   */
  hide(){
    this.isHide = true
    // this._setLayoutProperty('visibility', 'none')
  }
  /**
   * 移除线段
   */
  remove(){
    // 移除事件监听器
    if (this.mapboxgl) {
      this.mapboxgl.off('zoomend')
      this.mapboxgl.off('moveend')
    }
    
    if (this._polyline) {
      this._polyline.remove()
    }
  }
  /**
   * 设置layout属性
   */
  _setLayoutProperty(name, value, options = {}){
    // this.mapboxgl.setLayoutProperty(this.layout_id, name, value, options)
  }
  /**
   * 设置paint属性
   */
  _setPaintProperty(name, value, options = {}){
    console.log(name, value, options = {})
    this._polyline.setStyle()
    // this.mapboxgl.setPaintProperty(this.layout_id, name, value, options)
  }
  /**
   * 获取layout属性
   */
  _getLayoutProperty(name){
    // this.mapboxgl.getLayoutProperty(this.layout_id, name)
  }
  /**
   * 获取paint属性
   */
  _getPaintProperty(name){
    // this.mapboxgl.setPaintProperty(this.layout_id, name)
  }
}
