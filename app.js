const fs = require("fs");
const ProgressBar = require("progress");
const axios = require("axios");
const prompt = require("prompt");
const NodeID3 = require("node-id3");

const youtubedl = require("youtube-dl-exec");

const { getPlaylist } = require("./src/getPlaylist");
const { getDownloadLink } = require("./src/getDownloadLink");

let index = -1;
let songList = [];
let totalSongs = 0;
let notFound = [];

const downloadSong = async (
  songName,
  singerName,
  songDownloadUrl,
  songTitleFound
) => {
  try {
    let numb = index + 1;
    console.log(`\n(${numb}/${totalSongs}) Starting download: ${songName}`);
    const { data, headers } = await axios({
      method: "GET",
      url: songDownloadUrl,
      responseType: "stream",
    });

    var bar = new ProgressBar("[:bar]  :percent :etas ", {
      total: 45,
    });
    var timer = setInterval(function () {
      bar.tick();
      if (bar.complete) {
        console.log(`\n ${songTitleFound} - Downloaded\n`);
        clearInterval(timer);
      }
    }, 100);

    data.on("end", async () => {
      singerName = singerName.replace(/\s{2,10}/g, "");
      console.log("Song Downloaded!");

      startNextSong();
    });

    //for saving in file...

    await youtubedl(songDownloadUrl, {
      format: "m4a",
      output: "./songs/" + songTitleFound + ".mp3",
      maxFilesize: "104857600",
      preferFreeFormats: true,
    });
    startNextSong();
  } catch (err) {
    console.log("Error:", err);
    startNextSong();
  }
};

// const downloadImage = async (songImageUrl, imageFilePath) => {
//   try {
//     const response = await axios({
//       method: "GET",
//       url: songImageUrl,
//       responseType: "stream",
//     });

//     // Create a write stream to save the image
//     const writer = fs.createWriteStream(imageFilePath);

//     // Pipe the response data into the writer stream
//     response.data.pipe(writer);

//     // Wait for the image to finish downloading
//     await new Promise((resolve, reject) => {
//       writer.on("finish", resolve);
//       writer.on("error", reject);
//     });

//     console.log("Image downloaded!");
//   } catch (error) {
//     console.error("Error downloading image:", error.message);
//   }
// };

const startNextSong = async () => {
  index += 1;
  if (index === totalSongs) {
    console.log("\n#### ALL SONGS ARE DOWNLOADED!! ####\n");
    console.log("Songs that are not found:-");
    let i = 1;
    for (let song of notFound) {
      console.log(`${i} - ${song}`);
      i += 1;
    }
    if (i === 1) console.log("None!");
    return;
  }

  const { songName, singerName, songDurationSec } = songList[index];

  const res = await getDownloadLink(songName, singerName);

  if (res) {
    const { songDownloadUrl, songTitleFound } = res;
    if (fs.existsSync(`./songs/${songTitleFound}.mp3`)) {
      console.log(
        `\n(${
          index + 1
        }/${totalSongs}) - [ SONG ALREADY PRESENT ] : ${songName}`
      );
      startNextSong(); //next song
      return;
    }
    await downloadSong(
      songName,
      singerName,
      songDownloadUrl,
      songTitleFound,
      songDurationSec
    );
  } else {
    console.log(
      `\n(${index + 1}/${totalSongs}) - [ SONG NOT FOUND ] : ${songName}`
    );
    notFound.push(`${songName} - ${singerName}`);
    startNextSong();
  }
};

const start = async () => {
  try {
    let songPlaylistObj;
    const platlistFileName = "playlist-info.txt";

    console.log("Checking if file playlist-info.txt exist locally!");

    if (fs.existsSync(`./${platlistFileName}`)) {
      console.log(
        "File playlist-info.txt does exist. Reading data.. [if there is any changes in playlist, delete the file playlist-info.txt and execute code again]"
      );
      const data = fs.readFileSync(platlistFileName, {
        encoding: "utf8",
        flag: "r",
      });
      songPlaylistObj = JSON.parse(data);
    } else {
      console.log("File playlist-info.txt does not exist.");
      prompt.start();
      const { Playlist_URL } = await prompt.get(["Playlist_URL"]);
      // "https://open.spotify.com/playlist/6erqXmUhndc9DmQBMsImyY?si=tdOMvOQdR6KAZy9916kXcg&utm_source=copy-link&dl_branch=1&nd=1";

      songPlaylistObj = await getPlaylist(Playlist_URL);
      songPlaylistObj.url = Playlist_URL; //saving playlist url also

      console.log(
        "Saving data in playlist-info.txt file. [Next time, data will be directly read from this file]"
      );

      fs.writeFileSync(
        platlistFileName,
        JSON.stringify(songPlaylistObj),
        (err) => {
          if (err) throw err;
          console.log("Saved data in playlist-info.txt file.");
        }
      );
    }

    console.log("\nPlaylist URL: ", songPlaylistObj.url);
    console.log("Playlist Name: ", songPlaylistObj.playlist);
    console.log("User Name: ", songPlaylistObj.user);
    console.log("Total songs: ", songPlaylistObj.songs.length);

    songList = songPlaylistObj.songs;
    totalSongs = songPlaylistObj.songs.length;

    //create folder
    let dir = "./songs";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    startNextSong();
  } catch (err) {
    console.log(err);
  }
};

start();
