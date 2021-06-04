/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */

// place your rules here or add more .js files in this directory
// log("add your rules to /etc/wb-rules/");

var ActionButtons = require('ActionButtons').ActionButtons;

defineVirtualDevice("heater_control", {
  title: "Управление отоплением",
  cells: {
    enabled: {
      type: "switch",
      value: false
    }
  }
});

defineVirtualDevice("overheat_control", {
  title: "Управление перегревом",
  cells: {
    enabled: {
      type: "switch",
      value: true
    }
    // enabled: {
    //   type: "switch",
    //   value: true,
    // },
  }
});

/**
 * @type Setpoints
 */
var setpoints = readConfig("/etc/wb-mqtt-setpoints.json");

overheat_control('wb-w1/28-3c01d075c755', 'wb-mdm3_104/K3');

overheat_control('wb-m1w2_224/External Sensor 1', 'wb-mr6c_42/K3');

overheat_control('wb-w1/28-01206018a787', 'wb-mr6c_138/K1');

/**
 *
 * @param {String} sensor
 * @param {String} relay
 */
function overheat_control(sensor, relay) {
    var name = 'overheat_control_' + sensor.replace('/', '_');
    var relayPath = relay.split('/');

    defineRule(name, {
        whenChanged: [sensor, 'heater_control/enabled', 'overheat_control/enabled'],
        then: function (newValue, devName, cellName) {
            if (!dev['heater_control/enabled'] && !dev['overheat_control/enabled']) return;
            if ( dev[sensor] >= setpoints.temperature) {
                dev[relayPath[0]][relayPath[1]] = false;
            } else if (dev['heater_control/enabled']) {
                dev[relayPath[0]][relayPath[1]] = true;
            }
        }
    });
}

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

(function() {
    var lastPressTime = Date.now();
    var group11 = ['wb-mr6c_42/K3', 'wb-mr6c_138/K1'];

    defineRule('11_test', {
        whenChanged: 'wb-gpio/EXT1_IN11',
        then: function(newVal) {
            if (newVal) {
                var now = Date.now();
                var shouldOff = group11.some(function(path) {var chunks = path.split('/'); return dev[chunks[0]][chunks[1]];});

                // double press
                if (now - lastPressTime <= 300) {
                    var secondaryState = dev['wb-mr6c_138']['K1'];
                    log('double press', secondaryState);
                    dev['wb-mr6c_138']['K1'] = !secondaryState;
                    dev['wb-mr6c_42']['K3'] = !secondaryState;
                } else {
                    // single press
                    log('single press', shouldOff);
                    if (shouldOff) {
                        // switch off all group on single press (when at least one lamp was ON)
                        switchGroup(group11, false);
                    } else {
                        dev['wb-mr6c_42']['K3'] = !shouldOff;
                    }
                }

                lastPressTime = now;
            }
        }
    });
})();

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
        whenChanged: ['wb-mrgbw-d_153/White 1-B', 'wb-mrgbw-d_153/White 2-R', 'wb-mrgbw-d_153/White 3-G', 'wb-mrgbw-d_153/White 4-W'],
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
 * @param {String} value
 * @param {String} dev
 * @param {String} name
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
