/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */

var buzzerIntervalId;
var buzzerTimeoutId;
var silenceTimeoutId;
var buzzerInterval = 500;
var buzzerTimeout = 1000 * 30; // 30 sec
var silenceTimeout = 1000 * 60 * 5; // 5 min

defineVirtualDevice("alarm_fridge", {
  title: "Сигнализация холодильника",
  cells: {
    enabled: {
      type: "switch",
      value: false
    },
    silenced: {
      type: "switch",
      value: false
    }
  }
});

defineRule('alarm_fridge_buzzer', {
  whenChanged: ['alarm_fridge/enabled', 'alarm_fridge/silenced'],
  then: function (newVal, devName, cellName) {
    if (cellName === 'silenced') {
      if (newVal) {
        dev['alarm_fridge/enabled'] = false;
        silenceTimeoutId = setTimeout(function() {
          dev['alarm_fridge/silenced'] = false;
        }, silenceTimeout);
      } else {
        clearTimeout(silenceTimeoutId);
      }
      return;
    }

    dev['buzzer/enabled'] = dev['alarm_fridge/enabled'];

    if (dev['alarm_fridge/enabled']) {
      if (dev['alarm_fridge/silenced']) {
        return;
      }

      // start buzzer cycle "beep-beep-beep..."
      dev['buzzer/frequency'] = 500;
      dev['buzzer/volume'] = 50;

      buzzerIntervalId = setInterval(function() {
        dev['buzzer/enabled'] = !dev['buzzer/enabled'];
      }, buzzerInterval);

      // disable alarm after some timeout
      buzzerTimeoutId = setTimeout(function() {
        clearInterval(buzzerIntervalId);
        dev['alarm_fridge/enabled'] = false;
      }, buzzerTimeout);
    } else {
      // disable all scheduled timeouts/intervals
      clearInterval(buzzerIntervalId);
      clearTimeout(buzzerTimeoutId);
    }
  }
});
