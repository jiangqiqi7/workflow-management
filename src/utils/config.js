// 配置管理工具
// 打包后可以通过修改 public/config.json 文件来更改API地址，无需重新编译

let config = null

/**
 * 加载配置文件
 * @returns {Promise<Object>} 配置对象
 */
export async function loadConfig() {
  if (config) {
    return config
  }

  try {
    // 从 public/config.json 加载配置
    const response = await fetch('/config.json')
    if (!response.ok) {
      throw new Error('配置文件加载失败')
    }
    
    config = await response.json()
    console.log('配置文件加载成功:', config)
    return config
  } catch (error) {
    console.warn('配置文件加载失败，使用默认配置:', error)
    
    // 使用默认配置作为后备方案
    config = {
      apiConfig: {
        backendBase: import.meta.env.VITE_BACKEND_BASE_URL || 'http://116.204.65.72:8881',
        reviewNoticeBase: 'http://36.103.203.206:8000'
      }
    }
    
    return config
  }
}

/**
 * 获取API配置
 * @returns {Object} API配置对象
 */
export function getApiConfig() {
  if (!config) {
    throw new Error('配置尚未加载，请先调用 loadConfig()')
  }
  return config.apiConfig
}

/**
 * 获取后端基础地址
 * @returns {string} 后端基础地址
 */
export function getBackendBase() {
  return getApiConfig().backendBase
}

/**
 * 获取ReviewNotice基础地址
 * @returns {string} ReviewNotice基础地址
 */
export function getReviewNoticeBase() {
  return getApiConfig().reviewNoticeBase
}

/**
 * 获取视频流WebSocket地址
 * @returns {string} 视频流WebSocket地址
 */
export function getVideoStreamUrl() {
  return getApiConfig().videoStreamUrl
}
