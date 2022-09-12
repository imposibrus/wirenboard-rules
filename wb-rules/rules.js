/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */

// place your rules here or add more .js files in this directory
// log("add your rules to /etc/wb-rules/");

var Schedules = require('Schedules').Schedules;
var Aliases1Wire = require('Aliases1Wire').Aliases1Wire;

defineVirtualDevice("heater_control", {
  title: "Управление отоплением",
  cells: {
    enabled: {
      type: "switch",
      value: false
    }
  }
});

Aliases1Wire.addAlias('wb-w1/28-3c01d075c755', 'bath_small_floor_shower');
Aliases1Wire.addAlias('wb-w1/28-0120602c8717', 'bath_small_towel');
Aliases1Wire.addAlias('wb-w1/28-01206018a787', 'bath_small_floor');
Aliases1Wire.init();

Schedules.registerSchedule({
  "name" : "warm_floor_small_bath",
  "autoUpdate" : "1m",
  "intervals" : [
    [ [6, 0], [20, 0] ],  // в UTC, 9:00 - 23:00 MSK
  ]
});

Schedules.initSchedules();

defineRule('auto_off_heater_control', {
  when: function() {
    return dev._schedules.warm_floor_small_bath || true;
  },
  then: function (newValue, devName, cellName) {
    log("auto_off_heater_control  newValue={}, devName={}, cellName={}, warm_floor_small_bath={}", newValue, devName, cellName, dev._schedules.warm_floor_small_bath);
    dev["heater_control/enabled"] = dev._schedules.warm_floor_small_bath || false;
  }
});


defineRule('bathroom_switch', {
  whenChanged: ['wb-gpio/EXT1_IN1'],
  then: function (newVal, devName, cellName) {
    if (newVal) {
      dev['wb-mr6c_138']['K1'] = !dev['wb-mr6c_138']['K1'];
    }
  }
});

trackMqtt('/devices/+/controls/+/meta/error', function(message) {
  log.info('meta/error:: name: {}, value: {}'.format(message.topic, message.value));
});


/**
 * @typedef DefineRuleOptions
 * @property {Function} [asSoonAs]
 * @property {Function} [when]
 * @property {String|String[]} whenChanged
 * @property {DefineRuleThen} then
 */
/**
 * @typedef DefineRuleThen
 * @param {String} newVal
 * @param {String} devName
 * @param {String} cellName
 */
/**
 * @function publish
 * @param {String} topic
 * @param payload
 * @param {Number} [QoS]
 * @param {Boolean} [retain]
 */
/**
 * @function defineRule
 * @param {String} name
 * @param {DefineRuleOptions} options
 */
/**
 * @function defineRule
 * @param {DefineRuleOptions} options
 */
