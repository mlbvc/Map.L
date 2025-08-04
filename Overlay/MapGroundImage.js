import { gImagePath, windowCenter } from '../../../CodeRoot'
export default class MapGroundImage{
  constructor(mapboxgl, data, type, config){
    this.mapboxgl = mapboxgl
    this.config = config || {}
    this.data = data
    this._groundImage = [] //图层图片
    this._backgroundImage = null //背景底图
    this.type = type || 'mapImage'
    this.isPC = windowCenter.getIsPC()
    this._imageCache = new Map() // 图片缓存
    this._loadedImages = new Set() // 已加载的图片
    // this._zoomOptimizer = null // 缩放优化器
    this.init()
  }
  init(){
    if (!this.mapboxgl){
      console.log("初始化地图叠加失败！")
      return
    }
    this.addGroundImage()
  }
  
  /**
   * 预加载图片
   * @param {string} url 图片URL
   * @returns {Promise} 加载完成的Promise
   */
  preloadImage(url) {
    if (this._imageCache.has(url)) {
      return Promise.resolve(this._imageCache.get(url))
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this._imageCache.set(url, img)
        this._loadedImages.add(url)
        resolve(img)
      }
      img.onerror = reject
      img.src = url
    })
  }
  
  /**
   * 添加地图图片覆盖物
   */
  async addGroundImage(){
    if(!this.data){
      return
    }
    let map_image = this.data.map_image || {}
    let img_data = map_image.img_data || []
    let image_coordinate = this.data.image_coordinate || this.data.default_image_coordinate
    if(!(img_data && img_data.length > 0) || !image_coordinate){
      console.log("未设置地图覆盖图片或图片经纬度")
      return
    }
    let limitLong = 4096
    if(!this.isPC){
      limitLong = 2048
    }
    if(this.type === 'signImage'){
      limitLong = 1024
    }
    
    // 预加载所有图片
    const imagePromises = []
    for (let i = 0; i < img_data.length; i++) {
      let item = img_data[i]
      let image = item.img
      let coordinate = JSON.parse(item.coord)
      let url = gImagePath(image) + '?x-oss-process=image/resize,l_' + limitLong
      imagePromises.push(this.preloadImage(url))
    }
    
    try {
      // 等待所有图片加载完成
      await Promise.all(imagePromises)
      
      // 添加图片图层
      for (let i = 0; i < img_data.length; i++) {
        let item = img_data[i]
        let image = item.img
        let coordinate = JSON.parse(item.coord)
        let url = gImagePath(image) + '?x-oss-process=image/resize,l_' + limitLong
        this._groundImage[i] = this.addImageLayer(url, coordinate)
        
        // 添加到缩放优化器
        // if (this._zoomOptimizer && this._groundImage[i]) {
        //   this._zoomOptimizer.addImageLayer(this._groundImage[i])
        // }
      }
      
      if(this.type === 'mapImage'){
        let backgroundImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAPSURBVBhXY/gPBVDG//8Aj4IP8dFqTzkAAAAASUVORK5CYII='
        let bg_coordinate = [{x: -180, y: 90},{x: 180, y: -90}]
        this._backgroundImage = this.addImageLayer(backgroundImage, bg_coordinate, 11)
        
        // 添加到缩放优化器
        // if (this._zoomOptimizer && this._backgroundImage) {
        //   this._zoomOptimizer.addImageLayer(this._backgroundImage)
        // }
      }
    } catch (error) {
      console.error('图片加载失败:', error)
    }
  }
  
  /**
   * 创建自定义图层
   * @param {[String]} url        [图片链接]
   * @param {[Array]} coordinate [图片位置]
   * @param {[Number]} zIndex     [图层]
   */
  addImageLayer(url, coordinate, zIndex){
    const northWest = window.L.latLng(coordinate[0].y, coordinate[0].x)
    const southEast = window.L.latLng(coordinate[1].y, coordinate[1].x)
    const bounds = window.L.latLngBounds(northWest, southEast)
       
    // 添加图片图层，设置防闪烁选项
    const imageLayer = window.L.imageOverlay(url, bounds, {
      zIndex: zIndex || 100,
      opacity: this.config.opacity || 1,
      interactive: false, // 禁用交互，减少渲染负担
      className: 'map-ground-image-layer' // 添加CSS类名便于样式控制
    }).addTo(this.mapboxgl)

    // 添加图层加载完成事件监听
    imageLayer.on('load', () => {
      console.log('图片图层加载完成:', url)
    })

    return imageLayer
  }
  
  /**
   * 设置地图覆盖图片透明度
   */
  setOpacity(value){
    if (this._groundImage) {
      for (let i = 0; i < this._groundImage.length; i++) {
        if (this._groundImage[i] && this._groundImage[i].setOpacity) {
          this._groundImage[i].setOpacity(value)
        }
      }
    }
    if (this._backgroundImage && this._backgroundImage.setOpacity) {
      this._backgroundImage.setOpacity(value)
    }
  }
  
  /**
   * 清除图片缓存
   */
  clearImageCache() {
    this._imageCache.clear()
    this._loadedImages.clear()
  }
  
  /**
   * 获取所有图层
   */
  getRoot() {
    let imageArray = this._groundImage || [];
    if (this._backgroundImage) {
      imageArray = imageArray.concat(this._backgroundImage);
    }
    return imageArray;
  }
}

