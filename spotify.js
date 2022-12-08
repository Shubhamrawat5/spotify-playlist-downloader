const puppeteer = require("puppeteer");

let playlistUser, playlistName;
let songInfoArray = [];

let getUserName = async (page) => {
  try {
    console.log("\ngetting username");
    playlistUser = await page.evaluate(async () => {
      return document.querySelector(".AezAnkZiU695IkdNqFGt").innerText;
    });
    console.log("# Playlist User: ", playlistUser);
  } catch {
    console.log(
      "There is a issue with html of webapge. Most probably page didn't load or spotify has changed their html css classes name"
    );
  }
};

let getPlaylistName = async (page) => {
  try {
    console.log("\ngetting playlist name");
    playlistName = await page.evaluate(async () => {
      return document.querySelector("._meqsRRoQONlQfjhfxzp").innerText;
    });
    console.log("# Playlist Name: ", playlistName);
  } catch {
    console.log(
      "There is a issue with html of webapge. Most probably page didn't load or spotify has changed their html css classes name"
    );
  }
};

let getPlaylistList = async (page) => {
  console.log("\nEXTRACTING TOTAL SONGS...");
  songInfoArray = await page.evaluate(async () => {
    let totalSongsHtmlInfo = document.querySelectorAll(".Cv3pxwZSbwL_dShdj278")[
      document.querySelectorAll(".Cv3pxwZSbwL_dShdj278").length - 1
    ].innerText;

    //extracting total song from html innerText
    // console.log("extracting total song from html innerText");
    let totalSongs = Number(totalSongsHtmlInfo.split(" ")[0]);

    let SongElementArray = new Array(totalSongs).fill(0); //creating array of size of total songs to store all songs info

    // console.log("STARTING TO FIND SONGS FROM WEBPAGE: ", totalSongs);
    let count = 0;
    while (true) {
      count += 1;
      // console.log("WHILE TIMES: " + String(count));
      let currentViewSongElementList =
        document.querySelectorAll("div[role='row']"); //gives nodeList of current view
      currentViewSongElementList = Array.from(currentViewSongElementList); //convert nodeList to Array
      currentViewSongElementList.shift(); //removing first element as it is heading always, not of song

      let leng = currentViewSongElementList.length;

      //below index are according to web aria-rowindex index
      //example: total song 100 so aria-rowindex will be 1 to 101 where 1st index is of heading
      //songs will be aria-rowindex 2 to 101
      //so in program index will be ((aria-rowindex)-2) => 0 to 99

      for (let i = 0; i < leng; ++i) {
        //element index
        let aria_row_index = Number(
          currentViewSongElementList[i].getAttribute("aria-rowindex")
        );
        SongElementArray[aria_row_index - 2] = currentViewSongElementList[i];
      }

      //last element got filled!
      if (SongElementArray[totalSongs - 1] !== 0) {
        console.log("FOUND ALL THE SONGS");
        break;
      }

      let lastEle = currentViewSongElementList[leng - 1]; //last element
      lastEle.scrollIntoView();
      await new Promise(function (resolve) {
        setTimeout(resolve, 3000);
      }); //3 second wait
    }

    let songInfoArray = [];
    // console.log(SongElementArray);
    SongElementArray.forEach((element) => {
      let name = element.querySelector(".eyyspMJ_K_t8mHpLP_kP").innerText;
      let singer = element.querySelector(".rI54qKbHwvJBDpQ5XHRO").innerText;
      songInfoArray.push({
        name,
        singer,
      });
    });
    return songInfoArray;
  });
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
  const browser = await puppeteer.launch({ headless: true, devtools: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1450 });
  await page.setDefaultNavigationTimeout(0);
  console.log("opening url.");
  await page.goto(url);
  console.log("opened.");
  // await page.waitForSelector("._cx_B0JpuGl6cJE7YqU1");
  console.log("waiting for 10 seconds to load page.");
  await page.waitForTimeout(1000 * 10); //10 seconds
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
