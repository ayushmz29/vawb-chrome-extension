<script>
  import { scale } from "svelte/transition";
  import { elasticOut } from "svelte/easing";
  import Card, { Content } from "@smui/card";
  import {
    mdiNumeric1CircleOutline,
    mdiCloseCircleOutline,
    mdiCogOutline,
    mdiRepeat,
    mdiShieldCheck,
    mdiTabRemove,
    mdiThumbUpOutline,
    mdiHelpCircleOutline
  } from "@mdi/js";

  const PREDEFINED_COMMANDS = new Set(["close tab", "best result"]);

  let disableVoiceDictation = true;
  let currentRequest;
  let previousRequest;
  let showGrantPermissionButton = true;
  let version = chrome.runtime.getManifest().version;
  let supportBestResult = false;

  chrome.tabs.getCurrent(tab => {
    if (tab.url) {
      supportBestResult =
        tab.url.startsWith("https://www.google.com/search") ||
        tab.url.startsWith("https://www.youtube.com/");
    } else {
      supportBestResult = false;
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
      case "START_LISTENING":
      case "PENDING_RESULT":
      case "RESULT":
        if (request.type === "RESULT") {
          previousRequest = currentRequest;
        }
        showGrantPermissionButton = false;
        currentRequest = request;
        break;
      case "PERMISSION_REQUEST":
        showGrantPermissionButton = true;
        currentRequest = request;
        break;
      case "CLEAR_NOTIFICATION":
        currentRequest = null;
        break;
      case "CHECK_NOTIFICATION":
        sendResponse({ hasNotification: currentRequest !== null });
        break;
    }
  });

  function close() {
    currentRequest = null;
    chrome.runtime.sendMessage({ type: "CLEAR_NOTIFICATION" });
  }

  function closeTab() {
    chrome.runtime.sendMessage({ type: "QUERY", query: "close tab" });
  }

  function navigateBestResult() {
    chrome.runtime.sendMessage({ type: "QUERY", query: "best result" });
  }

  function repeatPreviousRequest() {
    if (previousRequest) {
      chrome.runtime.sendMessage({
        type: "QUERY",
        query: previousRequest.content
      });
    }
  }

  function seeAllCommands() {
    chrome.runtime.sendMessage({
      type: "OPEN_URL",
      url: "https://bewisse.com/heybuddy/commands/"
    });
  }

  function viewOptions() {
    chrome.runtime.sendMessage({
      type: "OPEN_URL",
      url: chrome.runtime.getURL("/options.html")
    });
  }

  function sendFeedback() {
    chrome.runtime.sendMessage({
      type: "OPEN_URL",
      url:
        "https://chrome.google.com/webstore/detail/chrome-voice-assistant/aollofiafbblhopkofbfmlmbhbdcblem"
    });
  }

  function reviewPermission() {
    chrome.permissions.request(
      {
        permissions: currentRequest.permissions
      },
      granted => {
        if (granted) {
          chrome.runtime.sendMessage({
            type: "QUERY",
            query: currentRequest.originalMessage
          });
        }
      }
    );
  }

  chrome.runtime.sendMessage({
    type: "TAB_LOADED"
  });
</script>

<style scoped>
  .chrome-voice-assistant {
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.16),
      0 2px 10px 0 rgba(0, 0, 0, 0.12);
    background: rgba(225, 225, 225, 0.95);
    position: fixed;
    border-radius: 6px;
    width: 300px;
    height: 240px;
    z-index: 1000000;
    padding: 10px;
  }

  .chrome-voice-assistant-title,
  .chrome-voice-assistant-content,
  .chrome-voice-assistant-button,
  .chrome-voice-assistant-logo {
    font-family: Verdana, Geneva, sans-serif;
    font-weight: normal;
    color: black;
    line-height: 1em;
    letter-spacing: normal;
    top: 5px;
  }

  .chrome-voice-assistant-title {
    font-size: 20px;
    margin-bottom: 10px;
  }

  .chrome-voice-assistant-content {
    font-size: 14px;
  }

  .chrome-voice-assistant-logo {
    height: 28px;
    vertical-align: middle;
  }

  .chrome-voice-assistant-icon {
    height: 20px;
    width: 20px;
    vertical-align: middle;
  }

  .chrome-voice-assistant-options-icons {
    cursor: pointer;
    position: absolute;
    top: 4px;
    right: 4px;
  }

  .chrome-voice-assistant-button {
    cursor: pointer;
    background: white;
    display: block;
    border: 1px solid #aaa;
    margin-top: 5px;
    padding: 5px;
  }

  .chrome-voice-assistant-action-panel {
    position: absolute;
    bottom: 20px;
    width: 300px;
  }

  .chrome-voice-assistant-version {
    position: absolute;
    bottom: 4px;
    right: 4px;
  }
</style>

{#if currentRequest && currentRequest.title && currentRequest.content}
  <div
    class="chrome-voice-assistant"
    in:scale={{ easing: elasticOut, duration: 500 }}
    out:scale={{ duration: 200 }}>
    <div class="chrome-voice-assistant-options-icons">
      <svg width="24" height="24" viewBox="0 0 24 24" on:click={sendFeedback}>
        <path fill="#666" d={mdiThumbUpOutline} />
      </svg>
      <svg
        width="24"
        height="24"
        xmlns="http://www.w3.org/2000/svg"
        on:click={seeAllCommands}
        viewBox="0 0 24 24">
        <path fill="#666" d={mdiHelpCircleOutline} />
      </svg>
      <svg width="24" height="24" on:click={viewOptions} viewBox="0 0 24 24">
        <path fill="#666" d={mdiCogOutline} />
      </svg>
      <svg width="24" height="24" on:click={close} viewBox="0 0 24 24">
        <path fill="#666" d={mdiCloseCircleOutline} />
      </svg>
    </div>
    <h1 class="chrome-voice-assistant-title">
      <img
        class="chrome-voice-assistant-logo"
        src="img/icon_128.png"
        alt="Logo" />
      {currentRequest.title}
    </h1>
    <p class="chrome-voice-assistant-content">{currentRequest.content}</p>
    <div class="chrome-voice-assistant-action-panel">
      {#if showGrantPermissionButton}
        <div class="chrome-voice-assistant-button" on:click={reviewPermission}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="chrome-voice-assistant-icon"
            viewBox="0 0 24 24">
            <path d={mdiShieldCheck} />
          </svg>
          Review permission
        </div>
      {/if}
      {#if supportBestResult}
        <div
          class="chrome-voice-assistant-button"
          on:click={navigateBestResult}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="chrome-voice-assistant-icon"
            viewBox="0 0 24 24">
            <path d={mdiNumeric1CircleOutline} />
          </svg>
          Best result
        </div>
      {/if}
      {#if previousRequest && !PREDEFINED_COMMANDS.has(previousRequest.content)}
        <div
          class="chrome-voice-assistant-button"
          on:click={repeatPreviousRequest}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="chrome-voice-assistant-icon"
            viewBox="0 0 24 24">
            <path d={mdiRepeat} />
          </svg>
          {previousRequest.content}
        </div>
      {/if}
      <div class="chrome-voice-assistant-button" on:click={closeTab}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="chrome-voice-assistant-icon"
          viewBox="0 0 24 24">
          <path d={mdiTabRemove} />
        </svg>
        Close tab
      </div>
    </div>
    <div class="chrome-voice-assistant-version">v{version}</div>
  </div>
{/if}
