import OverlayConfig from '../OverlayConfig'
export default class ColorCenter{
  static getInstance(){
    if(!this._instance){
      this._instance = new ColorCenter()
    }
    return this._instance
  }
  constructor(){
    this.index = 0
  }
  /**
   * 获取颜色
   * @return {[Color]} [颜色]
   */
  getColor(){
    let TrackColor = OverlayConfig.TrackColor
    let color = TrackColor[this.index]
    //循环递进为下一个颜色
    this.index = (this.index + 1) % TrackColor.length
    return color
  }
}
