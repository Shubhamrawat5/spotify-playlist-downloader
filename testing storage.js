const fs = require("fs");

const fileName = "playlist-inf.txt";
const path = "./" + fileName;

let SongInfoObj = {
  playlistUser: "SHUBHAM",
  playlistName: "xyz",
  total: 30,
  songs: [
    {
      name: "name1",
      singer: "singer1",
    },
    {
      name: "name2",
      singer: "singer2",
    },
  ],
};

if (fs.existsSync(path)) {
  console.log("EXISTS");
  console.log("READ FROM FILE");
  const data = fs.readFileSync(fileName, { encoding: "utf8", flag: "r" });
  console.log(JSON.parse(data));
} else {
  console.log("NOT EXISTS");
  console.log("SAVING IN FILE");
  fs.writeFileSync(fileName, JSON.stringify(SongInfoObj), (err) => {
    if (err) throw err;
    console.log("Saved!");
  });
}
