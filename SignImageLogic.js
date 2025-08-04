
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
   * @param  {[Object]} aMap        [地图对象]
   * @param  {[Object]} map_info        [地图覆盖图片信息]
   * @param  {[Array]} sign_image_info [签到点图片信息]
   */
  initSignImage(aMap, map_info, sign_image_info){
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
            aMap, groundImageData, 'signImage' ,config)
          this.signImage[item.id] = signImage
          this.signImage[item.id].setOpacity(0)
        }
      }
    }
  }
  /**
   * 更新签到点图片
   * @param  {[Object]} aMap            [地图对象]
   * @param  {[Object]} map_info        [地图覆盖图片信息]
   * @param  {[Object]} sign_image_info [签到点图片信息]
   * @param  {Object} [config={}]     [签到点图片配置]
   */
  updateSignImage(aMap, map_info, sign_image_info, config={}){
    if(!aMap || !map_info || !sign_image_info){
      return
    }
    let curZoom = aMap.getZoom()
    this._stopRotation()
    for(let key in this.signImage){
      this.signImage[key] && this.signImage[key].setOpacity(0)
    }
    if(Number(sign_image_info.id) < 0){
      //选择无签到点图片，角度设为0
      aMap.setRotation(this.defaultAngle)
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
            locationLogic.visualBounds(aMap, boundsData)
          }
          //旋转
          // if(sign_image_info.angle){
            let targetAngle = Number(sign_image_info.angle) || 0
            targetAngle += this.defaultAngle
            targetAngle = targetAngle >= 360? Number(targetAngle - 360) : targetAngle
            if(this.currentAngle >= 360){
              this.currentAngle = this.currentAngle - 360
            }
            let addAngle = 0
            let subAngle = 0
            let addAngleCount = 0
            let subAngleCount = 0
            if(targetAngle < this.currentAngle){
              addAngle = 360 - Math.abs(targetAngle - this.currentAngle)
              subAngle = Math.abs(targetAngle - this.currentAngle)
            }
            else{
              addAngle = Math.abs(targetAngle - this.currentAngle)
              subAngle = 360 - Math.abs(targetAngle - this.currentAngle)
            }

            // 按份数计算出每次要转的角度(与平移缩放的份数一致，达到同时结束的目的)
            let num = curZoom > 18 ? 250 : 200
            let addNum = addAngle / num
            let subNum = subAngle / num

            this.rotationInterval = setInterval(()=>{
              if(addAngle > subAngle){
                this.currentAngle -= subNum
                subAngleCount += subNum
                if(this.currentAngle < 0){
                  this.currentAngle = this.currentAngle + 360
                }
                if(subAngleCount >= subAngle){
                  this.currentAngle = targetAngle
                  this._stopRotation()
                }
              }
              else{
                this.currentAngle += addNum
                addAngleCount += addNum
                if(this.currentAngle > 360){
                  this.currentAngle = this.currentAngle - 360
                }
                if(addAngleCount >= addAngle){
                  this.currentAngle = targetAngle
                  this._stopRotation()
                }
              }
              aMap.setRotation(Number(this.currentAngle))
            }, 10)
          // }
        // }
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
