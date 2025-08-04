import MapGroundImage from './Overlay/MapGroundImage'
import { locationLogic } from "../../CodeRoot"
export default class SignImageLogic{
  static getInstance(){
    if(!this._instance){
      this._instance = new SignImageLogic()
    }
    return this._instance
  }
  constructor(){
    this.init()
  }
  init(){
    this.signImage = {} //签到点图片
    this.rotationInterval = null //旋转定时器
    this.currentAngle = 0 //当前旋转角度
    this.defaultAngle = 0 //默认旋转角度
  }
  /**
   * 初始化签到点图片
   * @param  {[Object]} mapboxgl        [地图对象]
   * @param  {[Object]} map_info        [地图覆盖图片信息]
   * @param  {[Array]} sign_image_info [签到点图片信息]
   */
  initSignImage(mapboxgl, map_info, sign_image_info){
    this.init()
    this.currentAngle = map_info.map_angle || 0
    this.defaultAngle = map_info.map_angle || 0
    for (let i = 0; i < sign_image_info.length; i++) {
      let item = sign_image_info[i]
      if(item.img){
        //创建签到点图片
        let groundImageData = {
          ...map_info,
          map_image: item.img
        }
        let config = {}
        if(!this.signImage[item.id]){
          let signImage = new MapGroundImage(
            mapboxgl, groundImageData, 'signImage' ,config)
          console.log('signImage', signImage)
          this.signImage[item.id] = signImage
          this.signImage[item.id].setOpacity(0)
        }
      }
    }
  }
  /**
   * 更新签到点图片
   * @param  {[Object]} mapboxgl            [地图对象]
   * @param  {[Object]} map_info        [地图覆盖图片信息]
   * @param  {[Object]} sign_image_info [签到点图片信息]
   * @param  {Object} [config={}]     [签到点图片配置]
   */
  updateSignImage(mapboxgl, map_info, sign_image_info, config={}){
    if(!mapboxgl || !map_info || !sign_image_info){
      return
    }
    let curZoom = mapboxgl.getZoom()
    this._stopRotation()
    for(let key in this.signImage){
      this.signImage[key] && this.signImage[key].setOpacity(0)
    }
    if(Number(sign_image_info.id) < 0){
      //选择无签到点图片，角度设为0
      this.currentAngle = this.defaultAngle
    }
    else{
      if(sign_image_info.img){
        this.signImage[sign_image_info.id] && this.signImage[sign_image_info.id].setOpacity(1)
          // 缩放并且平移至显示范围
          if(sign_image_info.bounds){
            let bounds = JSON.parse(sign_image_info.bounds)
            let x1 = bounds[0].x
            let y1 = bounds[0].y
            let x2 = bounds[1].x
            let y2 = bounds[1].y
            if(x1 > x2){
              [x1,x2] = [x2,x1];
            }
            if(y2 > y1){
              [y1,y2] = [y2,y1];
            }
            let boundsData = {
              src_coordinate : JSON.stringify([{x: x1, y: y1},{x: x2, y: y2}])
            }
            locationLogic.visualBounds(mapboxgl, boundsData)
          }
      }
    }
  }
  _stopRotation(){
    if(this.rotationInterval){
      clearInterval(this.rotationInterval)
      this.rotationInterval = null
    }
  }
}
