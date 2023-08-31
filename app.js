const fs = require("fs");
const ProgressBar = require("progress");
const axios = require("axios");

const request = require("request");
const NodeID3 = require("node-id3");
const itunesAPI = require("node-itunes-search");

const { getPlaylist } = require("./src/getPlaylist");

// "https://open.spotify.com/playlist/08khTGVkE7JRDYAoS0KmKb?si=tEdvqhnNQKyolBOHTGKdIA&utm_source=copy-link&dl_branch=1&nd=1";
const url =
  "https://open.spotify.com/playlist/6erqXmUhndc9DmQBMsImyY?si=tdOMvOQdR6KAZy9916kXcg&utm_source=copy-link&dl_branch=1&nd=1";
const INFO_URL = "https://slider.kz/vk_auth.php?q=";
// const DOWNLOAD_URL = "https://slider.kz/download/";
let index = -1;
let songList = [];
let totalSongs = 0;
let notFound = [];

const download = async (song, url, song_name, singer_names) => {
  try {
    let numb = index + 1;
    console.log(`(${numb}/${totalSongs}) Starting download: ${song}`);
    const { data, headers } = await axios({
      method: "GET",
      url: url,
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
      singer_names = singer_names.replace(/\s{2,10}/g, "");
      console.log("DOWNLOADED!");
      const filepath = `./songs/${song}.mp3`;
      //Replace all connectives by a simple ','
      singer_names = singer_names.replace(" and ", ", ");
      singer_names = singer_names.replace(" et ", ", ");
      singer_names = singer_names.replace(" und ", ", ");
      singer_names = singer_names.replace(" & ", ", ");
      //Search track informations using the Itunes library
      const searchOptions = new itunesAPI.ItunesSearchOptions({
        term: encodeURI(song), // All searches require a single string query and remove unescaped characters
        limit: 1, // An optional maximum number of returned results may be specified.
      });
      //Use the result to extract tags
      itunesAPI.searchItunes(searchOptions).then((result) => {
        try {
          // Get all the tags and cover art of the track using node-itunes-search and write them with node-id3
          let maxres = result.results[0]["artworkUrl100"].replace(
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

          let query_artwork_file = song + ".jpg";
          download_artwork(maxres, query_artwork_file, function () {
            //console.log('Artwork downloaded');
            const tags = {
              TALB: album,
              title: song_name,
              artist: singer_names,
              APIC: query_artwork_file,
              year: year,
              trackNumber: trackNumber,
              genre: genre,
            };
            //console.log(tags);
            NodeID3.write(tags, filepath);
            console.log("WRITTEN TAGS");
            try {
              fs.unlinkSync(query_artwork_file);
              //file removed
            } catch (err) {
              console.error(err);
            }
            startDownloading();
            //for next song!
          });
        } catch {
          console.log("Full tags not found for " + song_name);
          const tags = {
            title: song_name,
            artist: singer_names,
          };

          NodeID3.write(tags, filepath);
          console.log("WRITTEN TAGS (Only artist name and track title)");
          startDownloading();
        }
      });
    });

    //for saving in file...
    data.pipe(fs.createWriteStream(`./songs/${song}.mp3`));
  } catch {
    console.log("some error came!");
    startDownloading(); //for next song!
  }
};

const download_artwork = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    //console.log('content-type:', res.headers['content-type']);
    //console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};

const getURL = async (song, singer) => {
  let query = (singer + "%20" + song).replace(/\s/g, "%20");
  // console.log(INFO_URL + query);
  const { data } = await axios.get(encodeURI(INFO_URL + query));

  // when no result then [{}] is returned so length is always 1, when 1 result then [{id:"",etc:""}]
  if (!data["audios"][""][0].id) {
    //no result
    console.log("==[ SONG NOT FOUND! ]== : " + song);
    notFound.push(song + " - " + singer);
    startDownloading();
    return;
  }

  //avoid remix,revisited,mix
  let i = 0;
  let track = data["audios"][""][i];
  let totalTracks = data["audios"][""].length;
  while (i < totalTracks && /remix|revisited|reverb|mix/i.test(track.tit_art)) {
    i += 1;
    track = data["audios"][""][i];
  }
  //if reach the end then select the first song
  if (!track) {
    track = data["audios"][""][0];
  }

  let songName = track.tit_art.replace(/\?|<|>|\*|"|:|\||\/|\\/g, ""); //removing special characters which are not allowed in file name
  if (fs.existsSync(`./songs/${songName}.mp3`)) {
    let numb = index + 1;
    console.log(
      "(" + numb + "/" + totalSongs + ") - Song already present!!!!! " + song
    );
    startDownloading(); //next song
    return;
  }

  let link = track.url;
  link = encodeURI(link); //to replace unescaped characters from link

  download(songName, link, song, singer);
};

const startDownloading = () => {
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
  let song = songList[index].name;
  let singer = songList[index].singer;
  getURL(song, singer);
};

const start = async () => {
  try {
    let songPlaylistObj;
    const platlistFileName = "playlist-info.txt";

    if (fs.existsSync(`./${platlistFileName}`)) {
      console.log(
        "\nPLAYLIST INFO ALREADY EXIST PRESENT LOCALLY ! IF PLAYLIST HAVE SOME CHANGES THEN DELETE THE playlist-info.txt FILE"
      );
      console.log("READING PLAYLIST INFO FROM FILE..\n");
      const data = fs.readFileSync(platlistFileName, {
        encoding: "utf8",
        flag: "r",
      });
      songPlaylistObj = JSON.parse(data);
    } else {
      console.log("\nPLAYLIST INFO DOES NOT EXIST LOCALLY !");
      console.log(
        "SAVING PLAYLIST INFO IN FILE.. SO THAT NEXT TIME PLAYLIST INFO WON'T BE EXTRACTED AGAIN!"
      );

      songPlaylistObj = await getPlaylist(url);
      songPlaylistObj.url = url; //saving playlist url also

      fs.writeFileSync(
        platlistFileName,
        JSON.stringify(songPlaylistObj),
        (err) => {
          if (err) throw err;
          console.log("Saved playlist info locally in playlist-info.txt!");
        }
      );
    }

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
    startDownloading();
  } catch (err) {
    console.log(err);
  }
};

start();
