# spotify-playlist-downloader 🎵


1. Open cmd/console
2. Clone repo by `git clone git@github.com:Shubhamrawat5/spotify-playlist-downloader.git`
3. Open directory by `cd spotify-playlist-downloader`
4. Run `npm install` and `pip3 install -r requirements.txt`  to install all dependencies

> This uses puppeteer to extract spotify playlist info so it'll download chromium (150-200mb)

5. Now edit playlist url variable and set your playlist link in file `downloader.js [line 5]`
6. Run `node app.js`

- Now a folder named "songs" will be created.

- Playlist info will be extract and all the matching songs will start donwloading!

- If by chance you stop the script in between, then no worries as if song is already downloaded then next time it won't be downloaded again!

- Also there is 5% chance that song's some remix or different same name song will get downloaded...

- It tries to download time-synced lyrics (.lrc file) and song metadata (Cover image, artist, album, date, genre, etc...)

### Screenshots 🚀

<img src = "https://i.ibb.co/ScGmnj3/download-spotify-to-mp3.png" width="350"/>
<img src = "https://i.ibb.co/0MfLvNy/spo.png" width="800"/>
<img width="628" alt="Capture d’écran 2021-10-22 à 17 10 53" src="https://user-images.githubusercontent.com/44288655/138481262-62b12583-f92c-4f6d-9caa-73dbda04acb4.png">
<img width="582" alt="Capture d’écran 2021-10-22 à 17 26 00" src="https://user-images.githubusercontent.com/44288655/138481616-3fe7a6b9-b6de-47d2-a1a4-3dddfef559b9.png">
