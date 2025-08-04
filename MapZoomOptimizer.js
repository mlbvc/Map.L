/**
 * 地图缩放优化器
 * 用于处理地图缩放时的防闪烁问题
 */
export default class MapZoomOptimizer {
  constructor(map) {
    this.map = map
    this.isZooming = false
    this.isAnimating = false
    this.zoomStartTime = 0
    this.zoomEndTimeout = null
    this.imageLayers = []
    this.originalOpacities = new Map() // 存储原始透明度
    this.animationTimeout = null
    
    this.init()
  }
  
  init() {
    if (!this.map) return
    
    // 监听缩放开始事件
    this.map.on('zoomstart', this.onZoomStart.bind(this))
    
    // 监听缩放结束事件
    this.map.on('zoomend', this.onZoomEnd.bind(this))
    
    // 监听缩放事件
    this.map.on('zoom', this.onZoom.bind(this))
    
    // 监听移动开始和结束事件
    this.map.on('movestart', this.onMoveStart.bind(this))
    this.map.on('moveend', this.onMoveEnd.bind(this))
    
    // 监听地图视图变化事件（包括 flyTo）
    this.map.on('viewreset', this.onViewReset.bind(this))
  }
  
  /**
   * 移动开始处理
   */
  onMoveStart() {
    this.isAnimating = true
    // 移动动画期间保持图层可见，但降低透明度
    this.fadeImageLayers(0.5)
  }
  
  /**
   * 移动结束处理
   */
  onMoveEnd() {
    this.isAnimating = false
    // 如果不在缩放状态，确保图层可见
    if (!this.isZooming) {
      this.showImageLayers()
    }
  }
  
  /**
   * 视图重置处理（包括 flyTo 动画）
   */
  onViewReset() {
    // 视图重置时，延迟恢复图层可见性
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout)
    }
    this.animationTimeout = setTimeout(() => {
      this.isAnimating = false
      if (!this.isZooming) {
        this.showImageLayers()
      }
    }, 200)
  }
  
  /**
   * 缩放开始处理
   */
  onZoomStart() {
    this.isZooming = true
    this.zoomStartTime = Date.now()
    
    // 只有在非动画状态下才隐藏图层
    if (!this.isAnimating) {
      this.hideImageLayers()
    } else {
      // 如果是动画状态，则降低透明度而不是完全隐藏
      this.fadeImageLayers(0.3)
    }
    
    // 清除之前的超时
    if (this.zoomEndTimeout) {
      clearTimeout(this.zoomEndTimeout)
    }
  }
  
  /**
   * 缩放过程处理
   */
  onZoom() {
    if (!this.isZooming) return
    
    // 缩放过程中，如果是动画状态则保持半透明，否则隐藏
    if (this.isAnimating) {
      this.fadeImageLayers(0.3)
    } else {
      this.hideImageLayers()
    }
  }
  
  /**
   * 缩放结束处理
   */
  onZoomEnd() {
    this.isZooming = false
    
    // 延迟显示图片图层，确保地图渲染完成
    this.zoomEndTimeout = setTimeout(() => {
      this.showImageLayers()
    }, 200) // 增加延迟时间，确保渲染完成
  }
  
  /**
   * 隐藏图片图层
   */
  hideImageLayers() {
    this.imageLayers.forEach(layer => {
      if (layer && layer.setOpacity) {
        // 保存原始透明度
        if (!this.originalOpacities.has(layer)) {
          this.originalOpacities.set(layer, layer.options.opacity || 1)
        }
        layer.setOpacity(0)
      }
    })
  }
  
  /**
   * 显示图片图层
   */
  showImageLayers() {
    this.imageLayers.forEach(layer => {
      if (layer && layer.setOpacity) {
        // 恢复原始透明度
        const originalOpacity = this.originalOpacities.get(layer) || 1
        layer.setOpacity(originalOpacity)
      }
    })
  }
  
  /**
   * 设置图片图层透明度
   */
  fadeImageLayers(opacity) {
    this.imageLayers.forEach(layer => {
      if (layer && layer.setOpacity) {
        // 保存原始透明度
        if (!this.originalOpacities.has(layer)) {
          this.originalOpacities.set(layer, layer.options.opacity || 1)
        }
        layer.setOpacity(opacity)
      }
    })
  }
  
  /**
   * 添加图片图层到优化器
   */
  addImageLayer(layer) {
    if (layer && !this.imageLayers.includes(layer)) {
      this.imageLayers.push(layer)
      // 保存原始透明度
      this.originalOpacities.set(layer, layer.options.opacity || 1)
    }
  }
  
  /**
   * 移除图片图层
   */
  removeImageLayer(layer) {
    const index = this.imageLayers.indexOf(layer)
    if (index > -1) {
      this.imageLayers.splice(index, 1)
      this.originalOpacities.delete(layer)
    }
  }
  
  /**
   * 清除所有图片图层
   */
  clearImageLayers() {
    this.imageLayers = []
    this.originalOpacities.clear()
  }
  
  /**
   * 销毁优化器
   */
  destroy() {
    if (this.map) {
      this.map.off('zoomstart', this.onZoomStart.bind(this))
      this.map.off('zoomend', this.onZoomEnd.bind(this))
      this.map.off('zoom', this.onZoom.bind(this))
      this.map.off('movestart', this.onMoveStart.bind(this))
      this.map.off('moveend', this.onMoveEnd.bind(this))
      this.map.off('viewreset', this.onViewReset.bind(this))
    }
    
    if (this.zoomEndTimeout) {
      clearTimeout(this.zoomEndTimeout)
    }
    
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout)
    }
    
    this.clearImageLayers()
    this.map = null
  }
} 