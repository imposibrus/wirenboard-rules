/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */

// defineVirtualDevice("master_btn", {
//   title: "Мастер выключатель",
//   cells: {
//     enabled: {
//       type: "switch",
//       value: false
//     }
//   }
// });
//
// var allLightsDevices = ['wb-mr6c_42/K3', 'wb-mdm3_104/K3'];
//
// defineRule('master_off', {
//   whenChanged: ['wb-gpio/EXT1_IN13', 'master_btn/enabled'],
//   then: function(newVal, devName, cellName) {
//     if ((newVal && devName === 'wb-gpio' && cellName === 'EXT1_IN13') || (devName === 'master_btn' && cellName === 'enabled')) {
//       var shouldOff = allLightsDevices.some(function(path) {var chunks = path.split('/'); return dev[chunks[0]][chunks[1]];});
//       var allOff = allLightsDevices.every(function(path) {var chunks = path.split('/'); return dev[chunks[0]][chunks[1]] === false;});
//       if (devName === 'wb-gpio' && cellName === 'EXT1_IN13') {
//         dev['master_btn/enabled'] = !shouldOff;
//       }
//       if (allOff) {
//         // если весь свет был выключен, то включить свет только в коридоре
//         dev["wb-mdm3_104"]["K3"] = dev['master_btn/enabled'];
//       } else {
//         dev['wb-mr6c_42']['K3'] = dev['master_btn/enabled'];
//         dev["wb-mdm3_104"]["K3"] = dev['master_btn/enabled'];
//       }
//     }
//   }
// });
