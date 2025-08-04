import { gImagePath, windowCenter } from '../../../CodeRoot'
export default class MapGroundImage{
  constructor(aMap, data, type, config){
    this.aMap = aMap
    this.config = config || {}
    this.data = data
    this._groundImage = [] //图层图片
    this._backgroundImage = null //背景底图
    this.type = type || 'mapImage'
    this.isPC = windowCenter.getIsPC()
    this.init()
  }
  init(){
    if (!this.aMap){
      console.log("初始化地图叠加失败！")
      return
    }
    this.addGroundImage()
  }
  /**
   * 添加地图图片覆盖物
   */
  addGroundImage(){
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
    for (let i = 0; i < img_data.length; i++) {
      let item = img_data[i]
      let image = item.img
      let coordinate = JSON.parse(item.coord)
      let url = gImagePath(image) + '?x-oss-process=image/resize,l_' + limitLong
      this._groundImage[i] = this.addImageLayer(url, coordinate)
    }
    if(this.type === 'mapImage'){
      let backgroundImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAPSURBVBhXY/gPBVDG//8Aj4IP8dFqTzkAAAAASUVORK5CYII='
      let bg_coordinate = [{x: -180, y: 90},{x: 180, y: -90}]
      this._backgroundImage = this.addImageLayer(backgroundImage, bg_coordinate, 11)
    }
    this.aMap.add(this.getRoot())
  }
  /**
   * 创建自定义图层
   * @param {[String]} url        [图片链接]
   * @param {[Array]} coordinate [图片位置]
   * @param {[Number]} zIndex     [图层]
   */
  addImageLayer(url, coordinate, zIndex){
    let southWest = new window.AMap.LngLat(
      coordinate[0].x,coordinate[1].y)
    let northEast = new window.AMap.LngLat(
      coordinate[1].x,coordinate[0].y)
    let bounds = new window.AMap.Bounds(southWest, northEast)
    console.log('southWest', southWest)
    console.log('northEast', northEast)
    console.log('bounds', bounds)
    let groundImageOpts = {
        // map: this.aMap,
        url: url,
        bounds: bounds,
        opacity: this.config.opacity || 1,//图片透明度
        zooms: [1,100],
        zIndex: zIndex || 12
      }
    return new window.AMap.ImageLayer(groundImageOpts)
  }
  /**
   * 设置地图覆盖图片透明度
   */
  setOpacity(value){
    if(this._groundImage){
      for (let i = 0; i < this._groundImage.length; i++) {
        this._groundImage[i].setOpacity(value)
      }
    }
    this._backgroundImage && this._backgroundImage.setOpacity(value)
  }
  getRoot(){
    let imageArray = this._groundImage
    if(this._backgroundImage){
      imageArray = imageArray.concat(this._backgroundImage)
    }
    return imageArray
  }
}
