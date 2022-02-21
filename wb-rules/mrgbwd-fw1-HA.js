// (function() {
//   // TODO: switch to persistent storage
//   var lastValues = {};
//
//   defineRule('rgbwd-state', {
//     whenChanged: ['wb-mrgbw-d_153/Channel B', 'wb-mrgbw-d_153/Channel R', 'wb-mrgbw-d_153/Channel G', 'wb-mrgbw-d_153/Channel W'],
//     then: function(newVal, devName, cellName) {
//       // /state - on/off flag for Home Assistant
//       publish('/devices/'+ devName +'/controls/'+ cellName +'/state', newVal > 0 ? 1 : 0, 0, true);
//       if (newVal) {
//         // save last value for each channel
//         lastValues[devName + '/' + cellName] = newVal;
//       }
//     }
//   });
//
//   trackMqtt('/devices/wb-mrgbw-d_153/controls/+/set', function(message) {
//     var matched = message.topic.match(/\/devices\/(.*)?\/controls\/(.*)?\/set/);
//     if (matched) {
//       if (message.value === '1') {
//         if (dev[matched[1]][matched[2]] > 0) {
//           return;
//         }
//         // on "turning on" set brightness to last saved value
//         dev[matched[1]][matched[2]] = lastValues[matched[1] + '/' + matched[2]] || 100;
//       } else {
//         dev[matched[1]][matched[2]] = 0;
//       }
//     }
//   });
// })();
