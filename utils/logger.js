/**
 * Simple logging utility with timestamps and formatting
 */

function formatMessage(level, message, ...args) {
  const timestamp = new Date().toLocaleString('zh-TW', { 
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-') + ' HKT';
  const prefix = `[${timestamp}] [${level}]`;
  return `${prefix} ${message}`;
}

function info(message, ...args) {
  console.log(formatMessage('INFO', message), ...args);
}

function error(message, ...args) {
  console.error(formatMessage('ERROR', message), ...args);
}

function warn(message, ...args) {
  console.warn(formatMessage('WARN', message), ...args);
}

function debug(message, ...args) {
  if (process.env.DEBUG === 'true') {
    console.log(formatMessage('DEBUG', message), ...args);
  }
}

function apiLog(provider, message, ...args) {
  console.log(formatMessage(provider, message), ...args);
}

module.exports = {
  info,
  error,
  warn,
  debug,
  apiLog
};
