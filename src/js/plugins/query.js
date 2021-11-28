import cheerio from "cheerio";
import axios from "axios";
import { activeListening } from '../store';
import { openTabWithUrl, performActionWithDelay } from '../core';

async function loadAndParsePage(url) {
  const response = await axios.get(url);
  return cheerio.load(response.data);
}

async function generateGoogleLuckyUrl(query) {
  const parsedResponse = await loadAndParsePage("https://www.google.com/");
  const sxsrf = parsedResponse("input[name='sxsrf']").attr("value");
  const ei = parsedResponse("input[name='ei']").attr("value");
  const iflsig = parsedResponse("input[name='iflsig']").attr("value");
  const source = parsedResponse("input[name='source']").attr("value");
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("sxsrf", sxsrf);
  url.searchParams.set("ei", ei);
  url.searchParams.set("iflsig", iflsig);
  url.searchParams.set("source", source);
  url.searchParams.set("btnI", "I'm Feeling Lucky");
  url.searchParams.set("q", query);
  return url.href;
}

const siteToUrl = {
  Bing: "https://www.bing.com/search?q=",
  AOL: "https://search.aol.com/aol/search?q=",
  Yahoo: "https://search.yahoo.com/search?p=",
  Amazon: "https://www.amazon.com/s?tag=bewisse-20&k=",
  Walmart: "https://www.walmart.com/search/?query=",
  Target: "https://www.target.com/s?searchTerm=",
  YouTube: "https://www.youtube.com/results?search_query=",
  Baidu: "http://www.baidu.com/s?wd=",
  Wikipedia: "https://www.wikipedia.org/wiki/"
};

const searchCommands = [];
for (const key in siteToUrl) {
  searchCommands.push({
    action: `QUERY_SEARCH_QUERY_ON_${key.toUpperCase()}`,
    callback: query => {
      openTabWithUrl(siteToUrl[key] + query);
    },
    priority: 0.3
  });
}

const commands = [
  {
    action: 'QUERY_SEARCH_IMAGE',
    callback: query => {
      openTabWithUrl(
        "https://www.google.com/search?tbm=isch&q=" + query
      );
    }
  },
  {
    action: 'QUERY_SEARCH_NEWS',
    callback: query => {
      openTabWithUrl(
        "https://www.google.com/search?tbm=nws&q=" + query
      );
    }
  },
  {
    action: 'QUERY_NEWS',
    callback: () => {
      openTabWithUrl("https://news.google.com/");
    }
  },
  {
    action: 'QUERY_SEARCH_MAP',
    callback: query => {
      openTabWithUrl("https://www.google.com/maps?q=" + query);
    }
  },

  {
    action: 'QUERY_SEARCH_DIRECTION_FROM_TO',
    callback: (from, to) => {
      performActionWithDelay(() => {
        openTabWithUrl(
          "https://www.google.com/maps/dir/" + from + "/" + to
        );
      });
    }
  },

  {
    action: 'QUERY_SEARCH_DIRECTION_FROM',
    callback: query => {
      openTabWithUrl("https://www.google.com/maps/dir/" + query);
    }
  },

  {
    action: 'QUERY_SEARCH_DIRECTION_TO',
    callback: query => {
      openTabWithUrl("https://www.google.com/maps/dir//" + query);
    }
  },
  {
    action: 'QUERY_GO_TO_WIKIPEDIA',
    callback: () => {
      openTabWithUrl("https://wikipedia.org/");
    }
  },
  {
    action: 'QUERY_SEARCH_WIKIPEDIA',
    callback: query => {
      openTabWithUrl(
        "https://en.wikipedia.org/wiki/Special:Search/" + query
      );
    }
  },
  {
    action: 'QUERY_GO_TO_VIDEO',
    callback: () => {
      openTabWithUrl("https://www.youtube.com/");
    }
  },
  {
    action: 'QUERY_SEARCH_VIDEO',
    callback: query => {
      openTabWithUrl(
        "https://www.youtube.com/results?search_query=" + query
      );
    }
  },
  {
    action: 'QUERY_GO_TO_MUSIC',
    callback: () => {
      openTabWithUrl("https://play.google.com/music/listen");
    }
  },
  {
    action: 'QUERY_GO_TO_SHOPPING',
    callback: () => {
      openTabWithUrl("https://www.amazon.com/?tag=bewisse-20");
    }
  },
  {
    action: 'QUERY_SEARCH_SHOPPING',
    callback: query => {
      openTabWithUrl(
        "https://www.amazon.com/s?tag=bewisse-20&k=" + query
      );
    }
  },
  {
    action: 'QUERY_GO_TO_DOWNLOADS',
    callback: () => {
      openTabWithUrl("chrome://downloads");
    }
  },

  {
    action: 'QUERY_GO_TO_BOOKMARKS',
    callback: () => {
      openTabWithUrl("chrome://bookmarks");
    }
  },

  {
    action: 'QUERY_GO_TO_HISTORY',
    callback: () => {
      openTabWithUrl("chrome://history");
    }
  },

  {
    action: 'QUERY_GO_TO_QUERY',
    callback: async query => {
      openTabWithUrl(await generateGoogleLuckyUrl(query));
    }
  },
  ...searchCommands,
  {
    action: 'QUERY_SEARCH_QUERY_ON_SITE',
    callback: async (query, site) => {
      openTabWithUrl(
        await generateGoogleLuckyUrl(query + " on " + site)
      );
    },
    priority: 0.3
  },
  {
    action: 'QUERY_SEARCH_QUERY',
    callback: query => {
      chrome.storage.local.get(["tts"], result => {
        // If TTS is enabled, we need to clear notifications to avoid the TTS to feedback into the command.
        if (result.tts) {
          openTabWithUrl(
            "https://www.google.com/search?gs_ivs=1&q=" +
            encodeURIComponent(query)
          );
          activeListening.set(false);
        } else {
          openTabWithUrl(
            "https://www.google.com/search?q=" +
            encodeURIComponent(query)
          );
        }
      });
    },
    priority: 0.2
  }
];

export default commands;
