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

/**
 * @type Setpoints
 */
// var setpoints = readConfig("/etc/wb-mqtt-setpoints.json");
var setpoints = {
  name: 'test name',
  id: 'overheat_control',
  temperature: 30,
  temp_floor_bath_small: 33,
  temp_floor_hall: 27,
  temp_floor_shower_bath_small: 30,
  temp_polotenc_bath_small: 35,
  hysteresis: 2
};

floor_heat_control('1wireSensors/bath_small_floor', 'wb-mr6c_138/K2', setpoints.temp_floor_bath_small, setpoints.hysteresis);
floor_heat_control('1wireSensors/bath_small_floor_shower', 'wb-mrm2-mini_134/Relay 1', setpoints.temp_floor_shower_bath_small, setpoints.hysteresis);
floor_heat_control('1wireSensors/bath_small_towel', 'wb-mrm2-mini_134/Relay 2', setpoints.temp_polotenc_bath_small, setpoints.hysteresis);

/**
 *
 * @param {String} sensor
 * @param {String} relay
 * @param {Number} setpoint
 * @param {Number} hysteresis
 */
function floor_heat_control(sensor, relay, setpoint, hysteresis) {
  var name = 'floor_heat_control_' + sensor.replace('/', '_');

  defineRule(name, {
    whenChanged: [sensor/*, 'heater_control/enabled'*/],
    then: function (newValue, devName, cellName) {
      if (!dev['heater_control/enabled']) {
        if (dev[relay]) {
          log('floor_heat_control:: heating turned off manually via virtual device. turning OFF the relay "{}"'.format(relay));
          dev[relay] = false;
        }
        return;
      }

      if (dev[sensor] >= setpoint && dev[relay]) {
        log('floor_heat_control:: sensor ({}) temp ({}) climb setpoint temp ({}). turning OFF the relay "{}"'.format(sensor, dev[sensor], setpoint, relay));
        dev[relay] = false;
        return;
      }

      if (dev[sensor] + hysteresis < setpoint && !dev[relay]) {
        log('floor_heat_control:: sensor ({}) temp ({}) down hysteresis ({}). turning ON the relay "{}"'.format(sensor, dev[sensor], setpoint - hysteresis, relay));
        dev[relay] = true;
        return;
      }

      // log("floor_heat_control:: unacceptable situation, turning off the relay. args: {}, {}, {}. relay state: {}".format(newValue, devName, cellName, dev[relay]));
      // dev[relay] = false;
    }
  });
}

Schedules.registerSchedule({
  "name" : "warm_floor_small_bath",
  "autoUpdate" : "1m",
  "intervals" : [
    [ [6, 00], [20, 00] ],  // в UTC, 9:00 - 23:00 MSK
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
 * @typedef Setpoints
 * @property {String} name
 * @property {String} id
 * @property {Number} temperature
 * @property {Number} temp_floor_bath_small
 * @property {Number} temp_floor_hall
 * @property {Number} temp_floor_shower_bath_small
 * @property {Number} temp_polotenc_bath_small
 * @property {Number} hysteresis
 */
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
