const fs = require("fs");
const ProgressBar = require("progress");
const axios = require("axios");
const prompt = require("prompt");
const NodeID3 = require("node-id3");
const itunesAPI = require("node-itunes-search");

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

    //for progress bar...
    const totalLength = headers["content-length"];
    const progressBar = new ProgressBar(
      "-> downloading [:bar] :percent :etas",
      {
        width: 40,
        complete: "=",
        incomplete: " ",
        renderThrottle: 1,
        total: parseInt(totalLength),
      }
    );

    data.on("data", (chunk) => progressBar.tick(chunk.length));
    data.on("end", () => {
      console.log("DOWNLOADED!");
      const filepath = `./songs/${songTitleFound}.mp3`;
      //Replace all connectives by a simple ','
      singerName = singerName.replace(/\s{2,10}/g, "");
      singerName = singerName.replace(" and ", ", ");
      singerName = singerName.replace(" et ", ", ");
      singerName = singerName.replace(" und ", ", ");
      singerName = singerName.replace(" & ", ", ");
      //Search track informations using the Itunes library
      const searchOptions = new itunesAPI.ItunesSearchOptions({
        term: encodeURI(songTitleFound), // All searches require a single string query and remove unescaped characters
        limit: 1, // An optional maximum number of returned results may be specified.
      });
      //Use the result to extract tags
      itunesAPI.searchItunes(searchOptions).then(async (result) => {
        try {
          // Get all the tags and cover art of the track using node-itunes-search and write them with node-id3
          let songImageUrl = result.results[0]["artworkUrl100"].replace(
            "100x100",
            "3000x3000"
          );
          let year = result.results[0]["releaseDate"].substring(0, 4);
          let genre = result.results[0]["primaryGenreName"].replace(
            /\?|<|>|\*|"|:|\||\/|\\/g,
            ""
          );
          let trackNumber = result.results[0]["trackNumber"];
          let trackCount = result.results[0]["trackCount"];
          trackNumber = trackNumber + "/" + trackCount;
          let album = result.results[0]["collectionName"].replace(
            /\?|<|>|\*|"|:|\||\/|\\/g,
            ""
          );

          let imageFilePath = songTitleFound + ".jpg";
          await downloadImage(songImageUrl, imageFilePath);
          const tags = {
            TALB: album,
            title: songName,
            artist: singerName,
            APIC: imageFilePath,
            year: year,
            trackNumber: trackNumber,
            genre: genre,
          };

          NodeID3.write(tags, filepath);
          console.log("WRITTEN TAGS");
          try {
            fs.unlinkSync(imageFilePath);
          } catch (err) {
            console.error(err);
          }
          startNextSong();
        } catch (err) {
          console.log("Full tags not found for " + songName);
          const tags = {
            title: songName,
            artist: singerName,
          };

          NodeID3.write(tags, filepath);
          console.log("WRITTEN TAGS (Only artist name and track title)");
          startNextSong();
        }
      });
    });

    //for saving in file...
    data.pipe(fs.createWriteStream(`./songs/${songTitleFound}.mp3`));
  } catch {
    console.log("some error came!");
    startNextSong(); //for next song!
  }
};

const downloadImage = async (songImageUrl, imageFilePath) => {
  try {
    const response = await axios({
      method: "GET",
      url: songImageUrl,
      responseType: "stream",
    });

    // Create a write stream to save the image
    const writer = fs.createWriteStream(imageFilePath);

    // Pipe the response data into the writer stream
    response.data.pipe(writer);

    // Wait for the image to finish downloading
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log("Image downloaded!");
  } catch (error) {
    console.error("Error downloading image:", error.message);
  }
};

const startNextSong = async () => {
  index += 1;
  if (index === songList.length) {
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

  const { songName, singerName } = songList[index];

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
    await downloadSong(songName, singerName, songDownloadUrl, songTitleFound);
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
