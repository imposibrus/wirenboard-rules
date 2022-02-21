/* globals defineRule, defineVirtualDevice, log, global, dev, exports, cron */

var virtualDeviceName = "1wireSensors";
var aliases = [];

var Aliases1Wire = {
  /**
   * @param {String} sensorName
   * @param {String} aliasName
   */
  addAlias: function addAlias(sensorName, aliasName) {
    defineRule({
      whenChanged: sensorName,
      then: function (newVal) {
        dev[virtualDeviceName + "/" + aliasName] = newVal;
      }
    });

    aliases.push(aliasName);
  },

  init: function init() {
    defineVirtualDevice(virtualDeviceName, {
      title: "Датчики 1-wire",
      cells: aliases.reduce(function(m, a) {
        m[a] = {
          type: "temperature",
          value: 0
        };
        return m;
      }, {})
    });
  }
};

exports.Aliases1Wire = Aliases1Wire;
