import { storage } from "./common";
import { hotwordEnabled } from "./store";

export function initContextMenus() {
  chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    title: '"Hey Buddy" hotword detection',
    type: "checkbox",
    id: "hotword",
    contexts: ["browser_action"],
    onclick: info => {
      storage.set({ hotword: info.checked });
    }
  });

  hotwordEnabled.subscribe(result => {
    chrome.contextMenus.update("hotword", { checked: result });
  });
}
