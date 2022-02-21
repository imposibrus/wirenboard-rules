/* globals defineRule, defineVirtualDevice, log, global, dev, exports, cron */

global.__proto__.Schedules = {};

(function(Schedules) { // замыкание

  function todayAt(now, hours, minutes) {
    var date = new Date(now);
    // i.e. "today, at HH:MM". All dates are in UTC!
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  }

  /**
   * @param {Date} now
   * @param {Number[]} start_time
   * @param {Number[]} end_time
   * @return {boolean}
   */
  function checkScheduleInterval(now, start_time, end_time) {
    var start_date = todayAt(now, start_time[0], start_time[1]);
    var end_date = todayAt(now, end_time[0], end_time[1]);
    // log("checkScheduleInterval {} {} {}".format(now, start_date, end_date));

    if (end_date >= start_date) {
      if ((now >= start_date) && (now < end_date)) {
        return true;
      }
    } else {
      // end date is less than start date,
      // assuming they belong to a different days (e.g. today and tomorrow)

      // option 1: what if it's now the day of "end" date?
      // in this case the following is enough:
      if (now < end_date) {
        return true;
      }

      // well, that seems not to be the case. ok,
      // option 2: it's the day of "start" date:

      if (now >= start_date) {
        return true;
      }
    }
    return false;

  }

  /**
   * @param {Schedule} schedule
   * @param {Date} [now]
   */
  function checkSchedule(schedule, now) {
    if (now == undefined) {
      now = new Date();
    }

    for (var i = 0; i < schedule.intervals.length; ++i) {
      var item = schedule.intervals[i];
      if (checkScheduleInterval(now, item[0], item[1])) {
        // log("found matching schedule interval at {}".format(item));
        return true;
      }
    }
    return false;
  }

  /**
   * @param {Schedule} schedule
   */
  function updateSingleScheduleDevStatus(schedule) {
    // log("updateSingleScheduleDevStatus {}".format(schedule.name));
    dev["_schedules"][schedule.name] = checkSchedule(schedule);
  }

  /**
   * @param {Schedule} schedule
   */
  function addScheduleDevCronTasks(schedule) {
    for (var i = 0; i < schedule.intervals.length; ++i) {
      var interval = schedule.intervals[i];
      for (var j = 0; j < 2; ++j) { // either start or end of the interval
        var hours = interval[j][0];
        var minutes = interval[j][1];
        log("cron at " + "0 " + minutes + " " + hours + " * * *");
        (function(i, j) {
          defineRule("_schedule_dev_{}_{}_{}".format(schedule.name, i, j), {
            when: cron("0 " + minutes + " " + hours + " * * *"),
            then: function () {
              log("_schedule_dev_ {}_{}_{}".format(schedule.name, i, j));
              updateSingleScheduleDevStatus(schedule);
            }
          });
        })(i, j);
      }
    }
  }

  /**
   * @param {Schedule} schedule
   */
  function addScheduleAutoUpdCronTask(schedule) {
    defineRule("_schedule_auto_upd_{}".format(schedule.name), {
      when: cron("@every " + schedule.autoUpdate),
      then: function() {
        dev._schedules[schedule.name] = dev._schedules[schedule.name];
      }
    });
  }

  var _schedules = {};

  /**
   * @param {Schedule} schedule
   */
  Schedules.registerSchedule = function(schedule) {
    _schedules[schedule.name] = schedule;
  };

  Schedules.initSchedules = function() {
    var params = {
      title: "Schedule Status",
      cells: {}
    };

    for (var schedule_name in _schedules) {
      if (_schedules.hasOwnProperty(schedule_name)) {
        // var schedule = _schedules[schedule_name];
        params.cells[schedule_name] = {type: "switch", value: false, readonly: true};
      }
    }

    defineVirtualDevice("_schedules", params);


    for (var schedule_name in _schedules) {
      if (_schedules.hasOwnProperty(schedule_name)) {
        var schedule = _schedules[schedule_name];

        // setup cron tasks which updates the schedule dev status at schedule
        //   interval beginings and ends
        addScheduleDevCronTasks(schedule);

        // if needed, setup periodic task to trigger rules which use this schedule
        if (schedule.autoUpdate) {
          addScheduleAutoUpdCronTask(schedule);
        }

        // set schedule dev status as soon as possible at startup
        (function(schedule) {
          setTimeout(function() {
            updateSingleScheduleDevStatus(schedule);
          }, 1);
        })(schedule);

      }
    }
  };

  exports.Schedules = Schedules;
})(Schedules);

/**
 * @typedef Schedule
 * @property {String} name
 * @property {String} autoUpdate
 * @property {Number[][][]} intervals
 */
