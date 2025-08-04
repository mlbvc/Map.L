
import Util from '../../Common/Utils/Util'
const util = Util.getInstance()
export default class TrackMathUtil {
  //单例
  static getInstance() {
    if (!this._instance) {
      this._instance = new TrackMathUtil();
    }
    return this._instance;
  }
  /**
   * 二分法查询目标时间的索引值
   * @param  {[type]} historys   [轨迹数据]
   * @param  {[type]} targetTime [目标时间，当前播放的时间]
   */
  binarySearch(historys, targetTime){
    if (!historys || !targetTime || historys.length <= 0){
      return
    }
    let leftIndex = 0                         //搜索范围左值
    let rightIndex = historys.length - 1      //搜索范围右值
    let index = Math.floor((leftIndex + rightIndex) / 2)  //当前搜索索引，从中间开始
    let searchCount = 0  //计算次数
    while(true){
      searchCount += 1
      if (searchCount >= 999){
        //设置计算上限，防止算法出BUG的时候出现死循环
        console.warn("binarySearch, 二分法搜索异常")
        return
      }
      if (index === 0 || index === historys.length - 1){
        //如果已经搜索到头，或者到尾，直接跳出
        break
      }
      //当前索引值下的时间
      let locationTime = this.newDate(historys[index].locationTime).getTime()
      if (locationTime === targetTime){
        //如果找到相等时间，直接跳出
        break
      }
      else if (locationTime > targetTime){
        //当前时间大于目标时间
        //当前索引前一个点的时间
        let preLocationTime = this.newDate(historys[index - 1].locationTime).getTime()
        if (preLocationTime <= targetTime){
          //当前索引前一个点的时间小于等于目标时间
          //前一个点时间 <= 目标时间 <= 当前索引时间，即找到结果
          //索引值设置为前一个点
          index = index - 1
          break
        }
        //没有找到，重新设置右值
        rightIndex = index - 1
      }
      else if (locationTime < targetTime){
        //当前时间小于目标时间
        //当前索引下一个点的时间
        let nextLocationTime = this.newDate(historys[index + 1].locationTime).getTime()
        if (nextLocationTime > targetTime){
          //当前索引下一个点的时间大于等于目标时间
          //当前索引时间 <= 目标时间 <= 下一个点的时间，即找到结果
          break
        }
        else if (nextLocationTime === targetTime){
          //索引值设置为下一个点
          index = index + 1
          break
        }
        //没有找到，重新设置左值
        leftIndex = index + 1
      }
      //重新计算索引值，左右值的中间值
      index = Math.floor((leftIndex + rightIndex) / 2)
    }
    return index
  }
  newDate(date){
    return util.newDate(date)
  }
  /**
   * 排序，去重历史轨迹
   */
  transformHistorys(historys){
    historys.sort((a,b)=>{
      let sort = util.newDate(a.locationTime).getTime() > util.newDate(b.locationTime).getTime()
      return sort? 1: -1
    })
    let sorthistorys = historys
    let newHistorys = []
    let historysObj = {}
    for(let key of sorthistorys){
      if(!historysObj[key.locationTime]){
        newHistorys.push(key)
        historysObj[key.locationTime] = 1
      }
    }
    return newHistorys
  }
}
