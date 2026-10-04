import { MODULE_ID } from "./constants.js";
import { injectQualities } from "./injector.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "customQualities", {
    scope: "world",
    config: false,
    type: Object,
    default: { qualities: [] },
    onChange: () => {
      injectQualities();
      ui.notifications.info("Lookfar Extension: cualidades actualizadas.");
    },
  });

  game.settings.register(MODULE_ID, "customCategories", {
    scope: "world",
    config: false,
    type: Array,
    default: [],
    onChange: () => {
      injectQualities();
      ui.notifications.info("Lookfar Extension: categorías actualizadas.");
    },
  });

  game.settings.register(MODULE_ID, "hideNativeQualities", {
    name: "LOOKFAR_EXT.Settings.HideNative.Name",
    hint: "LOOKFAR_EXT.Settings.HideNative.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      injectQualities();
      ui.notifications.info(
        "Lookfar Extension: preferencia de cualidades nativas actualizada.",
      );
    },
  });
}
