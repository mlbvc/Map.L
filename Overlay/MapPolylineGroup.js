export default class MapPolylineGroup{
  /**
   * 构造方法
   * @param {[AMap]} aMap     高德地图对象
   * @param {[Object]} config 折线配置
   * @param {[Array]} paths   折线数组
   * @param {Number} [id=0]   折线ID
   */
  constructor(aMap, config, paths = [], id = 0){
    this.aMap = aMap
    this.config = config
    this.paths = paths
    this.id = id
    this._polyline = []
    this.init()
  }
  /**
   * 初始化圆点标记，加入地图中
   */
  init(){
    if (!this.aMap || !this.config || !this.paths){
      console.log("初始化地图折线失败！")
      return
    }
    for (let i = 0; i < this.paths.length; i++) {
      let item = this.paths[i]
      let config = {
        ...this.config,
        strokeStyle: item.linState || "solid",
        path: item.path,
      }
      this._polyline[i] = new window.AMap.Polyline(config)
    }
    this.aMap.add(this._polyline)
  }
  /**
   * 设置折线数据
   */
  setPath(paths){
    for (let i = paths.length; i < this._polyline.length; i++) {
      this._polyline[i].setPath([])
    }
    for (let i = 0; i < paths.length; i++) {
      let item = paths[i]
      if(this._polyline[i]){
        this._polyline[i].setOptions({
          strokeStyle: item.linState || "solid",
          path:item.path
        })
      }
      else{
        let config = {
          ...this.config,
          strokeStyle: item.linState || "solid",
          path: item.path,
        }
        this._polyline[i] = new window.AMap.Polyline(config)
        this.aMap.add(this._polyline[i])
      }
    }
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
  remove(){
    let polyline = []
    for (let i = 0; i < this._polyline.length; i++) {
      polyline.push(this._polyline[i])
    }
    this.aMap.remove(this._polyline)
  }
  /**
   * 修改折线属性
   */
  setOptions(options){
    for (let i = 0; i < this._polyline.length; i++) {
      this._polyline[i].setOptions(options)
    }
  }
}
