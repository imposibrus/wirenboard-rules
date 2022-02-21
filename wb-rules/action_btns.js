/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */

var ActionButtons = require('ActionButtons').ActionButtons;

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

// function switchGroup(devices, state) {
//   return devices.map(function(path) {
//     var chunks = path.split('/');
//     dev[chunks[0]][chunks[1]] = state;
//   });
// }

// defineRule('12_test', {
//     whenChanged: 'wb-gpio/EXT1_IN12',
//     then: function(newVal) {
//         if (newVal) {
//             dev['wb-mr6c_138']['K1'] = !dev['wb-mr6c_138']['K1'];
//         }
//     }
// });
//
// ActionButtons.onButtonPress(
//   'wb-gpio/EXT1_IN12',
//   {
//     singlePress: {
//       func: switchRelay,
//       prop: ['wb-mr6c_138', 'K1']
//     },
//     doublePress: {
//       func: function() {
//         dev['wb-mr6c_42']['K3'] = !dev["wb-mr6c_42/K3"];
//         dev['wb-mr6c_138']['K1'] = !dev["wb-mr6c_138/K1"];
//       },
//       prop: ['wb-mr6c_42', 'K3']
//       //func: switchDimmerRGB,
//       //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
//     },
//     longPress: {
//       func: dimmerChange,
//       prop: ["wb-mdm3_104", "Channel 3", 3, 100]
//       //func: setRandomRGB,
//       //prop: ["wb-mr6c_10", "K2", "wb-mrgbw-d_24"]
//     },
//     longRelease: {
//       func: function () {
//         log.debug('longRelease');
//       }
//     }
//   },
//   300,
//   1000
// );
//
// /*
// defineRule('move_sensor', {
//     whenChanged: ['wb-adc/A1'],
//     then: function(newVal, devName, cellName) {
//         if (newVal > 3) {
//             dev['wb-mr6c_42']['K1'] = true;
//         } else {
//             dev['wb-mr6c_42']['K1'] = false;
//         }
//     }
// });
// */
//
// function switchRelay(device, control) {
//   dev[device][control] = !dev[device + "/" + control];
// }
//
// function switchDimmerRGB(relayDevice, relayControl, dimmerDevice) {
//   dev[relayDevice][relayControl] = true;
//   if (dev[dimmerDevice + "/RGB"] !== "0;0;0") {
//     dev[dimmerDevice]["RGB"] = "0;0;0";
//   }
//   else {
//     dev[dimmerDevice]["RGB"] = dev[relayDevice + "/RGB"];
//   }
// }
//
// function setRandomRGB(relayDevice, relayControl, dimmerDevice) {
//   dev[relayDevice][relayControl] = true;
//   dev[relayDevice + "/RGB"] = "" + Math.floor(Math.random() * 255) + ";" + Math.floor(Math.random() * 255) + ";" + Math.floor(Math.random() * 255);
//   dev[dimmerDevice]["RGB"] = dev[relayDevice + "/RGB"];
// }
//
// var Destinations; // Флаг направления изменения яркости, для опредееняи увиличивать или уменьшать
// function dimmerChange(dimmerName, outputName, shiftValue, maxValue) {
//   log.debug('dimmerChange', dev["wb-gpio"]["EXT1_IN12"], dimmerName, outputName, shiftValue, maxValue);
//   // while (dev["wb-gpio"]["EXT1_IN12"]) {
//   var currentValue = dev[dimmerName][outputName]  //получим текущее значение
//   if (Destinations) {
//     var newValue = currentValue + shiftValue; //Определяем предполоджительно новое значение
//     if (newValue > maxValue) {
//       newValue = maxValue;
//       dev[dimmerName][outputName] = newValue; //ставим на заданное значение
//       Destinations = false;
//       return;
//     }
//     dev[dimmerName][outputName] = newValue; //ставим на заданное значение
//
//   } else {
//     var newValue = currentValue - shiftValue; //Определяем предположительно новое значение
//     if (newValue < 0) {
//       newValue = 0;
//       dev[dimmerName][outputName] = newValue; //ставим на заданное значение
//       Destinations = true;
//       return;
//     }
//     dev[dimmerName][outputName] = newValue; //ставим на заданное значение
//   }
//   // }
// }
