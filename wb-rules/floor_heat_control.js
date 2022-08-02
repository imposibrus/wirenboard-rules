/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */
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
  temp_polotenc_bath_small: 36,
  hysteresis: 2
};

floor_heat_control('1wireSensors/bath_small_floor', 'wb-mr6c_138/K2', setpoints.temp_floor_bath_small, setpoints.hysteresis);
floor_heat_control('1wireSensors/bath_small_floor_shower', 'wb-mrm2-mini_134/K1', setpoints.temp_floor_shower_bath_small, setpoints.hysteresis);
floor_heat_control('1wireSensors/bath_small_towel', 'wb-mrm2-mini_134/K2', setpoints.temp_polotenc_bath_small, 3);

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
