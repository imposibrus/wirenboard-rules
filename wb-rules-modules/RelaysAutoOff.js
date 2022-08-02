/* globals defineRule, defineVirtualDevice, log, global, dev, exports, cron, PersistentStorage */

var virtualDeviceName = "overheat_control";
var virtualDeviceControlName = virtualDeviceName + "/enabled";
var autoOffTimeout = 1000 * 60 * 30; // 30 minutes
/** @type Object.<string, number> */
var lastRelayActivationTime = new PersistentStorage('RelaysAutoOff', { global: true });

defineVirtualDevice(virtualDeviceName, {
  title: "Управление перегревом",
  cells: {
    enabled: {
      type: "switch",
      value: true
    }
  }
});

var RelaysAutoOff = {
  /**
   * @param {String} relayDev
   */
  addControl: function addControl(relayDev) {
    var ruleName = 'RelaysAutoOff_' + relayDev.replace('/', '_');
    log('RelaysAutoOff::addControl relayDev="{}", ruleName="{}"'.format(relayDev, ruleName));

    RelaysAutoOff.relaysUnderControl.push(relayDev);
    lastRelayActivationTime[relayDev] = lastRelayActivationTime[relayDev] || 0;

    defineRule(ruleName, {
      whenChanged: [relayDev, virtualDeviceControlName],
      then: function () {
        if (dev[relayDev] && dev[virtualDeviceControlName]) {
          log('RelaysAutoOff:: relay "{}" activated, saving activation time'.format(relayDev));

          lastRelayActivationTime[relayDev] = (new Date()).getTime();
        } else {
          log('RelaysAutoOff:: relay "{}" deactivated, unset activation time'.format(relayDev));

          lastRelayActivationTime[relayDev] = 0;
        }
      }
    });
  },

  init: function init() {
    defineRule({
      when: cron("@every 1m"),
      then: function() {
        var now = new Date();
        var nowTimestamp = now.getTime();

        RelaysAutoOff.relaysUnderControl.forEach(function(relayDev) {
          var relayTurnOnTime = lastRelayActivationTime[relayDev];

          // activation time not set, ignore
          if (!relayTurnOnTime) {
            return;
          }

          // relay turned off, unset activation time and ignore
          if (!dev[relayDev]) {
            log('RelaysAutoOff::cron relay "{}" already turned off. unset activation time and ignore'.format(relayDev));
            lastRelayActivationTime[relayDev] = 0;
            return;
          }

          // relay activation time reached `autoOffTimeout`, turning off
          if (relayTurnOnTime + autoOffTimeout < nowTimestamp) {
            log('RelaysAutoOff::cron relay "{}" was turned ON at "{}" and its activation time reached `autoOffTimeout` at "{}", turning relay off'.format(relayDev, new Date(relayTurnOnTime).toISOString(), new Date(relayTurnOnTime + autoOffTimeout).toISOString()));
            dev[relayDev] = false;
            lastRelayActivationTime[relayDev] = 0;
          }
        });
      }
    });
  },

  relaysUnderControl: []
};

exports.RelaysAutoOff = RelaysAutoOff;
