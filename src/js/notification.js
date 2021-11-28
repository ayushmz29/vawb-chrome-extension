import { DEBUG } from "./common";
import { getActiveTab } from './core';
import { activeListening } from './store';

const NOTIFICATION_TIMEOUT = 15000;
let lastData = undefined;

activeListening.subscribe(value => {
  if (value) {
    sendMessage({
      type: "START_LISTENING",
      title: "Listening",
      content: "Hi, how can I help you?"
    });
  } else {
    clearMessage();
  }
});

chrome.tabs.onActivated.addListener(() => {
  resendMessageIfAvailable();
});

function clearMessage() {
  lastData = null;
  return innerSendMessage({
    type: "CLEAR_NOTIFICATION"
  });
}

export async function sendMessage(request) {
  lastData = request;
  await innerSendMessage(request);
  setTimeout(() => {
    if (lastData === request) {
      activeListening.set(false);
    }
  }, NOTIFICATION_TIMEOUT);
}

export async function resendMessageIfAvailable() {
  if (lastData) {
    await innerSendMessage(lastData);
  } else {
    await clearMessage();
  }
}

async function innerSendMessage(request) {
  if (DEBUG) {
    console.log(`Sending request: ${JSON.stringify(request)}`);
  }
  chrome.runtime.sendMessage(request);
  try {
    const activeTab = await getActiveTab();
    // Cannot send message to chrome URLs.
    if (activeTab.url && !activeTab.url.startsWith("chrome")) {
      chrome.tabs.sendMessage(activeTab.id, request);
    }
  } catch (err) {
    console.log(`Ignoring tab notification. Error: ${err}`);
  }
}

export function sendPermissionRequest(
  permissions,
  originalMessage,
  requestPermissionMessage,
  callback
) {
  chrome.permissions.request(
    {
      permissions: permissions
    },
    granted => {
      if (granted) {
        callback();
      } else {
        sendMessage({
          type: "PERMISSION_REQUEST",
          title: "Permission needed",
          content: requestPermissionMessage,
          originalMessage,
          permissions
        });
      }
    }
  );
}
