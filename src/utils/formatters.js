/**
 * 格式化工具函数 - 对应原 Formatters.swift
 */

/**
 * 将分转换为元并格式化: '¥1,234.00'
 * @param {number} cents 金额（分）
 * @returns {string}
 */
export function formatYuan(cents) {
  const yuan = cents / 100
  return '¥' + yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * 将分转换为单价: '¥123.45/g'
 * @param {number} cents 金额（分）
 * @returns {string}
 */
export function formatPrice(cents) {
  const yuan = cents / 100
  return '¥' + yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + '/g'
}

/**
 * 格式化盈利: '+¥123.45' 或 '-¥123.45'
 * @param {number} cents 金额（分）
 * @returns {string}
 */
export function formatProfit(cents) {
  const yuan = Math.abs(cents) / 100
  const sign = cents >= 0 ? '+' : '-'
  return sign + '¥' + yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * 格式化克数: '12.345g'
 * @param {number} grams 克数
 * @returns {string}
 */
export function formatGrams(grams) {
  return grams.toFixed(3) + 'g'
}

/**
 * 格式化涨跌幅: '+12.34%' 或 '-12.34%'
 * @param {number} rate 涨跌率（如 0.1234 表示 12.34%）
 * @returns {string}
 */
export function formatRate(rate) {
  const percent = Math.abs(rate) * 100
  const sign = rate >= 0 ? '+' : '-'
  return sign + percent.toFixed(2) + '%'
}

/**
 * 格式化日期: '2024-01-15'
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 将元转换为分
 * @param {number} yuan
 * @returns {number}
 */
export function centsFromYuan(yuan) {
  return Math.round(yuan * 100)
}
