/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt, runShellCommand */
(function () {
  defineVirtualDevice("buzzersound", {
    title: "Buzzer Sound", //

    cells: {
      "Play Sound": {
        type: "pushbutton",
        value: false,
        order: 0
      },
      "Stop Sound": {
        type: "pushbutton",
        value: false,
        order: 1
      },
      Status: {
        type: "text",
        forceDefault: true,
        value: "idle",
        order: 2
      },
      Notes: {
        type: "text",
        readonly: false,
        value: "D4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4 C4",
        description: "Play sound",
        order: 3
      },
      Duration: {
        type: "range",
        value: 0,
        min: 0,
        max: 60,
        order: 4
      },
      Volume: {
        type: "range",
        value: "100",
        min: 1,
        max: 100,
        order: 5
      },
      "Play Nokia": {
        type: "pushbutton",
        value: false,
        order: 6
      },
      "Play Christmas": {
        type: "pushbutton",
        value: false,
        order: 7
      },
      "Play StarWars": {
        type: "pushbutton",
        value: false,
        order: 8
      },
    }
  });

  var pwm_number = 1;
  var notes = {P: 0};
  var delays = {32: 750, 16: 125, 8: 250, 4: 500, 2: 1000};
  var play_status = false;
  var timer_main = false;
  var timer_timeout = false;
  var play_notes = [];
  var play_index = 0;
  var play_timeout = 0;
  var play_tick = 0;
  var play_volume = 100;

  var samples = [
    'E6/16 D6/16 F#5/8 G#5/8 C#6/16 B5/16 D5/8 E5/8 B5/16 A5/16 C#5/8 E5/8 A5/8',
    'A5/8 A5/16 G5/16 F#5/8 E5/8 D5/8 E5/8 F#5/8 D5/8 E5/16 F#5/16 G5/16 E5/16 F#5/8 P/16 E5/16 D5/8 C#5/8 D5/8',
    'A#4/8 A#4/8 P/16 F5/8 F5/8 P/16 D#5/16 P/16 D5/16 P/16 C4/16 P/16 A#5/8 A#5/8 P/16 F5/8 P/16 D#5/16 P/16 D5/16 P/16 C4/16 P/16 A#5/8 A#5/8 P/16 F5/8 P/16 D#5/16 P/16 D5/16 P/16 D#5/16 P/16 C4/8 C4/8'
  ];

  function _getNotes() {
    _notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    base_freq = 27.5;
    for (var i = 0; i < 88; i++) {
      var note = _notes[i % _notes.length] + Math.floor((i + 8) / _notes.length);
      var freq = Math.round(base_freq * Math.pow(2, i / 12));
      notes[note] = Math.round(1000000000 / freq);
    }
  }

  _getNotes();

  runShellCommand("bash -c '. /etc/wb_env.sh && echo -n $WB_PWM_BUZZER'", {
    captureOutput: true,
    exitCallback: function (exitCode, capturedOutput) {
      if (capturedOutput) {
        pwm_number = parseInt(capturedOutput);
      }

      runShellCommand("stat /sys/class/pwm/pwmchip0/pwm" + pwm_number + "|| echo " + pwm_number + "  > /sys/class/pwm/pwmchip0/export");
    }
  });


  function buzzer_sound_play(notes, timeout, volume) {
    if (play_status) {
      buzzer_sound_stop();
    }
    if (typeof volume != "number") {
      volume = 100;
    }
    play_notes = notes.split(/ /);
    play_timeout = timeout;
    play_index = 0;
    play_tick = 0;
    play_status = true;
    play_volume = volume;
    dev["buzzersound/Status"] = 'playing';
    buzzer_sound_player();
    if (play_timeout > 0) {
      timer_timeout = setTimeout(buzzer_sound_stop, 1000 * play_timeout);
    }
  }

  function buzzer_sound_beep(period, volume) {
    if (play_tick++ == 0) {
      runShellCommand("echo 1  > /sys/class/pwm/pwmchip0/pwm" + pwm_number + "/enable");
    }
    var duty_cycle = parseInt(volume * 1.0 / 100 * period * 0.5);
    runShellCommand("echo " + period + " > /sys/class/pwm/pwmchip0/pwm" + pwm_number + "/period");
    runShellCommand("echo " + duty_cycle + " > /sys/class/pwm/pwmchip0/pwm" + pwm_number + "/duty_cycle");
  }

  function buzzer_sound_stop() {
    play_status = false;
    if (timer_main) clearTimeout(timer_main);
    if (timer_timeout) clearTimeout(timer_timeout);
    timer_main = false;
    timer_timeout = false;
    dev["buzzersound/Status"] = 'idle';
    runShellCommand("echo 0  > /sys/class/pwm/pwmchip0/pwm" + pwm_number + "/enable");
  }

  function buzzer_sound_player() {
    if (!play_status) {
      return;
    }
    if (play_index >= play_notes.length) {
      if (play_timeout == 0) {
        return buzzer_sound_stop();
      }
      play_index = 0;
    }
    var note = play_notes[play_index].split(/\//);
    play_index++;
    var delay = 4;
    if (typeof note[1] !== 'undefined') {
      delay = note[1];
    }
    // log("Play vol={} note={} delay={} period={}", play_volume, note[0], delay, notes[note[0]]);
    if (note[0] == 'P') {
      buzzer_sound_beep(2500000, 0);
    } else {
      buzzer_sound_beep(notes[note[0]], play_volume);
    }
    timer_main = setTimeout(buzzer_sound_player, delays[delay]);
  }

  defineRule("buzzer_sound_play", {
    whenChanged: "buzzersound/Play Sound",
    then: function (value) {
      if (!value) return;
      buzzer_sound_play(dev["buzzersound"]["Notes"], dev["buzzersound"]["Duration"], dev["buzzersound"]["Volume"]);
    }
  });
  defineRule("buzzer_sound_stop", {
    whenChanged: "buzzersound/Stop Sound",
    then: function (value) {
      if (!value) return;
      buzzer_sound_stop()
    }
  });

  defineRule("buzzer_sound_sample1", {
    whenChanged: "buzzersound/Play Nokia",
    then: function (value) {
      if (!value) return;
      dev["buzzersound"]["Notes"] = samples[0];
      buzzer_sound_play(samples[0], dev["buzzersound"]["Duration"], dev["buzzersound"]["Volume"]);
    }
  });

  defineRule("buzzer_sound_sample2", {
    whenChanged: "buzzersound/Play Christmas",
    then: function (value) {
      if (!value) return;
      dev["buzzersound"]["Notes"] = samples[1];
      buzzer_sound_play(samples[1], dev["buzzersound"]["Duration"], dev["buzzersound"]["Volume"]);
    }
  });

  defineRule("buzzer_sound_sample3", {
    whenChanged: "buzzersound/Play StarWars",
    then: function (value) {
      if (!value) return;
      dev["buzzersound"]["Notes"] = samples[2];
      buzzer_sound_play(samples[2], dev["buzzersound"]["Duration"], dev["buzzersound"]["Volume"]);
    }
  });


})();
