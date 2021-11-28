<script>
  import "../css/options.scss";
  import {
    mdiMicrophone,
    mdiBellRing,
    mdiPencil,
    mdiKeyboard,
    mdiTextToSpeech,
    mdiEmail,
    mdiEarHearing,
    mdiViewList,
    mdiThumbUp
  } from "@mdi/js";
  import Card, { Content } from "@smui/card";
  import Textfield from "@smui/textfield";
  import Button, { Label } from "@smui/button";
  import { fly } from "svelte/transition";
  import MdiIcon from "./MdiIcon.svelte";
  import OptionCard from "./OptionCard.svelte";
  import { DEBUG, ICON_COLOR, storage } from "../js/common";

  let customHotword = "";

  let voiceOption = {
    icon: mdiMicrophone,
    title: "Microphone permission",
    caption: "Allow microphone access to enable voice commands.",
    showScreenshot: true,
    errorCaption:
      "Voice command will not work without microphone access. Please click on the icon " +
      "at the right hand side of the URL bar to grant access.",
    onClick: enabled => {
      storage.set({ hotword: true });
      location.reload();
    }
  };

  let hotword = {
    icon: mdiMicrophone,
    title: '"Hey" hotword detection',
    caption:
      'We will listen to "Hey" hotword command in the background. Click here to disable hotword detection.',
    errorCaption:
      "Hotword detection is disabled. Click here to enable hotword detection",
    onClick: enabled => {
      storage.set({ hotword: enabled });
    }
  };

  let tts = {
    icon: mdiTextToSpeech,
    title: "Voice response on search result",
    caption:
      "Auto play voice response on Google search result page if available. Note that to avoid the sound from the voice " +
      'response from feeding back into the microphone, "VAWB" will stop listening after performing a search result. ' +
      'You can trigger it again by saying the "hey" hotword or by clicking on the "VAWB" icon in browser extension area.',
    errorCaption:
      "Voice response is disabled. Click here to enable automatically reading the voice response on Google search result.",
    onClick: enabled => {
      storage.set({ tts: enabled });
    }
  };

  let autoOff = {
    icon: mdiEarHearing,
    title: "Stay listening",
    caption:
      'After a query is issued, stay listening for another 15 seconds without having to say "Hey" again. ' +
      'After 15 seconds of silence, the "VAWB" will stop listening. It can also be stopped by pressing the ' +
      '"X" button.',
    errorCaption:
      '"VAWB" will stop listening after each query. Trigger it by saying the hotword or by clicking on the icon.',
    onClick: enabled => {
      storage.set({ autoOff: !enabled });
    }
  };

  let shortcut = {
    icon: mdiKeyboard,
    title: "Keyboard shortcut",
    caption: "",
    errorCaption:
      "Go to chrome://extensions/shortcuts to set the keyboard shortcut.",
    enabled: false,
    onClick: enabled => {
      chrome.tabs.query(
        {
          active: true
        },
        tabs => {
          if (tabs.length > 0) {
            const activeTab = tabs[0];
            chrome.tabs.update(activeTab.id, {
              url: "chrome://extensions/shortcuts"
            });
          }
        }
      );
    }
  };

  chrome.commands.getAll(commands => {
    shortcut.caption = commands[0].shortcut || "";
    shortcut.enabled = !!shortcut.caption;
  });

  function markInitialized() {
    storage.set({ hotword: true, init: true }, () => {
      chrome.tabs.update({
        // url: "https://bewisse.com/heybuddy/thankyou/"
        url: "https://github.com/ayushmz29/vawb-chrome-extension"
      });
    });
  }

  storage.get(
    ["customHotword", "tts", "hotword", "autoOff", "init"],
    result => {
      customHotword = result.customHotword || "";
      tts.enabled = result.tts;
      hotword.enabled = result.hotword;
      autoOff.enabled = !result.autoOff;

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(stream => {
          voiceOption.enabled = true;
          if (!result.init) {
            markInitialized();
          }
        })
        .catch(error => {
          voiceOption.enabled = false;
          const intervalHandle = setInterval(async () => {
            try {
              const hasMicAccess = await navigator.mediaDevices.getUserMedia({
                audio: true
              });
              voiceOption.enabled = true;
              storage.set({ hotword: true });
              if (!result.init) {
                markInitialized();
              }
              clearInterval(intervalHandle);
            } catch (ignored) {}
          }, 1000);
        });
    }
  );

  $: storage.set({ customHotword });
</script>

<style>
  :global(.main-content) {
    margin: auto;
    padding: 5px;
    width: 800px;
    text-align: center;
  }

  :global(.hotword-input) {
    width: 400px;
  }

  :global(.reviews-button) {
    position: absolute;
    right: 5px;
    top: 5px;
  }

  :global(.logo-text) {
    font-size: 1.5em;
  }

  .logo {
    vertical-align: middle;
  }

  .transition-container {
    position: absolute;
    width: 800px;
  }
</style>

<div class="main-content">
  <h1 class="mdc-typography--headline6">
    <Button href="https://github.com/ayushmz29/vawb-chrome-extension">
      <img class="logo" src="/img/icon_128.png" height="32" alt="Logo" />
      &nbsp;
      <Label class="logo-text">VAWB - Chrome Voice Assistant</Label>
    </Button>
  </h1>
  <div>
    <Button href="https://github.com/ayushmz29/vawb-chrome-extension#vawb-chrome-assistant" target="_blank">
      <MdiIcon size="24" icon={mdiViewList} color={ICON_COLOR} />
      &nbsp;
      <Label color={ICON_COLOR}>All commands</Label>
    </Button>
    &nbsp;
    <Button
      href="https://github.com/ayushmz29/vawb-chrome-extension"
      target="_blank">
      <MdiIcon size="24" icon={mdiThumbUp} color={ICON_COLOR} />
      &nbsp;
      <Label color={ICON_COLOR}>Give a star !</Label>
    </Button>
    &nbsp;
    <Button href="https://gist.github.com/ayushmz29/a81b00623ad6e9308f50146f2cfada48#file-gistfile1-txt" target="_blank">
      <MdiIcon size="24" icon={mdiEmail} color={ICON_COLOR} />
      &nbsp;
      <Label color={ICON_COLOR}>Contact us!</Label>
    </Button>
  </div>

  <div class="transition-container" transition:fly={{ x: -200 }}>
    {#if !voiceOption.enabled}
      <Card class="card">
        <Content>
          <div class="mdc-typography--subtitle1">
            🎉 Thank you for installing VAWB 🎉
          </div>
          <div class="mdc-typography--subtitle2">
            We just need one more permission from you to access your microphone
          </div>
        </Content>
      </Card>
      <OptionCard option={voiceOption} />
    {:else}
      <OptionCard option={hotword} />
      <OptionCard option={tts} />
      <OptionCard option={autoOff} />
      <OptionCard option={shortcut} />
      <Card class="card">
        <Content>
          <div class="mdc-typography--subtitle1">Hotwords</div>
          <div class="mdc-typography--caption">
            Say one of these hotwords to trigger VAWB by voice.
          </div>
          <Textfield
            variant="filled"
            disabled
            class="hotword-input"
            value="Hey (default and cannot be changed)"
            input$readonly
            input$aria-readonly />
          <Textfield
            variant="outlined"
            class="hotword-input"
            input$placeholder="Set custom hotword"
            bind:value={customHotword}
            input$minlength="5" />
        </Content>
      </Card>
    {/if}
  </div>
</div>
