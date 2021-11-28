// Adapted from annyang.
//! annyang
//! version : 2.6.1
//! author  : Tal Ater @TalAter
//! license : MIT
//! https://www.TalAter.com/annyang/

import { DEBUG } from './common';
import { getHotwords, isActiveListening, speechRecognitionEnabled } from './store';

// Get the SpeechRecognition object, while handling browser prefixes
const SpeechRecognition =
  window.SpeechRecognition ||
  webkitSpeechRecognition ||
  mozSpeechRecognition ||
  msSpeechRecognition ||
  oSpeechRecognition;
const SpeechGrammarList =
  window.SpeechGrammarList ||
  webkitSpeechGrammarList ||
  mozSpeechGrammarList ||
  msSpeechGrammarList ||
  oSpeechGrammarList;

let commandsList = [];
let recognition;
let callbacks = {
  start: [],
  error: [],
  end: [],
  soundstart: [],
  result: [],
  resultMatch: [],
  resultNoMatch: [],
  hotwordTrigger: [],
  errorNetwork: [],
  errorPermissionBlocked: [],
  errorPermissionDenied: []
};
let autoRestart;
let lastStartedAt = 0;
let autoRestartCount = 0;
let debugState = DEBUG;
let debugStyle = "font-weight: bold; color: #00f;";
let pauseListening = false;
let isListening = false;
const allGrammars = [
  '#JSGF V1.0; grammar pages; public <page> = zoom in | zoom out | page up | page down | scroll up | scroll down',
  '#JSGF V1.0; grammar tabs; public <tab> = close tab | close other tabs | close all tabs;',
  '#JSGF V1.0; grammar triggers; public <trigger> = hey;'
];

// The command matching code is a modified version of Backbone.Router by Jeremy Ashkenas, under the MIT license.
let optionalParam = /\s*\((.*?)\)\s*/g;
let optionalRegex = /(\(\?:[^)]+\))\?/g;
let namedParam = /(\(\?)?:\w+/g;
let splatParam = /\*\w+/g;
let escapeRegExp = /[\-{}\[\]+?.,\\\^$|#]/g;
let commandToRegExp = function(command) {
  command = command
    .replace(escapeRegExp, "\\$&")
    .replace(optionalParam, "(?:$1)?")
    .replace(namedParam, function(match, optional) {
      return optional ? match : "([^\\s]+)";
    })
    .replace(splatParam, "(.*?)")
    .replace(optionalRegex, "\\s*$1?\\s*");
  return new RegExp("^" + command + "$", "i");
};

// This method receives an array of callbacks to iterate over, and invokes each of them
let invokeCallbacks = function(callbacks, ...args) {
  callbacks.forEach(function(callback) {
    callback.callback.apply(callback.context, args);
  });
};

let isInitialized = function() {
  return recognition !== undefined;
};

// method for logging in developer console when debug mode is on
let logMessage = function(text, extraParameters) {
  if (text.indexOf("%c") === -1 && !extraParameters) {
    console.log(text);
  } else {
    console.log(text, extraParameters || debugStyle);
  }
};

let initIfNeeded = function() {
  if (!isInitialized()) {
    annyang.init({}, false);
  }
};

let registerCommand = function(command, callback, originalPhrase, priority) {
  commandsList.push({ command, callback, originalPhrase, priority });
};

let parseResults = function(results, isFinal) {
  
  let hotwordTriggered = false;
  results = results.map(result => result.trim().toLowerCase());
  const hotwords = getHotwords();
  for (const i in results) {
    const result = results[i];
    // the text recognized
    if (debugState) {
      logMessage("Speech recognized: %c" + result, debugStyle);
    }
    for (const hotword of hotwords) {
      if (result === hotword) {
        invokeCallbacks(callbacks.hotwordTrigger);
        return;
      }
      if (result.startsWith(`${hotword} `)) {
        if (!hotwordTriggered) {
          hotwordTriggered = true;
          invokeCallbacks(callbacks.hotwordTrigger);
        }
        results[i] = result.slice(`${hotword} `.length);
      }
    }
  }
  if (!hotwordTriggered && !isActiveListening()) {
    return;
  }
  if (!isFinal) {
    invokeCallbacks(callbacks.result, results);
    return;
  }
  let bestMatchCommand = null;
  let bestCommandText;
  let bestCommandParameters;
  // go over each of the 5 results and alternative results received (we've set maxAlternatives to 5 above)
  for (const commandText of results) {
    // try and match recognized text to one of the commands on the list
    for (const currentCommand of commandsList) {
      let result = currentCommand.command.exec(commandText);
      if (result) {
        let parameters = result.slice(1);
        if (debugState) {
          logMessage(
            "command matched: %c" + currentCommand.originalPhrase,
            debugStyle
          );
          if (parameters.length) {
            logMessage("with parameters", parameters);
          }
        }
        if (!bestMatchCommand || currentCommand.priority > bestMatchCommand.priority) {
          bestMatchCommand = currentCommand;
          bestCommandText = commandText;
          bestCommandParameters = parameters;
        }
      }
    }
  }
  if (bestMatchCommand) {
    if (DEBUG) {
      console.log(`ResultMatch: ${bestCommandText}`);
    }
    invokeCallbacks(
      callbacks.resultMatch,
      bestCommandText,
      bestMatchCommand.originalPhrase,
      results
    );
    // execute the matched command
    bestMatchCommand.callback.apply(this, bestCommandParameters);
    return;
  }
  invokeCallbacks(callbacks.result, results);
  invokeCallbacks(callbacks.resultNoMatch, results);
};

export const annyang = {
  /**
   * Initialize annyang with a list of commands to recognize.
   *
   * #### Examples:
   * ````javascript
   * let commands = {'hello :name': helloFunction};
   * let commands2 = {'hi': helloFunction};
   *
   * // initialize annyang, overwriting any previously added commands
   * annyang.init(commands, true);
   * // adds an additional command without removing the previous commands
   * annyang.init(commands2, false);
   * ````
   * As of v1.1.0 it is no longer required to call init(). Just start() listening whenever you want, and addCommands() whenever, and as often as you like.
   *
   * @param {Object} commands - Commands that annyang should listen to
   * @param {boolean} [resetCommands=true] - Remove all commands before initializing?
   * @method init
   * @deprecated
   * @see [Commands Object](#commands-object)
   */
  init: function(commands, resetCommands = true) {
    // Abort previous instances of recognition already running
    if (recognition && recognition.abort) {
      recognition.abort();
    }

    // initiate SpeechRecognition
    recognition = new SpeechRecognition();

    const speechRecognitionList = new SpeechGrammarList();
    for (const grammar of allGrammars) {
      speechRecognitionList.addFromString(grammar, 1);
    }
    recognition.grammars = speechRecognitionList;

    // Set the max number of alternative transcripts to try and match with a command
    recognition.maxAlternatives = 5;

    // In HTTPS, turn off continuous mode for faster results.
    // In HTTP,  turn on  continuous mode for much slower results, but no repeating security notices
    recognition.continuous = true;

    recognition.interimResults = true;

    // Sets the language to the default 'en-US'. This can be changed with annyang.setLanguage()
    recognition.lang = "en-US";

    recognition.onstart = function() {
      isListening = true;
      invokeCallbacks(callbacks.start);
    };

    recognition.onsoundstart = function() {
      invokeCallbacks(callbacks.soundstart);
    };

    recognition.onerror = function(event) {
      invokeCallbacks(callbacks.error, event);
      switch (event.error) {
        case "network":
          invokeCallbacks(callbacks.errorNetwork, event);
          break;
        case "not-allowed":
        case "service-not-allowed":
          // if permission to use the mic is denied, turn off auto-restart
          autoRestart = false;
          // determine if permission was denied by user or automatically.
          if (new Date().getTime() - lastStartedAt < 200) {
            invokeCallbacks(callbacks.errorPermissionBlocked, event);
          } else {
            invokeCallbacks(callbacks.errorPermissionDenied, event);
          }
          break;
      }
    };

    recognition.onend = function() {
      isListening = false;
      invokeCallbacks(callbacks.end);
      // annyang will auto restart if it is closed automatically and not by user action.
      if (autoRestart) {
        // play nicely with the browser, and never restart annyang automatically more than once per second
        let timeSinceLastStart = new Date().getTime() - lastStartedAt;
        autoRestartCount += 1;
        if (autoRestartCount % 10 === 0) {
          if (debugState) {
            logMessage(
              "Speech Recognition is repeatedly stopping and starting. See http://is.gd/annyang_restarts for tips."
            );
          }
        }
        if (timeSinceLastStart < 1000) {
          setTimeout(function() {
            annyang.start({ paused: pauseListening });
          }, 1000 - timeSinceLastStart);
        } else {
          annyang.start({ paused: pauseListening });
        }
      }
    };

    recognition.onresult = function(event) {
      if (pauseListening) {
        if (debugState) {
          logMessage("Speech heard, but annyang is paused");
        }
        return false;
      }

      // Map the results to an array
      const SpeechRecognitionResult = event.results[event.resultIndex];
      const results = [];
      for (let k = 0; k < SpeechRecognitionResult.length; k++) {
        results[k] = SpeechRecognitionResult[k].transcript;
      }

      parseResults(results, SpeechRecognitionResult.isFinal);
    };

    // build commands list
    if (resetCommands) {
      commandsList = [];
    }
    if (commands.length) {
      this.addCommands(commands);
    }
  },

  /**
   * Start listening.
   * It's a good idea to call this after adding some commands first, but not mandatory.
   *
   * Receives an optional options object which supports the following options:
   *
   * - `autoRestart`  (boolean, default: true) Should annyang restart itself if it is closed indirectly, because of silence or window conflicts?
   * - `continuous`   (boolean) Allow forcing continuous mode on or off. Annyang is pretty smart about this, so only set this if you know what you're doing.
   * - `paused`       (boolean, default: true) Start annyang in paused mode.
   *
   * #### Examples:
   * ````javascript
   * // Start listening, don't restart automatically
   * annyang.start({ autoRestart: false });
   * // Start listening, don't restart automatically, stop recognition after first phrase recognized
   * annyang.start({ autoRestart: false, continuous: false });
   * ````
   * @param {Object} [options] - Optional options.
   * @method start
   */
  start: function(options) {
    initIfNeeded();
    options = options || {};
    if (options.paused !== undefined) {
      pauseListening = !!options.paused;
    } else {
      pauseListening = false;
    }
    if (options.autoRestart !== undefined) {
      autoRestart = !!options.autoRestart;
    } else {
      autoRestart = true;
    }
    if (options.continuous !== undefined) {
      recognition.continuous = !!options.continuous;
    }

    lastStartedAt = new Date().getTime();
    try {
      recognition.start();
    } catch (e) {
      if (debugState) {
        logMessage(e.message);
      }
    }
  },

  /**
   * Stop listening, and turn off mic.
   *
   * Alternatively, to only temporarily pause annyang responding to commands without stopping the SpeechRecognition engine or closing the mic, use pause() instead.
   * @see [pause()](#pause)
   *
   * @method abort
   */
  abort: function() {
    autoRestart = false;
    autoRestartCount = 0;
    if (isInitialized()) {
      recognition.stop();
    }
  },

  /**
   * Pause listening. annyang will stop responding to commands (until the resume or start methods are called), without turning off the browser's SpeechRecognition engine or the mic.
   *
   * Alternatively, to stop the SpeechRecognition engine and close the mic, use abort() instead.
   * @see [abort()](#abort)
   *
   * @method pause
   */
  pause: function() {
    pauseListening = true;
  },

  /**
   * Resumes listening and restores command callback execution when a result matches.
   * If SpeechRecognition was aborted (stopped), start it.
   *
   * @method resume
   */
  resume: function() {
    annyang.start();
  },

  /**
   * Set the language the user will speak in. If this method is not called, defaults to 'en-US'.
   *
   * @param {String} language - The language (locale)
   * @method setLanguage
   * @see [Languages](https://github.com/TalAter/annyang/blob/master/docs/FAQ.md#what-languages-are-supported)
   */
  setLanguage: function(language) {
    initIfNeeded();
    recognition.lang = language;
  },

  /**
   * Add commands that annyang will respond to. Similar in syntax to init(), but doesn't remove existing commands.
   *
   * #### Examples:
   * ````javascript
   * let commands = {'hello :name': helloFunction, 'howdy': helloFunction};
   * let commands2 = {'hi': helloFunction};
   *
   * annyang.addCommands(commands);
   * annyang.addCommands(commands2);
   * // annyang will now listen to all three commands
   * ````
   *
   * @param {Object} commands - Commands that annyang should listen to
   * @method addCommands
   * @see [Commands Object](#commands-object)
   */
  addCommands: function(commands, priority) {
    let cb;

    initIfNeeded();

    for (let phrase in commands) {
      if (commands.hasOwnProperty(phrase)) {
        cb = commands[phrase];
        if (typeof cb === "function") {
          // convert command to regex then register the command
          registerCommand(commandToRegExp(phrase), cb, phrase, priority);
        } else if (typeof cb === "object" && cb.regexp instanceof RegExp) {
          // register the command
          registerCommand(
            new RegExp(cb.regexp.source, "i"),
            cb.callback,
            phrase,
            priority
          );
        } else {
          if (debugState) {
            logMessage("Can not register command: %c" + phrase, debugStyle);
          }
          continue;
        }
      }
    }
  },

  /**
   * Remove existing commands. Called with a single phrase, array of phrases, or methodically. Pass no params to remove all commands.
   *
   * #### Examples:
   * ````javascript
   * let commands = {'hello': helloFunction, 'howdy': helloFunction, 'hi': helloFunction};
   *
   * // Remove all existing commands
   * annyang.removeCommands();
   *
   * // Add some commands
   * annyang.addCommands(commands);
   *
   * // Don't respond to hello
   * annyang.removeCommands('hello');
   *
   * // Don't respond to howdy or hi
   * annyang.removeCommands(['howdy', 'hi']);
   * ````
   * @param {String|Array|Undefined} [commandsToRemove] - Commands to remove
   * @method removeCommands
   */
  removeCommands: function(commandsToRemove) {
    if (commandsToRemove === undefined) {
      commandsList = [];
    } else {
      commandsToRemove = Array.isArray(commandsToRemove)
        ? commandsToRemove
        : [commandsToRemove];
      commandsList = commandsList.filter(command => {
        for (let i = 0; i < commandsToRemove.length; i++) {
          if (commandsToRemove[i] === command.originalPhrase) {
            return false;
          }
        }
        return true;
      });
    }
  },

  /**
   * Add a callback function to be called in case one of the following events happens:
   *
   * * `start` - Fired as soon as the browser's Speech Recognition engine starts listening
   * * `soundstart` - Fired as soon as any sound (possibly speech) has been detected.
   *     This will fire once per Speech Recognition starting. See https://is.gd/annyang_sound_start
   * * `error` - Fired when the browser's Speech Recogntion engine returns an error, this generic error callback will be followed by more accurate error callbacks (both will fire if both are defined)
   *     Callback function will be called with the error event as the first argument
   * * `errorNetwork` - Fired when Speech Recognition fails because of a network error
   *     Callback function will be called with the error event as the first argument
   * * `errorPermissionBlocked` - Fired when the browser blocks the permission request to use Speech Recognition.
   *     Callback function will be called with the error event as the first argument
   * * `errorPermissionDenied` - Fired when the user blocks the permission request to use Speech Recognition.
   *     Callback function will be called with the error event as the first argument
   * * `end` - Fired when the browser's Speech Recognition engine stops
   * * `result` - Fired as soon as some speech was identified. This generic callback will be followed by either the `resultMatch` or `resultNoMatch` callbacks.
   *     Callback functions for to this event will be called with an array of possible phrases the user said as the first argument
   * * `resultMatch` - Fired when annyang was able to match between what the user said and a registered command
   *     Callback functions for this event will be called with three arguments in the following order:
   *       * The phrase the user said that matched a command
   *       * The command that was matched
   *       * An array of possible alternative phrases the user might have said
   * * `resultNoMatch` - Fired when what the user said didn't match any of the registered commands.
   *     Callback functions for this event will be called with an array of possible phrases the user might've said as the first argument
   *
   * #### Examples:
   * ````javascript
   * annyang.addCallback('error', function() {
   *   $('.myErrorText').text('There was an error!');
   * });
   *
   * annyang.addCallback('resultMatch', function(userSaid, commandText, phrases) {
   *   console.log(userSaid); // sample output: 'hello'
   *   console.log(commandText); // sample output: 'hello (there)'
   *   console.log(phrases); // sample output: ['hello', 'halo', 'yellow', 'polo', 'hello kitty']
   * });
   *
   * // pass local context to a global function called notConnected
   * annyang.addCallback('errorNetwork', notConnected, this);
   * ````
   * @param {String} type - Name of event that will trigger this callback
   * @param {Function} callback - The function to call when event is triggered
   * @param {Object} [context] - Optional context for the callback function
   * @method addCallback
   */
  addCallback: function(type, callback, context) {
    let cb = callback;
    if (typeof cb === "function" && callbacks[type] !== undefined) {
      callbacks[type].push({ callback: cb, context: context || this });
    }
  },

  /**
   * Remove callbacks from events.
   *
   * - Pass an event name and a callback command to remove that callback command from that event type.
   * - Pass just an event name to remove all callback commands from that event type.
   * - Pass undefined as event name and a callback command to remove that callback command from all event types.
   * - Pass no params to remove all callback commands from all event types.
   *
   * #### Examples:
   * ````javascript
   * annyang.addCallback('start', myFunction1);
   * annyang.addCallback('start', myFunction2);
   * annyang.addCallback('end', myFunction1);
   * annyang.addCallback('end', myFunction2);
   *
   * // Remove all callbacks from all events:
   * annyang.removeCallback();
   *
   * // Remove all callbacks attached to end event:
   * annyang.removeCallback('end');
   *
   * // Remove myFunction2 from being called on start:
   * annyang.removeCallback('start', myFunction2);
   *
   * // Remove myFunction1 from being called on all events:
   * annyang.removeCallback(undefined, myFunction1);
   * ````
   *
   * @param type Name of event type to remove callback from
   * @param callback The callback function to remove
   * @returns undefined
   * @method removeCallback
   */
  removeCallback: function(type, callback) {
    let compareWithCallbackParameter = function(cb) {
      return cb.callback !== callback;
    };
    // Go over each callback type in callbacks store object
    for (let callbackType in callbacks) {
      if (callbacks.hasOwnProperty(callbackType)) {
        // if this is the type user asked to delete, or he asked to delete all, go ahead.
        if (type === undefined || type === callbackType) {
          // If user asked to delete all callbacks in this type or all types
          if (callback === undefined) {
            callbacks[callbackType] = [];
          } else {
            // Remove all matching callbacks
            callbacks[callbackType] = callbacks[callbackType].filter(
              compareWithCallbackParameter
            );
          }
        }
      }
    }
  },

  /**
   * Returns true if speech recognition is currently on.
   * Returns false if speech recognition is off or annyang is paused.
   *
   * @return boolean true = SpeechRecognition is on and annyang is listening
   * @method isListening
   */
  isListening: function() {
    return isListening && !pauseListening;
  },

  /**
   * Returns the instance of the browser's SpeechRecognition object used by annyang.
   * Useful in case you want direct access to the browser's Speech Recognition engine.
   *
   * @returns SpeechRecognition The browser's Speech Recognizer currently used by annyang
   * @method getSpeechRecognizer
   */
  getSpeechRecognizer: function() {
    return recognition;
  },

  /**
   * Simulate speech being recognized. This will trigger the same events and behavior as when the Speech Recognition
   * detects speech.
   *
   * Can accept either a string containing a single sentence, or an array containing multiple sentences to be checked
   * in order until one of them matches a command (similar to the way Speech Recognition Alternatives are parsed)
   *
   * #### Examples:
   * ````javascript
   * annyang.trigger('Time for some thrilling heroics');
   * annyang.trigger(
   *     ['Time for some thrilling heroics', 'Time for some thrilling aerobics']
   *   );
   * ````
   *
   * @param string|array sentences A sentence as a string or an array of strings of possible sentences
   * @returns undefined
   * @method trigger
   */
  trigger: function(sentences) {
    if (!annyang.isListening()) {
      if (debugState) {
        if (!isListening) {
          logMessage("Cannot trigger while annyang is aborted");
        } else {
          logMessage("Speech heard, but annyang is paused");
        }
      }
      return;
    }

    if (!Array.isArray(sentences)) {
      sentences = [sentences];
    }

    parseResults(sentences, true /* isFinal */);
  }
};

speechRecognitionEnabled.subscribe(result => {
  if (DEBUG) {
    console.log("Listening: ", result);
  }
  if (result) {
    annyang.start();
  } else {
    annyang.abort();
  }
});

/**
 * # Good to Know
 *
 * ## Commands Object
 *
 * Both the [init()]() and addCommands() methods receive a `commands` object.
 *
 * annyang understands commands with `named variables`, `splats`, and `optional words`.
 *
 * * Use `named variables` for one word arguments in your command.
 * * Use `splats` to capture multi-word text at the end of your command (greedy).
 * * Use `optional words` or phrases to define a part of the command as optional.
 *
 * #### Examples:
 * ````html
 * <script>
 * let commands = {
 *   // annyang will capture anything after a splat (*) and pass it to the function.
 *   // e.g. saying "Show me Batman and Robin" will call showFlickr('Batman and Robin');
 *   'show me *tag': showFlickr,
 *
 *   // A named variable is a one word variable, that can fit anywhere in your command.
 *   // e.g. saying "calculate October stats" will call calculateStats('October');
 *   'calculate :month stats': calculateStats,
 *
 *   // By defining a part of the following command as optional, annyang will respond
 *   // to both: "say hello to my little friend" as well as "say hello friend"
 *   'say hello (to my little) friend': greeting
 * };
 *
 * let showFlickr = function(tag) {
 *   let url = 'http://api.flickr.com/services/rest/?tags='+tag;
 *   $.getJSON(url);
 * }
 *
 * let calculateStats = function(month) {
 *   $('#stats').text('Statistics for '+month);
 * }
 *
 * let greeting = function() {
 *   $('#greeting').text('Hello!');
 * }
 * </script>
 * ````
 *
 * ### Using Regular Expressions in commands
 * For advanced commands, you can pass a regular expression object, instead of
 * a simple string command.
 *
 * This is done by passing an object containing two properties: `regexp`, and
 * `callback` instead of the function.
 *
 * #### Examples:
 * ````javascript
 * let calculateFunction = function(month) { console.log(month); }
 * let commands = {
 *   // This example will accept any word as the "month"
 *   'calculate :month stats': calculateFunction,
 *   // This example will only accept months which are at the start of a quarter
 *   'calculate :quarter stats': {'regexp': /^calculate (January|April|July|October) stats$/, 'callback': calculateFunction}
 * }
 ````
 *
 */
