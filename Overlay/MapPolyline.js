export default class MapPolyline{
  /**
   * 构造方法
   * @param {[AMap]} aMap     高德地图对象
   * @param {[Object]} config 折线配置
   * @param {Number} [id=0]   折线ID
   */
  constructor(aMap, config, id = 0){
    this.aMap = aMap
    this.config = config
    this.id = id
    this._polyline = null
    this.isHide = false
    this.init()
  }
  /**
   * 初始化圆点标记，加入地图中
   */
  init(){
    if (!this.aMap || !this.config){
      console.log("初始化地图折线失败！")
      return
    }
    this._polyline = new window.AMap.Polyline(this.config)
    this.aMap.add(this._polyline)
  }
  /**
   * 设置折线数据
   */
  setPath(path){
    console.log(path)
    this._polyline.setPath(path)
  }
  /**
   * 获取折线数据
   */
  getPath(path){
    return this._polyline.getPath()
  }
  /**
   * 返回ID
   * @return {[String]} [ID]
   */
  getID(){
    return this.id
  }
  /**
   * 获取折线对象
   * @return {[Polyline]} [折线]
   */
  getRoot(){
    return this._polyline
  }
  /**
   * 显示折线
   */
  show(){
    this.isHide = false
    this._polyline.show()
  }
  /**
   * 隐藏折线
   */
  hide(){
    this.isHide = true
    this._polyline.hide()
  }
  /**
   * 获取是否隐藏折线
   */
  getIsHide(){
    return this.isHide
  }
  /**
   * 修改折线属性
   */
  setOptions(options){
    this._polyline.setOptions(options)
  }
}
