import { sendPermissionRequest } from "../notification";
import { getActiveTab } from '../core';

const commands = [
  {
    action: 'BOOKMARK_ADD',
    callback: () => {
      const bookmarkHandler = async () => {
        const activeTab = await getActiveTab();
        chrome.bookmarks.create({
          title: activeTab.title,
          url: activeTab.url
        });
      };
      if (!chrome.bookmarks) {
        sendPermissionRequest(
          ["bookmarks"],
          "bookmark",
          "Hey Buddy needs permission to manage your bookmarks.",
          bookmarkHandler
        );
      } else {
        bookmarkHandler();
      }
    }
  },
  {
    action: "BOOKMARK_REMOVE",
    callback: () => {
      const unbookmarkHandler = async () => {
        const activeTab = await getActiveTab();
        chrome.bookmarks.search(
          {
            url: activeTab.url
          },
          results => {
            if (results.length > 0) {
              chrome.bookmarks.remove(results[0].id);
            }
          }
        );
      };
      if (!chrome.bookmarks) {
        sendPermissionRequest(
          ["bookmarks"],
          "remove bookmark",
          "Hey Buddy needs permission to manage your bookmarks.",
          unbookmarkHandler
        );
      } else {
        unbookmarkHandler();
      }
    }
  }
];

export default commands;
