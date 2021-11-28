<script>
  const url = chrome.runtime.getURL("/notification_ui.html");
  let showIframe = false;

  chrome.runtime.onMessage.addListener(request => {
    switch (request.type) {
      case "START_LISTENING":
      case "PENDING_RESULT":
      case "RESULT":
        showIframe = true;
        break;
      case "CLEAR_NOTIFICATION":
        setTimeout(() => {
          showIframe = false;
        }, 500);
        break;
    }
  });
</script>

<style>
  .chrome-voice-assistant {
    border: none;
    position: fixed;
    width: 330px;
    height: 270px;
    bottom: 10px;
    right: 10px;
    z-index: 1000000;
  }

  .chrome-voice-assistant-hidden {
    display: none;
  }
</style>

<iframe
  class="chrome-voice-assistant {showIframe ? '' : 'chrome-voice-assistant-hidden'}"
  seamless
  src={url}
  title="VAWB - Chrome Voice Assistant" />
