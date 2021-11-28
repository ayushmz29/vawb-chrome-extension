import { derived, get, writable } from 'svelte/store';
import { storage } from './common';

export const activeListening = writable(false);
export const hotwordEnabled = writable(false);
export const customHotword = writable(undefined);
export const speechRecognitionEnabled = derived(
  [activeListening, hotwordEnabled],
	([$activeListening, $hotwordEnabled]) => {
    return $activeListening || $hotwordEnabled;
  }
);

export function isActiveListening() {
  return get(activeListening);
}


export function isHotwordEnabled() {
  return get(hotwordEnabled);
}

export function getHotwords() {
  const customHotwordVal = get(customHotword);
  const hotwords = ['hey'];
  if (customHotwordVal) {
    hotwords.push(customHotwordVal);
  }
  return hotwords;
}

storage.get(["hotword"], result => {
  hotwordEnabled.set(result.hotword);
});
storage.get(["customHotword"], result => {
  customHotword.set(result.customHotword);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.hotword) {
    hotwordEnabled.set(changes.hotword.newValue);
  }
  if (changes.customHotword) {
    customHotword.set(changes.customHotword.newValue);
  }
});