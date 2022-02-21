/* globals defineRule, defineVirtualDevice, log, global, dev, exports, cron */

var virtualDeviceName = "overheat_control";
var autoOffTimeout = 1000 * 60 * 30; // 30 minutes

var RelaysAutoOff = {
  /**
   * @param {String} relayDev
   */
  addControl: function addControl(relayDev) {
    var timer;

    defineRule({
      whenChanged: relayDev,
      then: function (newVal) {
        if (newVal && dev[virtualDeviceName] && !timer) {
          log('RelaysAutoOff:: staring timer of relay "{}"'.format(relayDev));
          timer = setTimeout(function() {
            log('RelaysAutoOff:: timer of relay "{}" finished. turn off the relay'.format(relayDev));
            dev[relayDev] = false;
            timer = undefined;
          }, autoOffTimeout);
        } else if (timer) {
          log('RelaysAutoOff:: clearing timer of relay "{}"'.format(relayDev));
          clearTimeout(timer);
        }
      }
    });
  },

  init: function init() {
    defineVirtualDevice(virtualDeviceName, {
      title: "Управление перегревом",
      cells: {
        enabled: {
          type: "switch",
          value: true
        }
      }
    });
  }
};

exports.RelaysAutoOff = RelaysAutoOff;
