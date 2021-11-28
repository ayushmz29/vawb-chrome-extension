const DEBUG = (process.env.NODE_ENV === 'development');
const storage = chrome.storage.local;

const ICON_COLOR = '#2196f3';

module.exports = {
  DEBUG,
  ICON_COLOR,
  storage
};
