const path = require('path');
const glob = require('glob');

module.exports = {
  /**
   * Uses glob to locate files from pattern
   * @param {string} pattern
   * @param {Function} each forEach callback
   */
  getFiles(pattern, each) {
    const files = glob.sync(pattern).map(_path => path.resolve(_path));

    if (each) files.forEach(each);
    return files;
  }
};
