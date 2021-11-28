import { annyang } from "./annyang";
import { DEBUG } from "./common";
import { sendMessage, resendMessageIfAvailable } from "./notification";
import { activeListening, isActiveListening } from './store';
import { getActiveTab, performActionWithDelay } from './core';
import enData from './langs/en.json';

const DEFAULT_COMMAND_PRIORITY = 0.5;
const addedCommands = new Set();

/** ------- Initialization ------- */
export function initCommander(allPlugins) {
  initRegularCommands(allPlugins);

  chrome.runtime.onMessage.addListener(async (request) => {
    if (DEBUG) {
      console.log(`Received message: ${JSON.stringify(request)}`);
    }
    switch (request.type) {
      case "TRIGGER":
        trigger();
        break;
      case "OPEN_URL":
        chrome.tabs.create({
          url: request.url
        });
        break;
      case "QUERY":
        annyang.trigger(request.query);
        break;
      case "CLEAR_NOTIFICATION":
        activeListening.set(false);
        break;
      case "TAB_LOADED":
        resendMessageIfAvailable();
        break;
    }
  });

  annyang.addCallback("resultMatch", async userSaid => {
    sendResultMessage(userSaid);
    autoCloseIfNeeded();
  });

  annyang.addCallback("result", results => {
    const result = results[0];
    if (result && isActiveListening()) {
      sendMessage({
        type: "PENDING_RESULT",
        title: "Listening",
        content: result
      });
    }
  });
  annyang.addCallback("hotwordTrigger", () => {
    trigger();
  });
}

function sendResultMessage(userSaid) {
  if (isActiveListening()) {
    sendMessage({
      type: "RESULT",
      title: "Received command",
      content: userSaid
    });
  }
}

/** ------- Helper functions to perform actions ------- */
async function trigger() {
  const activeTab = await getActiveTab();
  if (!activeTab.url || activeTab.url.startsWith("chrome")) {
    // We can't use content script on chrome URLs, so need to create a new tab.
    chrome.tabs.create({ url: "https://www.google.com" }, () => {
      activeListening.set(true);
    });
  } else {
    activeListening.set(true);
  }
}

function addCommands(
  commandList,
  commandFunction,
  { priority = DEFAULT_COMMAND_PRIORITY } = {}
) {
  for (const cmd of commandList) {
    const command = cmd.toLowerCase();
    if (DEBUG) {
      if (command.trim() !== command) {
        console.error(`${command} is not trimmed`);
      }
      if (addedCommands.has(command)) {
        console.error(`${command} has already been added`);
      }
      addedCommands.add(command);
    }
    annyang.addCommands({ [command]: commandFunction }, priority)
  }
}

/** ------- Handle regular commands ------- */
function initRegularCommands(allPlugins) {
  const actionToCommand = {};
  for (const command of allPlugins) {
    if (DEBUG) {
      const keys = Object.keys(command);
      if (!keys.includes("action") || keys.includes('commands') || !keys.includes("callback")) {
        console.error(`Invalid command in plugin: `, command);
      }
    }
    actionToCommand[command.action] = command;
  }
  for (const [action, commands] of Object.entries(enData)) {
    addCommands(commands, actionToCommand[action].callback, {
      priority: actionToCommand[action].priority || DEFAULT_COMMAND_PRIORITY
    });
  }
}

function autoCloseIfNeeded() {
  performActionWithDelay(() => {
    chrome.storage.local.get(["autoOff"], result => {
      if (result.autoOff) {
        activeListening.set(false);
      }
    });
  })
}
