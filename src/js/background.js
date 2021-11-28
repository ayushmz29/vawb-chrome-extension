import { allPlugins } from "./plugins/index";
import { initCommander } from "./commander";
import { initContextMenus } from "./context_menu";
import { initBrowserAction } from "./browser_actions";
import { initTabMuteListener } from "./tab_muter";

initCommander(allPlugins);
initBrowserAction();
initContextMenus();
initTabMuteListener();

chrome.runtime.onInstalled.addListener(e => {
  if (chrome.runtime.OnInstalledReason.INSTALL === e.reason) {
    chrome.runtime.openOptionsPage();
  }
});
