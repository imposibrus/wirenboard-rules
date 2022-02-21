/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */

// place your rules here or add more .js files in this directory
// log("add your rules to /etc/wb-rules/");

var ActionButtons = require('ActionButtons').ActionButtons;
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
  var relayPath = relay.split('/');

  defineRule(name, {
    whenChanged: [sensor, 'heater_control/enabled'],
    then: function (newValue, devName, cellName) {
      if (!dev['heater_control/enabled']) {
        if (dev[relayPath[0]][relayPath[1]]) {
          log('heating turned off manually via virtual device. turning off the relay "{}"'.format(relay));
          dev[relayPath[0]][relayPath[1]] = false;
        }
        return;
      }

      if (dev[sensor] >= setpoint && dev[relayPath[0]][relayPath[1]]) {
        log('sensor temp ({}) climb setpoint temp ({}). turning off the relay "{}"'.format(dev[sensor], setpoint, relay));
        dev[relayPath[0]][relayPath[1]] = false;
        return;
      }

      if (dev[sensor] + hysteresis < setpoint && !dev[relayPath[0]][relayPath[1]]) {
        log('sensor temp ({}) down hysteresis ({}). turning on the relay "{}"'.format(dev[sensor], setpoint - hysteresis, relay));
        dev[relayPath[0]][relayPath[1]] = true;
        return;
      }

      // log("unacceptable situation, turning off the relay. args: {}, {}, {}. relay state: {}".format(newValue, devName, cellName, dev[relayPath[0]][relayPath[1]]));
      // dev[relayPath[0]][relayPath[1]] = false;
    }
  });
}

Schedules.registerSchedule({
  "name" : "warm_floor_small_bath", // вывеска
  "autoUpdate" : "1m",
  "intervals" : [
    [ [7, 00], [20, 00] ],  // в UTC, 10:00 - 23:00 MSK
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

defineVirtualDevice("master_btn", {
  title: "Мастер выключатель",
  cells: {
    enabled: {
      type: "switch",
      value: false
    }
  }
});

var allLightsDevices = ['wb-mr6c_42/K3', 'wb-mdm3_104/K3'];

defineRule('master_off', {
  whenChanged: ['wb-gpio/EXT1_IN13', 'master_btn/enabled'],
  then: function(newVal, devName, cellName) {
    if ((newVal && devName === 'wb-gpio' && cellName === 'EXT1_IN13') || (devName === 'master_btn' && cellName === 'enabled')) {
      var shouldOff = allLightsDevices.some(function(path) {var chunks = path.split('/'); return dev[chunks[0]][chunks[1]];});
      var allOff = allLightsDevices.every(function(path) {var chunks = path.split('/'); return dev[chunks[0]][chunks[1]] === false;});
      if (devName === 'wb-gpio' && cellName === 'EXT1_IN13') {
        dev['master_btn/enabled'] = !shouldOff;
      }
      if (allOff) {
        // если весь свет был выключен, то включить свет только в коридоре
        dev["wb-mdm3_104"]["K3"] = dev['master_btn/enabled'];
      } else {
        dev['wb-mr6c_42']['K3'] = dev['master_btn/enabled'];
        dev["wb-mdm3_104"]["K3"] = dev['master_btn/enabled'];
      }
    }
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

// ActionButtons.onButtonPress(
//     'wb-gpio/EXT1_IN11',
//     {
//       singlePress: {
//          func: switchRelay,
//          prop: ['wb-mr6c_138', 'K1']
//       },
//       doublePress: {
//         func: switchRelay,
//         prop: ['wb-mr6c_42', 'K3']
//         //func: switchDimmerRGB,
//         //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
//       },
//       longPress: {
//         func: switchRelay,
//         prop: ["wb-mdm3_104", "K3"]
//         //func: setRandomRGB,
//         //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
//       },
//       longRelease: {
//         func: function () {
//           log.debug('longRelease');
//         }
//       }
//     },
//     300,
//     1000
// );

// (function() {
//     var lastPressTime = Date.now();
//     var group11 = ['wb-mr6c_42/K3', 'wb-mr6c_138/K1'];
//
//     defineRule('11_test', {
//         whenChanged: 'wb-gpio/EXT1_IN11',
//         then: function(newVal) {
//             if (newVal) {
//                 var now = Date.now();
//                 var shouldOff = group11.some(function(path) {var chunks = path.split('/'); return dev[chunks[0]][chunks[1]];});
//
//                 // double press
//                 if (now - lastPressTime <= 300) {
//                     var secondaryState = dev['wb-mr6c_138']['K1'];
//                     log('double press', secondaryState);
//                     dev['wb-mr6c_138']['K1'] = !secondaryState;
//                     dev['wb-mr6c_42']['K3'] = !secondaryState;
//                 } else {
//                     // single press
//                     log('single press', shouldOff);
//                     if (shouldOff) {
//                         // switch off all group on single press (when at least one lamp was ON)
//                         switchGroup(group11, false);
//                     } else {
//                         dev['wb-mr6c_42']['K3'] = !shouldOff;
//                     }
//                 }
//
//                 lastPressTime = now;
//             }
//         }
//     });
// })();

function switchGroup(devices, state) {
    return devices.map(function(path) {
        var chunks = path.split('/');
        dev[chunks[0]][chunks[1]] = state;
    });
}

// defineRule('12_test', {
//     whenChanged: 'wb-gpio/EXT1_IN12',
//     then: function(newVal) {
//         if (newVal) {
//             dev['wb-mr6c_138']['K1'] = !dev['wb-mr6c_138']['K1'];
//         }
//     }
// });

ActionButtons.onButtonPress(
    'wb-gpio/EXT1_IN12',
    {
      singlePress: {
          func: switchRelay,
          prop: ['wb-mr6c_138', 'K1']
      },
      doublePress: {
        func: function() {
            dev['wb-mr6c_42']['K3'] = !dev["wb-mr6c_42/K3"];
            dev['wb-mr6c_138']['K1'] = !dev["wb-mr6c_138/K1"];
        },
        prop: ['wb-mr6c_42', 'K3']
        //func: switchDimmerRGB,
        //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
      },
      longPress: {
        func: dimmerChange,
        prop: ["wb-mdm3_104", "Channel 3", 3, 100]
        //func: setRandomRGB,
        //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
      },
      longRelease: {
        func: function () {
          log.debug('longRelease');
        }
      }
    },
    300,
    1000
);

/*
defineRule('move_sensor', {
    whenChanged: ['wb-adc/A1'],
    then: function(newVal, devName, cellName) {
        if (newVal > 3) {
            dev['wb-mr6c_42']['K1'] = true;
        } else {
            dev['wb-mr6c_42']['K1'] = false;
        }
    }
});
*/

(function() {
    // TODO: switch to persistent storage
    var lastValues = {};

    defineRule('rgbwd-state', {
        whenChanged: ['wb-mrgbw-d_153/Channel B', 'wb-mrgbw-d_153/Channel R', 'wb-mrgbw-d_153/Channel G', 'wb-mrgbw-d_153/Channel W'],
        then: function(newVal, devName, cellName) {
            // /state - on/off flag for Home Assistant
            publish('/devices/'+ devName +'/controls/'+ cellName +'/state', newVal > 0 ? 1 : 0, 0, true);
            if (newVal) {
                // save last value for each channel
                lastValues[devName + '/' + cellName] = newVal;
            }
        }
    });

    trackMqtt('/devices/wb-mrgbw-d_153/controls/+/set', function(message) {
        var matched = message.topic.match(/\/devices\/(.*)?\/controls\/(.*)?\/set/);
        if (matched) {
            if (message.value === '1') {
                if (dev[matched[1]][matched[2]] > 0) {
                  return;
                }
                // on "turning on" set brightness to last saved value
                dev[matched[1]][matched[2]] = lastValues[matched[1] + '/' + matched[2]] || 100;
            } else {
                dev[matched[1]][matched[2]] = 0;
            }
        }
    });
})();

function switchRelay(device, control) {
  dev[device][control] = !dev[device + "/" + control];
}

function switchDimmerRGB(relayDevice, relayControl, dimmerDevice) {
   dev[relayDevice][relayControl] = true;
   if (dev[dimmerDevice + "/RGB"] !== "0;0;0") {
     dev[dimmerDevice]["RGB"] = "0;0;0";
   }
   else {
     dev[dimmerDevice]["RGB"] = dev[relayDevice + "/RGB"];
   }
}

function setRandomRGB(relayDevice, relayControl, dimmerDevice) {
  dev[relayDevice][relayControl] = true;
  dev[relayDevice + "/RGB"] = "" + Math.floor(Math.random() * 255) + ";" + Math.floor(Math.random() * 255) + ";" + Math.floor(Math.random() * 255);
  dev[dimmerDevice]["RGB"] = dev[relayDevice + "/RGB"];
}

var Destinations; // Флаг направления изменения яркости, для опредееняи увиличивать или уменьшать
function dimmerChange(dimmerName, outputName, shiftValue, maxValue) {
  log.debug('dimmerChange', dev["wb-gpio"]["EXT1_IN12"], dimmerName, outputName, shiftValue, maxValue);
  // while (dev["wb-gpio"]["EXT1_IN12"]) {
    var currentValue = dev[dimmerName][outputName]  //получим текущее значение
    if (Destinations) {
      var newValue = currentValue + shiftValue; //Определяем предполоджительно новое значение
      if (newValue > maxValue) {
        newValue = maxValue;
        dev[dimmerName][outputName] = newValue; //ставим на заданное значение
        Destinations = false;
        return;
      }
      dev[dimmerName][outputName] = newValue; //ставим на заданное значение

    } else {
      var newValue = currentValue - shiftValue; //Определяем предположительно новое значение
      if (newValue < 0) {
        newValue = 0;
        dev[dimmerName][outputName] = newValue; //ставим на заданное значение
        Destinations = true;
        return;
      }
      dev[dimmerName][outputName] = newValue; //ставим на заданное значение
    }
  // }
}




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
