/* globals defineVirtualDevice, defineRule, dev, log, readConfig, publish, trackMqtt */

defineVirtualDevice("is_anyone_home", {
  title: "Кто-нибудь дома?",
  cells: {
    enabled: {
      type: "switch",
      value: true,
      readonly: true
    }
  }
});
