/* globals defineRule, defineVirtualDevice, log, global, dev, exports, cron, PersistentStorage */

var RelaysAutoOff = require('RelaysAutoOff').RelaysAutoOff;

RelaysAutoOff.addControl('wb-mrm2-mini_134/Relay 1');
RelaysAutoOff.addControl('wb-mrm2-mini_134/Relay 2');
RelaysAutoOff.addControl('wb-mr6c_138/K2');
RelaysAutoOff.init();
