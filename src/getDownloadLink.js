const axios = require("axios");

const INFO_URL = "https://slider.kz/vk_auth.php?q=";
// const DOWNLOAD_URL = "https://slider.kz/download/";

module.exports.getDownloadLink = async (song, singer) => {
  let query = (singer + "%20" + song).replace(/\s/g, "%20");
  // console.log(INFO_URL + query);
  const { data } = await axios.get(encodeURI(INFO_URL + query));

  // when no result then [{}] is returned so length is always 1, when 1 result then [{id:"",etc:""}]
  if (!data["audios"][""][0].id) {
    return null;
  }

  const songs = data["audios"][""];
  let songDownloadUrl = null;
  let songTitleFound = null;

  for (let i = 0; i < songs.length; i++) {
    if (/remix|revisited|reverb|mix/i.test(songs[i].tit_art) === false) {
      songDownloadUrl = encodeURI(songs[i].url); // to replace unescaped characters from link
      songTitleFound = songs[i].tit_art.replace(/\?|<|>|\*|"|:|\||\/|\\/g, ""); //removing special characters which are not allowed in file name;
      break;
    }
  }

  if (songDownloadUrl && songTitleFound) {
    return { songDownloadUrl, songTitleFound };
  }
  return null;
};
