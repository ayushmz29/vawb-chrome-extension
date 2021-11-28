import { executeScripts } from '../core';

function forAllVideos(perVideoCommand) {
  return (
    `const videos = document.getElementsByTagName('video');
    for (let video of videos) {
      ${perVideoCommand}
    }`
  );
}

function forAllAudios(perAudioCommand) {
  return (
    `const audios = document.getElementsByTagName('audio');
    for (let audio of audios) {
      ${perAudioCommand}
    }`
  );
}

const commands = [
  {
    action: 'MEDIA_PAUSE',
    callback: () => {
      executeScripts(
        forAllVideos("video.pause();") + forAllAudios("audio.pause();")
      );
    }
  },

  {
    action: 'MEDIA_PLAY',
    callback: () => {
      executeScripts(
        forAllVideos("video.play();") + forAllAudios("audio.play();")
      );
    }
  },

  {
    action: 'MEDIA_VOLUME_UP',
    callback: () => {
      executeScripts(
        forAllVideos("video.volume = Math.min(1, video.volume + .2);") +
        forAllAudios("audio.volume = Math.min(1, audio.volume + .2);")
      );
    }
  },

  {
    action: 'MEDIA_VOLUME_DOWN',
    callback: () => {
      executeScripts(
        forAllVideos("video.volume = Math.max(0, video.volume - .2);") +
        forAllAudios("audio.volume = Math.max(0, audio.volume - .2);")
      );
    }
  },

  {
    action: 'MEDIA_VOLUME_LOUD',
    callback: () => {
      executeScripts(
        forAllVideos("video.volume = .8;") +
        forAllAudios("audio.volume = .8;")
      );
    }
  },

  {
    action: 'MEDIA_VOLUME_VERY_LOUD',
    callback: () => {
      executeScripts(
        forAllVideos("video.volume = 1;") +
        forAllAudios("audio.volume = 1;")
      );
    }
  },

  {
    action: 'MEDIA_VOLUME_QUIET',
    callback: () => {
      executeScripts(
        forAllVideos("video.volume = .2;") +
        forAllAudios("audio.volume = .2;")
      );
    }
  },

  {
    action: 'MEDIA_FORWARD_SECONDS',
    callback: query => {
      let seconds = parseFloat(query);
      if (!(seconds > 0)) {
        seconds = 10;
      }
      executeScripts(
        forAllVideos("video.currentTime += " + seconds + ";") +
        forAllAudios("audio.currentTime += " + seconds + ";")
      );
    }
  },

  {
    action: 'MEDIA_BACKWARD_SECONDS',
    callback: query => {
      let seconds = parseFloat(query);
      if (!(seconds > 0)) {
        seconds = 10;
      }
      executeScripts(
        forAllVideos("video.currentTime -= " + seconds + ";") +
        forAllAudios("audio.currentTime -= " + seconds + ";")
      );
    }
  },

  {
    action: 'MEDIA_FORWARD_MINUTES',
    callback: query => {
      let minutes = parseFloat(query);
      if (!(minutes > 0)) {
        minutes = 1;
      }
      let seconds = minutes * 60;
      executeScripts(
        forAllVideos("video.currentTime += " + seconds + ";") +
        forAllAudios("audio.currentTime += " + seconds + ";")
      );
    }
  },

  {
    action: 'MEDIA_BACKWARD_MINUTES',
    callback: query => {
      let minutes = parseFloat(query);
      if (!(minutes > 0)) {
        minutes = 1;
      }
      let seconds = minutes * 60;
      executeScripts(
        forAllVideos("video.currentTime -= " + seconds + ";") +
        forAllAudios("audio.currentTime -= " + seconds + ";")
      );
    }
  },

  {
    action: 'MEDIA_FORWARD_1_MINUTE',
    callback: () => {
      let seconds = 60;
      executeScripts(
        forAllVideos("video.currentTime += " + seconds + ";") +
        forAllAudios("audio.currentTime += " + seconds + ";")
      );
    }
  },

  {
    action: 'MEDIA_BACKWARD_1_MINUTE',
    callback: () => {
      let seconds = 60;
      executeScripts(
        forAllVideos("video.currentTime -= " + seconds + ";") +
        forAllAudios("audio.currentTime -= " + seconds + ";")
      );
    }
  },

  {
    action: 'MEDIA_TO_BEGINNING',
    callback: () => {
      executeScripts(
        forAllVideos("video.currentTime = 0;") +
        forAllAudios("audio.currentTime = 0;")
      );
    }
  },

  {
    action: 'MEDIA_TO_END',
    callback: () => {
      executeScripts(
        forAllVideos("video.currentTime = video.duration;") +
        forAllAudios("audio.currentTime = audio.duration;")
      );
    }
  }
];

export default commands;
