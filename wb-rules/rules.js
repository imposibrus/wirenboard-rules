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
      value: true,
    },
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

defineRule("heater_control", {
  whenChanged: "wb-w1/28-3c01d075c755",
  then: function (newValue, devName, cellName) {
    if (!dev['heater_control/enabled'] && !dev['overheat_control/enabled']) return;
    if ( newValue >= setpoints.temperature) {
      dev["wb-mdm3_104"]["K3"] = false;
    } else if (dev['heater_control/enabled']) {
      dev["wb-mdm3_104"]["K3"] = true;
    }
  }
});

defineRule("heater_control2", {
  whenChanged: "wb-m1w2_224/External Sensor 1",
  then: function (newValue, devName, cellName) {
    if (!dev['heater_control/enabled'] && !dev['overheat_control/enabled']) return;
    if ( newValue >= setpoints.temperature) {
      dev["wb-mr6c_42"]["K3"] = false;
    } else if (dev['heater_control/enabled']) {
      dev["wb-mr6c_42"]["K3"] = true;
    }
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
  },
});

ActionButtons.onButtonPress(
    'wb-gpio/EXT1_IN11',
    {
      singlePress: {
         func: function() {
           log.debug('singlePress', arguments);
         },
         prop: ['wb-mr6c_42', 'K3']
      },
      doublePress: {
        func: switchRelay,
        prop: ['wb-mr6c_42', 'K3']
        //func: switchDimmerRGB,
        //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
      },
      longPress: {
        func: switchRelay,
        prop: ["wb-mdm3_104", "K3"]
        //func: setRandomRGB,
        //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
      },
      longRelease: {
        func: function () {
          log.debug('longRelease');
        },
      }
    },
    300,
    1000
);

ActionButtons.onButtonPress(
    'wb-gpio/EXT1_IN12',
    {
      singlePress: {
         func: function() {
           log.debug('singlePress', arguments);
         },
         prop: ['wb-mr6c_42', 'K3']
      },
      doublePress: {
        func: switchRelay,
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
        },
      }
    },
    300,
    1000
);


function switchRelay(device, control) { //Принимает в параметрах устройство и выход. Переключает состояние выхода на противоположное.
  log.info("LongPress switchRelay" ,device, control)//Это лог. Он попадает в /var/log/messages
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
