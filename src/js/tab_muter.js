import { activeListening } from './store';

export function initTabMuteListener() {
  activeListening.subscribe(enabled => {
    if (enabled) {
      chrome.tabs.query({ audible: true }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.update(tab.id, { muted: true });
        }
      });
    } else {
      chrome.tabs.query({ muted: true }, (tabs) => {
        for (const tab of tabs) {
          if (tab.mutedInfo.extensionId === chrome.runtime.id) {
            chrome.tabs.update(tab.id, { muted: false });
          }
        }
      });
    }
  });
}
