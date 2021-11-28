import { performActionWithDelay } from '../core';

const commands = [
  {
    /** ------- Tab management commands ------- */
    action: 'TABS_NEW_TAB',
    callback: () => {
      performActionWithDelay(() => {
        chrome.tabs.create({});
      });
    }
  },
  {
    action: 'TABS_CLOSE_TAB',
    callback: () => {
      performActionWithDelay(() => {
        chrome.tabs.query(
          {
            active: true
          },
          tabs => {
            if (tabs.length > 0) {
              chrome.tabs.remove(tabs[0].id);
            }
          }
        );
      });
    },
    priority: 1
  },
  {
    action: 'TABS_CLOSE_OTHER_TABS',
    callback: () => {
      chrome.tabs.query(
        {
          active: false
        },
        tabs => {
          for (let tab of tabs) {
            chrome.tabs.remove(tab.id);
          }
        }
      );
    }
  },

  {
    action: 'TABS_CLOSE_RIGHT_TABS',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        let activeTabIndex = -1;
        for (let tab of tabs) {
          if (tab.active) {
            activeTabIndex = tab.index;
          }
        }
        for (let tab of tabs) {
          if (tab.index > activeTabIndex) {
            chrome.tabs.remove(tab.id);
          }
        }
      });
    }
  },

  {
    action: 'TABS_CLOSE_LEFT_TABS',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        let activeTabIndex = -1;
        for (let tab of tabs) {
          if (tab.active) {
            activeTabIndex = tab.index;
          }
        }
        for (let tab of tabs) {
          if (tab.index < activeTabIndex) {
            chrome.tabs.remove(tab.id);
          }
        }
      });
    }
  },
  {
    action: 'TABS_CLOSE_ALL_TABS',
    callback: () => {
      performActionWithDelay(() => {
        chrome.windows.getCurrent({}, window => {
          chrome.windows.remove(window.id);
        });
      });
    }
  },

  {
    action: 'TABS_PIN_TAB',
    callback: () => {
      chrome.tabs.query(
        {
          active: true
        },
        tabs => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { pinned: true });
          }
        }
      );
    }
  },

  {
    action: 'TABS_UNPIN_TAB',
    callback: () => {
      chrome.tabs.query(
        {
          active: true
        },
        tabs => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { pinned: false });
          }
        }
      );
    }
  },

  {
    action: 'TABS_MUTE_TAB',
    callback: () => {
      chrome.tabs.query(
        {
          active: true
        },
        tabs => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { muted: true });
          }
        }
      );
    }
  },

  {
    action: 'TABS_UNMUTE_TAB',
    callback: () => {
      chrome.tabs.query(
        {
          active: true
        },
        tabs => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { muted: false });
          }
        }
      );
    }
  },

  {
    action: 'TABS_MUTE_ALL_TABS',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        for (let tab of tabs) {
          chrome.tabs.update(tab.id, { muted: true });
        }
      });
    }
  },

  {
    action: 'TABS_UNMUTE_ALL_TABS',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        for (let tab of tabs) {
          chrome.tabs.update(tab.id, { muted: false });
        }
      });
    }
  },

  {
    action: 'TABS_MUTE_OTHER_TABS',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        for (let tab of tabs) {
          if (!tab.active) {
            chrome.tabs.update(tab.id, { muted: true });
          }
        }
      });
    }
  },

  {

    action: 'TABS_UNMUTE_OTHER_TABS',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        for (let tab of tabs) {
          if (!tab.active) {
            chrome.tabs.update(tab.id, { muted: false });
          }
        }
      });
    }
  },

  {

    action: 'TABS_MAXIMIZE_WINDOW',
    callback: () => {
      chrome.windows.getCurrent({}, window => {
        chrome.windows.update(window.id, { state: "maximized" });
      });
    }
  },

  {
    action: 'TABS_MINIMIZE_WINDOW',
    callback: () => {
      chrome.windows.getCurrent({}, window => {
        chrome.windows.update(window.id, { state: "minimized" });
      });
    }
  },
  {

    action: 'TABS_SIDE_BY_SIDE',
    callback: () => {
      chrome.tabs.query({}, (tabs => {
        if (tabs.length >= 2) {
          tabs.sort((a, b) => {
            if (a.currentWindow && a.active) {
              return -1;
            }
            if (b.currentWindow && b.active) {
              return 1;
            }
            return b.index - a.index
          });
          const screen = window.screen;
          const tabA = tabs[0];
          const tabB = tabs[1];
          if (tabA.windowId === tabB.windowId) {
            chrome.windows.create({
              tabId: tabB.id,
              left: Math.ceil(screen.availWidth / 2),
              top: 0,
              width: screen.availWidth / 2,
              height: screen.availHeight
            })
          } else {
            chrome.windows.update(tabB.windowId, {
              left: Math.ceil(screen.availWidth / 2),
              top: 0,
              width: screen.availWidth / 2,
              height: screen.availHeight
            });
          }
          
          chrome.windows.update(tabA.windowId, {
            left: 0,
            top: 0,
            width: Math.ceil(screen.availWidth / 2),
            height: screen.availHeight,
            focused: true
          });
        }
      }))
    }
  },
  {

    action: 'TABS_ENTER_FULLSCREEN',
    callback: () => {
      chrome.windows.getCurrent({}, window => {
        chrome.windows.update(window.id, { state: "fullscreen" });
      });
    }
  },

  {

    action: 'TABS_EXIT_FULLSCREEN',
    callback: () => {
      chrome.windows.getCurrent({}, window => {
        chrome.windows.update(window.id, { state: "normal" });
      });
    }
  },

  {

    action: 'TABS_NEXT_TAB',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        let activeTabIndex = -1;
        for (const tab of tabs) {
          if (tab.active) {
            activeTabIndex = tab.index;
          }
        }
        const nextTabIndex = activeTabIndex + 1 < tabs.length ? activeTabIndex + 1 : 0;
        chrome.tabs.update(tabs[nextTabIndex].id, { active: true });
      });
    }
  },
  {

    action: 'TABS_PREVIOUS_TAB',
    callback: () => {
      chrome.tabs.query({}, tabs => {
        let activeTabIndex = -1;
        for (const tab of tabs) {
          if (tab.active) {
            activeTabIndex = tab.index;
          }
        }
        const nextTabIndex = activeTabIndex - 1 > 0 ? activeTabIndex - 1 : tabs.length - 1;
        chrome.tabs.update(tabs[nextTabIndex].id, { active: true });
      });
    }
  }
];

export default commands;
