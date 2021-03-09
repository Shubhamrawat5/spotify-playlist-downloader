const puppeteer = require("puppeteer");
url =
  "https://open.spotify.com/playlist/4hHXVHvGmhllQFQFZ9Ki6G?si=K5aryqfKSV6r__2EtvGakw&nd=1&nd=1";

let playlistUser, playlistName;
let songInfoArray = [];

let getUserName = async (page) => {
  playlistUser = await page.evaluate(async () => {
    return document.querySelector("._27275ab739867301de836c76ce5d1017-scss")
      .innerText;
  });
};

let getPlaylistName = async (page) => {
  playlistName = await page.evaluate(async () => {
    return document.querySelector(".dc48565bba15548872ea84c715a5fee2-scss")
      .innerText;
  });
};

let getPlaylistList = async (page) => {
  // console.log("EXTRACTING TOTAL SONGS...");
  songInfoArray = await page.evaluate(async () => {
    let totalSongsHtmlInfo = document.querySelectorAll(
      ".f6a6c11d18da1af699a0464367e2189a-scss"
    )[2].innerText;
    let totalSongs = Number(
      totalSongsHtmlInfo.slice(0, totalSongsHtmlInfo.search("song") - 1)
    ); //extracting total song from html innerText

    let SongElementArray = new Array(totalSongs).fill(0); //creating array of size of total songs to store all songs info

    console.log("STARTING TO FIND SONGS FROM WEBPAGE");
    let count = 0;
    while (true) {
      count += 1;
      console.log("WHILE TIMES: " + String(count));
      let currentViewSongElementList = document.querySelectorAll(
        "div[role='row']"
      ); //gives nodeList of current view
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
        setTimeout(resolve, 2000);
      });
    }

    let songInfoArray = [];
    // console.log(SongElementArray);
    SongElementArray.forEach((element) => {
      let name = element.querySelector(".da0bc4060bb1bdb4abb8e402916af32e-scss")
        .innerText;
      let singer = element.querySelector(
        "._966e29b71d2654743538480947a479b3-scss"
      ).innerText;
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
  await Promise.all([
    getUserName(page),
    getPlaylistName(page),
    getPlaylistList(page),
  ]);
  // await getUserName(page);
  // await getPlaylistName(page);
};

module.exports.getPlaylist = async () => {
  const browser = await puppeteer.launch({ headless: true, devtools: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1450 });
  await page.goto(url);
  await page.setDefaultNavigationTimeout(0);
  // await page.waitForSelector(".dc48565bba15548872ea84c715a5fee2-scss");
  await page.waitForSelector(".da0bc4060bb1bdb4abb8e402916af32e-scss");

  await getPlaylistInfo(page);
  console.log("USERNAME: " + playlistUser);
  console.log("PLAYLIST NAME: " + playlistName);
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
