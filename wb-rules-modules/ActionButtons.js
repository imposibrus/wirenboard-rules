/* globals defineRule, log */

(function () {
    'use strict';

    var ActionButtons = {};

    /**
     * Version: 0.3
     *
     * Function that identifies what kind of press was performed: single, double or long press;
     * and assigns an action for each type of press.
     *
     * @param  {string} trigger         -  Name of device and control in the following format: "<device>/<control>".
     * @param  {Action} action          -  Defines actions to be taken for each type of button press.
     *                                  Key: "singlePress" or "doublePress" or "triplePress" or "longPress" or "longRelease".
     *                                  Value: Object of the following structure {func: <function name>, prop: <array of parameters to be passed>}
     *                                  Example:
     *                                  {
     *                                      singlePress: {func: myFunc1, prop: ["wb-mr6c_1", "K1"]},
     *                                      doublePress: {func: myFunc2, prop: ["wb-mrgbw-d_2", "RGB", "255;177;85"]},
     *                                      triplePress: {func: myFunc3, prop: []},
     *                                      longPress: {func: myFunc4, prop: []},
     *                                      longRelease: {func: myFunc5, prop: []}
     *                                  }
     * @param  {number} timeToNextPress -  Time (ms) after button up to wait for the next press before reseting the counter. Default is 300 ms.
     * @param  {number} timeOfLongPress -  Time (ms) after button down to be considered as as a long press. Default is 1000 ms (1 sec).
     * @param  {number} intervalOfRepeat - Time (ms) before repeating action specified in LongPress action. Default is 50 ms.
     *
     * Note: In case longRelease function defined, longPress function will repeate till button is released.
     *       In case longRelease function not defined, only one action will be executed for longPress.
     */
    ActionButtons.onButtonPress = function (trigger, action, timeToNextPress, timeOfLongPress, intervalOfRepeat) {

        // Set default values if not passed into function
        timeToNextPress = timeToNextPress || 300;
        timeOfLongPress = timeOfLongPress || 1000;
        intervalOfRepeat = intervalOfRepeat || 100;

        var buttonPressedCounter = 0;
        var actionRepeatCounter = 0;
        var timerWaitNextShortPress = null;
        var timerLongPress = null;
        var timerWaitLongRelease = null;
        var isLongPressed = false;
        var isLongReleased = false;

        var ruleName = "on_button_press_" + trigger.replace("/", "_");
        log("LOG::Define WB Rule: ", ruleName);

        defineRule(ruleName, {
            whenChanged: trigger,
            then: function (newValue, devName, cellName) {
                // If button is pressed, wait for a long press
                if (newValue) {
                    if (timerWaitNextShortPress) {
                        clearTimeout(timerWaitNextShortPress);
                    }

                    timerLongPress = setTimeout(function () {
                        isLongPressed = true;  // Long press identified, we will skip short press
                        isLongReleased = false;
                        buttonPressedCounter = 0;
                        actionRepeatCounter = 1;

                        if (typeof action.longPress === "object") {
                            if (typeof action.longPress.func === "function") {
                                action.longPress.func.apply(this, action.longPress.prop || []);
                                // If Long Release action define, we will repeat Long Press action till not released. Otherwise only 1 Long Press action is executed
                                if (typeof action.longRelease === "object") {
                                    if (typeof action.longRelease.func === "function") {
                                        timerWaitLongRelease = setInterval(function () {
                                            if(!isLongReleased) {
                                                if (typeof action.longPress === "object") {
                                                    if (typeof action.longPress.func === "function") {
                                                        action.longPress.func.apply(this, action.longPress.prop || []);
                                                    }
                                                }
                                                // log(">>>>>> long press - press (" + actionRepeatCounter++ + ") <<<<<<");
                                            }
                                            if(isLongReleased) {
                                                clearInterval(timerWaitLongRelease);
                                            }
                                        }, intervalOfRepeat);
                                    }
                                }

                            }
                        }
                        // log(">>>>>> long press - press (" + actionRepeatCounter++ + ") <<<<<<");
                    }, timeOfLongPress);
                } else {
                    // If button is released, then it is not a "long press", start to count clicks
                    if (!isLongPressed) {
                        if (timerLongPress) {
                            clearTimeout(timerLongPress);
                        }
                        buttonPressedCounter += 1;
                        timerWaitNextShortPress = setTimeout(function () {
                            switch (buttonPressedCounter) {
                                // Counter equals 1 - it's a single short press
                                case 1:
                                    if (typeof action.singlePress === "object") {
                                        if (typeof action.singlePress.func === "function") {
                                            action.singlePress.func.apply(this, action.singlePress.prop || []);
                                        }
                                    }
                                    // log(">>>>>> short press - single <<<<<<");
                                    break;
                                // Counter equals 2 - it's a double short press
                                case 2:
                                    if (typeof action.doublePress === "object") {
                                        if (typeof action.doublePress.func === "function") {
                                            action.doublePress.func.apply(this, action.doublePress.prop || []);
                                        }
                                    }
                                    // log(">>>>>> short press - double <<<<<<");
                                    break;
                                // Counter equals 3 - it's a triple short press
                                case 3:
                                    if (typeof action.triplePress === "object") {
                                        if (typeof action.triplePress.func === "function") {
                                            action.triplePress.func.apply(this, action.triplePress.prop || []);
                                        }
                                    }
                                    // log(">>>>>> short press - triple <<<<<<");
                                    break;
                            }
                            // Reset the counter
                            buttonPressedCounter = 0;
                        }, timeToNextPress);
                    } else {
                        // Catch button released after long press
                        if (typeof action.longRelease === "object") {
                            if (typeof action.longRelease.func === "function") {
                                action.longRelease.func.apply(this, action.longRelease.prop || []);
                            }
                        }
                        // log(">>>>>> long press - release <<<<<<");
                        isLongPressed = false;
                        isLongReleased = true;
                    }
                }
            }
        });
    };

    exports.ActionButtons = ActionButtons;
}());

/**
 * @typedef Action
 * @type Object
 * @property {ActionProp} [singlePress]
 * @property {ActionProp} [doublePress]
 * @property {ActionProp} [triplePress]
 * @property {ActionProp} [longPress]
 * @property {ActionProp} [longRelease]
 */

/**
 * @typedef ActionProp
 * @type Object
 * @property {Function} [func]
 * @property {Object} [prop]
 */
