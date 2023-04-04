const puppeteer = require("puppeteer");

let playlistUser, playlistName;
let songInfoArray = [];

let getUserName = async (page) => {
  try {
    console.log("\ngetting username");
    playlistUser = await page.evaluate(async () => {
      return document.querySelector('a[data-testid="creator-link"]').innerText;
    });
    console.log("# Playlist User: ", playlistUser);
  } catch (error) {
    console.log("There is a issue in getting user name");
    console.log(error);
  }
};
let getPlaylistName = async (page) => {
  try {
    console.log("\ngetting playlist name");
    playlistName = await page.evaluate(async () => {
      return document.querySelector('span[data-testid="entityTitle"]')
        .innerText;
    });
    console.log("# Playlist Name: ", playlistName);
  } catch (error) {
    console.log("There is a issue in getting playlist name");
    console.log(error);
  }
};

let getPlaylistList = async (page) => {
  console.log("\nEXTRACTING TOTAL SONGS...");
  try {
    songInfoArray = await page.evaluate(async () => {
      let SongElementArray = []; //creating array to store all songs html element
      let songInfoArray = []; //creating array to store all songs info

      // console.log("STARTING TO FIND SONGS FROM WEBPAGE");
      let lastElement;
      while (true) {
        let currentViewSongElementList =
          document.querySelectorAll("div[role='row']"); //gives nodeList of current view
        currentViewSongElementList = Array.from(currentViewSongElementList); //convert nodeList to Array

        let leng = currentViewSongElementList.length;

        // console.log(SongElementArray);
        for (let i = 0; i < leng; ++i) {
          //element index
          let songIndex =
            Number(
              currentViewSongElementList[i].getAttribute("aria-rowindex")
            ) - 1;

          if (SongElementArray.length <= songIndex) {
            SongElementArray.push(currentViewSongElementList[i]);
          }
        }
        // console.log(SongElementArray);

        //CHECK IF ALL SONGS ARE ADDED
        if (lastElement === currentViewSongElementList[leng - 1]) break;

        lastElement = currentViewSongElementList[leng - 1]; //last element

        lastElement.scrollIntoView();
        await new Promise(function (resolve) {
          setTimeout(resolve, 3000);
        }); //3 second wait
      }

      SongElementArray.shift(); //removing first element as it is always the heading, not song info

      console.log(SongElementArray);

      SongElementArray.forEach((element) => {
        let name, singer;
        try {
          name = element.querySelector(
            'a[data-testid="internal-track-link"]'
          ).innerText;
        } catch (err) {
          name = "null";
        }

        try {
          singer = element.querySelectorAll("span")[1].innerText;
        } catch (error) {
          singer = "null";
        }

        songInfoArray.push({
          name,
          singer,
        });
      });
      return songInfoArray;
    });
  } catch (error) {
    console.log("There is a issue in getting songs list");
    console.log(error);
  }
  // console.log(songInfoArray);
};

let getPlaylistInfo = async (page) => {
  console.log("====== GETTING SPOTIFY PLAYLIST INFO ======");
  // await Promise.all([getUserName(page), getPlaylistName(page)]);
  await getPlaylistName(page);
  await getUserName(page);
  await getPlaylistList(page);
};

// const getPlaylist = async (url) => {
module.exports.getPlaylist = async (url) => {
  console.log("opening Chromium.");
  const browser = await puppeteer.launch({ headless: false, devtools: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1450 });
  await page.setDefaultNavigationTimeout(0);
  console.log("opening url.");
  await page.goto(url);
  console.log("opened.");
  // await page.waitForSelector("._cx_B0JpuGl6cJE7YqU1");
  console.log("waiting for 10 seconds to load page.");
  await page.waitForTimeout(1000 * 4); //10 seconds
  console.log("waiting for 10 seconds complete.");

  await getPlaylistInfo(page);
  console.log("TOTAL SONGS: " + songInfoArray.length);

  //   count = 1;
  // console.log(songInfoArray);
  // display all songs name
  //   songInfoArray.forEach((item) => {
  //     console.log(String(count) + "-" + item.song);
  //     console.log(item.singer);
  //     count += 1;
  //   });
  await browser.close();
  return {
    playlistUser,
    playlistName,
    total: songInfoArray.length,
    songs: songInfoArray,
  };
};

// const url =
//   "https://open.spotify.com/playlist/4hHXVHvGmhllQFQFZ9Ki6G?si=K5aryqfKSV6r__2EtvGakw&nd=1&nd=1";

// getPlaylist(url);
