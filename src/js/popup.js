navigator.webkitGetUserMedia(
  {
    audio: true
  },
  () => {
    chrome.runtime.sendMessage({ type: "TRIGGER" }, () => {
      window.close();
    });
  },
  () => {
    chrome.runtime.openOptionsPage();
  }
);
