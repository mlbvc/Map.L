import TrackType from '../TrackType'
import PlayerTrack from './PlayerTrack'
import WorkerTrack from './WorkerTrack'
import DeviceLiveTrack from './DeviceTrack'
import DeviceHistoryTrack from './DeviceHistoryTrack'
export default class TrackFactory{
  static getInstance(){
    if(!this._instance){
      this._instance = new TrackFactory()
    }
    return this._instance
  }
  /**
   * 创建轨迹对象
   * @param  {[TrackType]} type [轨迹类型]
   * @param  {[mapboxgl]} mapboxgl      [地图对象]
   * @param  {[Object]} data    [轨迹数据]
   * @return {[BaseTrack]}      [轨迹对象]
   */
  create(type = TrackType.PLAYER, mapboxgl, data, animationLogic){
    switch (type) {
      case TrackType.PLAYER:
        return new PlayerTrack(mapboxgl, data, animationLogic)
      case TrackType.WORKER:
        return new WorkerTrack(mapboxgl, data, animationLogic)
      case TrackType.DEVICELIVE:
        return new DeviceLiveTrack(mapboxgl, data, animationLogic)
      case TrackType.DEVICEHISTORY:
        return new DeviceHistoryTrack(mapboxgl, data, animationLogic)
      default:
    }
  }
}
