/**
 * 选图上传。me.js 和 publish.js 都要用，抽出来避免重复。
 *
 * Taro 版用的是 Taro.chooseImage（已废弃 API）。这里优先用 wx.chooseMedia
 * （基础库 2.21+ 推荐），旧基础库回落到 wx.chooseImage。
 */
const http = require('./request')

/** 选一张本地图片，返回临时文件路径 */
function chooseImage() {
  return new Promise(function (resolve, reject) {
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: function (res) {
          const file = res.tempFiles && res.tempFiles[0]
          if (!file) {
            reject(new Error('未选择图片'))
            return
          }
          resolve(file.tempFilePath)
        },
        fail: function (err) {
          reject(new Error((err && err.errMsg) || '选择图片失败'))
        },
      })
      return
    }
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const path = res.tempFilePaths && res.tempFilePaths[0]
        if (!path) {
          reject(new Error('未选择图片'))
          return
        }
        resolve(path)
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '选择图片失败'))
      },
    })
  })
}

/**
 * 选图 + 上传，一步到位。
 * @returns {Promise<{url: string}>}
 */
function chooseAndUpload(token) {
  return chooseImage().then(function (filePath) {
    return http.uploadFile(filePath, token)
  })
}

/** 用户主动取消选图时 errMsg 里带 cancel，这类"错误"不该弹 toast */
function isCancel(err) {
  return !!err && /cancel/i.test(err.message || '')
}

module.exports = { chooseImage, chooseAndUpload, isCancel }
