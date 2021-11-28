import { get } from 'svelte/store';
import { isActiveListening } from './store';

function getHost(url) {
  return new URL(url).host;
}

export function performAction(action) {
  if (isActiveListening()) {
    action();
  }
}

export function performActionWithDelay(action) {
  setTimeout(() => {
    performAction(action);
  }, 100);
}


export function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true }, tabs => {
      if (tabs.length > 0) {
        resolve(tabs[0]);
      } else {
        reject('No active tab found');
      }
    });
  });
}

export async function executeScripts(code) {
  const activeTab = await getActiveTab();
  chrome.tabs.executeScript(activeTab.id, {
    code: `(function() { ${code} })();`,
    allFrames: true
  });
}

export async function openTabWithUrl(url) {
  const activeTab = await getActiveTab();
  const activeTabUrl = activeTab.url;
  if (
    !activeTabUrl ||
    activeTabUrl == "chrome://newtab/" ||
    getHost(activeTabUrl) == getHost(url)
  ) {
    chrome.tabs.update(activeTab.id, { url: url });
  } else {
    chrome.tabs.create({ url: url });
  }
}
