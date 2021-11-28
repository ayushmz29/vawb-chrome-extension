import { executeScripts, getActiveTab } from '../core';

const ZOOM_LEVEL = [
  0.25,
  0.33,
  0.5,
  0.67,
  0.75,
  0.8,
  0.9,
  1,
  1.1,
  1.25,
  1.5,
  1.75,
  2,
  2.5,
  3,
  4,
  5
];

const commands = [
  {
    action: 'PAGE_ZOOM_IN',
    callback: async () => {
      const activeTab = await getActiveTab();
      chrome.tabs.getZoom(activeTab.id, zoomFactor => {
        for (let zoomLevel of ZOOM_LEVEL) {
          if (zoomFactor + 0.01 < zoomLevel) {
            chrome.tabs.setZoom(activeTab.id, zoomLevel);
            break;
          }
        }
      });
    }
  },

  {
    action: 'PAGE_ZOOM_OUT',
    callback: async () => {
      const activeTab = await getActiveTab();
      chrome.tabs.getZoom(activeTab.id, zoomFactor => {
        for (let i = ZOOM_LEVEL.length - 1; i >= 0; i--) {
          const zoomLevel = ZOOM_LEVEL[i];
          if (zoomFactor - 0.01 > zoomLevel) {
            chrome.tabs.setZoom(activeTab.id, zoomLevel);
            break;
          }
        }
      });
    }
  },
  {
    action: 'PAGE_ZOOM_RESET',
    callback: async () => {
      const activeTab = await getActiveTab();
      chrome.tabs.setZoom(activeTab.id, 1);
    }
  },

  {
    action: 'PAGE_FIND',
    callback: query => {
      executeScripts(`window.find('${query}');`);
    }
  },

  {
    action: 'PAGE_SCROLL_DOWN',
    callback: () => {
      executeScripts("window.scrollBy(0, 250);");
    }
  },

  {
    action: 'PAGE_PAGE_DOWN',
    callback: () => {
      executeScripts("window.scrollBy(0, 1000);");
    }
  },

  {
    action: 'PAGE_SCROLL_UP',
    callback: () => {
      executeScripts("window.scrollBy(0, -250);");
    }
  },

  {
    action: 'PAGE_PAGE_UP',
    callback: () => {
      executeScripts("window.scrollBy(0, -1000);");
    }
  },

  {
    action: 'PAGE_TO_TOP',
    callback: () => {
      executeScripts("window.scrollTo(0, 0);");
    }
  },

  {
    action: 'PAGE_TO_BOTTOM',
    callback: () => {
      executeScripts(
        "window.scrollTo(0, document.body.scrollHeight);"
      );
    }
  }
];

export default commands;
