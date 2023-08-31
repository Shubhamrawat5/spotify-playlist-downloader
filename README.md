# spotify-playlist-downloader 🎵

[✔️ Working as of 01-09-2023]

1. Open cmd/console
2. Clone repo - `git clone https://github.com/Shubhamrawat5/spotify-playlist-downloader.git`
3. Open directory - `cd spotify-playlist-downloader`
4. Install all dependencies - `npm install`

   > This uses puppeteer to extract spotify playlist info so it'll download chromium (150-200mb)

5. Run `npm start`
6. It'll ask for playlist url, paste it and press enter.

Dummy Playlist_URL: `https://open.spotify.com/playlist/6erqXmUhndc9DmQBMsImyY?si=tdOMvOQdR6KAZy9916kXcg&utm_source=copy-link&dl_branch=1&nd=1`

- Now a folder "songs" will be created.
- Playlist info will be extract and all the matching songs will start donwloading!
- It'll not download same song again if you rerun the code, So if any song is half downloaded then you can delete it from songs folder.
- Also there is 5% chance that song's some remix or different same name song will get downloaded... I'll be fixing this soon !

## Screenshots 🚀

<img src = "https://i.ibb.co/ScGmnj3/download-spotify-to-mp3.png" width="350"/>
<img src = "https://i.ibb.co/0MfLvNy/spo.png" width="800"/>

## Contribute & Issues 🚀

- Feel free to Contribute to improve this.
- Raise an Issue if you face any problem.
