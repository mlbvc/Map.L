
import AlarmType from '../Alarm/AlarmType'
const data = {
    //轨迹更新间隔
    TrackUpdateTime: 100,
    //轨迹每次更新数量
    TrackUpdateCount: 80,
    //轨迹记忆时间
    TrackMemoryTime: 1000 * 60 * 1.5,
    //丢点限制时间
    TrackErrorTime: 1000 * 60 * 1.5,
    //轨迹移动速度
    MarkMoveSpeed: 35,
    //圆形标记配置
    CircleMarker:{
      content:
        `<div style="width:circleMarkerSizepx; height: circleMarkerSizepx; background-color:circleMarkerColor; border-radius:circleBorderRadiuspx;filter:alpha(Opacity=opacityFilter);-moz-opacity:opacityValue;opacity:opacityValue">
          <div style="centerStyle"></div>
        </div>`,
      zIndex: 101,            //点标记的叠加顺序,默认zIndex：100
    },
    //图片标记配置
    CircleMarkerIcon:{
      content:
        `<div style="display:flex;justifyContent:center;alignItems:center; width:markerIconSizepx; height: markerIconSizepx; border-radius:markerBorderRadiuspx;filter:alpha(Opacity=opacityFilter);-moz-opacity:opacityValue;opacity:opacityValue">
          <div style="centerStyle"></div>
          <img style="width:markerIconSizepx; height: markerIconSizepx" alt="" src="markerIcon"></img>
        </div>`,
      zIndex: 101,
    },
    //不可视标记配置，用于轨迹尾部动画消失效果
    InvisibleMarker:{
      content: `<div></div>`,
      zIndex: 101,
    },
    //轨迹折线配置
    Polyline:{
      borderWeight: 2,        //描边宽度
      strokeOpacity: 1,       //线条透明度
      strokeWeight: 5,        //线条颜色
      strokeStyle: "solid",   //线样式，实线:solid，虚线:dashed
      lineJoin: 'round',      //折线拐点的绘制样式，默认值为'miter'尖角，其他可选值：'round'圆角、'bevel'斜角
      zIndex: 99,             //点标记的叠加顺序,默认zIndex：100
      lineCap:'round',        //折线两端线帽的绘制样式，默认值为'butt'无头，其他可选值：'round'圆头、'square'方头
    },
    //名字文本标记配置
    TextString:{
      textAlign:'center',
      verticalAlign:'top',
      content:
        `<div style="text-align:left;word-break:keep-all;white-space:nowrap;display:flex;align-items:center;filter:alpha(Opacity=opacityFilter);-moz-opacity:opacityValue;opacity:opacityValue">
            <div style="position: relative;display: isShow;margin-right:5px;">
              <img style="width:imgWidthpx; height: imgHeightpx;" alt="" src="flag"></img>
            </div>
            <div style="position: relative;width: auto;display: inline-block !important;display: inline;">
              <div style="font-family:SimHei;-webkit-text-stroke: 5px #FFF;font-size: textSizepx;">
                content
              </div>
              <div style="font-family:SimHei;position: absolute;top:0;left:0;-webkit-text-stroke: 0.8px textcolor;font-size: textSizepx;align:center;color: textcolor;">
                content
              </div>
            </div>
        </div>`,
      selectedContent:
        `<div style="border:thin solid #000000;background:#ffffff;
            font-size:13px; height:210px;display:flex;justify-content:center;white-space:nowrap;
            flex-direction:column; padding-left:15px; padding-right:15px;padding-top:20px">
          <div style="font-weight:bolder">content</div>
          <div>battery</div>
          <div>updateTime</div>
          <div>signal</div>
          <div>locationTime</div>
          <div>sats</div>
          <div>temp</div>
          <div>lnglat</div>
          <div>act</div>
          <div id="selectedContent" style="position: absolute;top: 4px;right: 4px;
              font-size: 20px;color: #ccc; text-align: center;line-height: 15px;font-weight:bolder">
            X
          </div>
          <div style="width:10px;height:10px; align-self:center;
            border-bottom:thin solid #000;border-right:thin solid #000;
            position:absolute;bottom:-5px;
            transform:rotate(45deg);background-color:#FFF;"/>
        </div>`,
        historySelectedContent:
        `<div style="border:thin solid #000000;background:#ffffff;
            font-size:13px; height:100px;display:flex;justify-content:center;white-space:nowrap;
            flex-direction:column; padding-left:15px; padding-right:15px;padding-top:20px">
          <div style="font-weight:bolder">content</div>
          <div>locationTime</div>
          <div>lnglat</div>
          <div id="historySelectedContent" style="position: absolute;top: 4px;right: 4px;
              font-size: 20px;color: #ccc; text-align: center;line-height: 15px;font-weight:bolder">
            X
          </div>
          <div style="width:10px;height:10px; align-self:center;
            border-bottom:thin solid #000;border-right:thin solid #000;
            position:absolute;bottom:-5px;
            transform:rotate(45deg);background-color:#FFF;"/>
        </div>`,
      zIndex: 102             //点标记的叠加顺序,默认zIndex：100
    },
    //绘制路线折线配置
    RoutePolyline:{
      borderWeight: 2,        //描边宽度
      strokeOpacity: 1,       //线条透明度
      strokeWeight: 5,        //线条颜色
      strokeStyle: "solid",   //线样式，实线:solid，虚线:dashed
      lineJoin: 'round',      //折线拐点的绘制样式，默认值为'miter'尖角，其他可选值：'round'圆角、'bevel'斜角
      zIndex: 98,             //点标记的叠加顺序,默认zIndex：100
      strokeColor: "#3D9FF9",
      lineCap:'round',        //折线两端线帽的绘制样式，默认值为'butt'无头，其他可选值：'round'圆头、'square'方头
    },
    //安全区域，危险区域配置
    Polygon:{
      NORMAL: {},
      SAFE: {
        strokeColor: '#0087CD',
        fillColor: '#0087CD',
        strokeOpacity:1,
        fillOpacity: 0.1
      },
      DANGER: {
        strokeColor: '#FF0000',
        fillColor: '#FF0000',
        strokeOpacity:1,
        fillOpacity: 0.2
      }
    },
    //报警标志zIndex配置
    markerIconzIndex: {
      [AlarmType.NORMAL]: 801,
      [AlarmType.SOS] : 807,
      [AlarmType.STAY] : 806,
      [AlarmType.INEXCLUSIONZONE] : 805,
      [AlarmType.OUTFENCE]: 804,
      [AlarmType.OVERSPEED]: 803,
      [AlarmType.OVERTIME]: 802,
    },
    //轨迹颜色配置
    TrackColor: [
      "#0001FA",
      "#F60400",
      "#008001",
      "#800000",
      "#020080",
      "#FC007E",
      "#FF7F00",
      "#017FFE",
      "#8000FC",
      "#0DBB0A",
      "#808000",
      "#FF0000",
      "#008080",
      "#0000FF",
      "#00FF00",
      "#008000",
      "#800080",
      "#000080"
    ],
    //工作人员轨迹配置
    WorkerTrack:{
      color:"#707070",
      zIndex: 99
    },
    //路程对比路径配置
    DistanceComparisonPolyline:{
      borderWeight: 2,        //描边宽度
      strokeOpacity: 1,       //线条透明度
      strokeWeight: 5,        //线条颜色
      strokeStyle: "solid",   //线样式，实线:solid，虚线:dashed
      lineJoin: 'round',      //折线拐点的绘制样式，默认值为'miter'尖角，其他可选值：'round'圆角、'bevel'斜角
      zIndex: 90,             //点标记的叠加顺序,默认zIndex：100
      lineCap:'round',        //折线两端线帽的绘制样式，默认值为'butt'无头，其他可选值：'round'圆头、'square'方头
    },
    //路程对比路线移动点标记点配置
    DistanceComparisonPolylineMarker:{
      content: `<div/>`,
      zIndex: 90
    },
    //路程对比颜色配置
    DistanceComparisonColor:'#3D9FF9',
    //路程对比路程标记点配置
    DistanceComparisonMarker:{
      content:
        `<div style="text-align:left;word-break:keep-all;white-space:nowrap;background-color:#ffffff;padding:0 2px;border:thin solid textcolor;border-radius:5px;filter:alpha(Opacity=opacityFilter);-moz-opacity:opacityValue;opacity:opacityValue">
            <div style="font-family:SimHei;-webkit-text-stroke: 0.8px textcolor;font-size: textSizepx;align:center;color: textcolor;">
              content
            </div>
        </div>`,
      zIndex: 90
    },
    //设置最上层zIndex
    maxzIndex: 800,
    //设备离线标记点颜色
    offlineMarkerColor: '#707070',
    //设备历史轨迹线段颜色
    devicesHistoryPolylineColor:'#8ac007'
}
export default data
