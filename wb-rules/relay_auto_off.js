/* globals defineRule, defineVirtualDevice, log, global, dev, exports, cron, PersistentStorage */

var RelaysAutoOff = require('RelaysAutoOff').RelaysAutoOff;

RelaysAutoOff.addControl('wb-mrm2-mini_134/K1');
RelaysAutoOff.addControl('wb-mrm2-mini_134/K2');
RelaysAutoOff.addControl('wb-mr6c_138/K2');
RelaysAutoOff.init();
