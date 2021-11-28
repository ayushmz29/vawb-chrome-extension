<script>
  import Card, { Content, PrimaryAction, Media } from "@smui/card";
  import { mdiCheckCircle, mdiAlert } from "@mdi/js";
  import { ICON_COLOR } from "../js/common";
  import MdiIcon from "./MdiIcon.svelte";

  export let option;

  function onClick() {
    if (option.disableClick) {
      return;
    }
    option.enabled = !option.enabled;
    option.onClick(option.enabled);
  }
</script>

<style>
  :global(.card) {
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.16),
      0 2px 10px 0 rgba(0, 0, 0, 0.12);
    margin: 5px;
    padding-top: 5px;
    text-align: center;
  }

  :global(.clickable) {
    cursor: pointer;
  }

  :global(.status-icon) {
    position: absolute;
    right: 5px;
    top: 5px;
  }

  .warning {
    color: #db4437;
  }

  .screenshot {
    width: 100%;
  }
</style>

<Card class="card">
  <PrimaryAction
    on:click={onClick}
    class={!option.disableClick ? 'clickable' : ''}>
    <Media>
      <MdiIcon size="48" icon={option.icon} color={ICON_COLOR} />
      {#if option.enabled}
        <MdiIcon
          size="24"
          icon={mdiCheckCircle}
          color="#0f9d58"
          class="status-icon" />
      {:else}
        <MdiIcon
          size="24"
          icon={mdiAlert}
          color="#db4437"
          class="status-icon" />
      {/if}
    </Media>
    <Content>
      <div class="mdc-typography--subtitle1">{option.title}</div>
      {#if option.enabled}
        <div class="mdc-typography--caption">{option.caption}</div>
      {:else}
        <div class="mdc-typography--caption warning">{option.errorCaption}</div>
      {/if}
      {#if option.showScreenshot}
        <img
          src="/img/microphone_guide.png"
          class="screenshot"
          alt="Enable microphone visual guide" />
      {/if}
    </Content>
  </PrimaryAction>
</Card>
