# 🎬 Movie Streaming App

A **modern movie streaming platform** built with **React**, **Django REST Framework**, and **JWT authentication**. Users can search for movies, watch them, and manage personal watchlists.

**Future plans** include direct torrent streaming, watchparty rooms, and adaptive bitrate support.

---

**DEMO Website:** https://www.tstreams.co.uk
  - Can't actually stream movies due to limited storage.
  - Filter will be added to show movies which have clips available to stream.
  - It will be just for demonstration of streaming and progress tracking capabilities.

---

## 🚀 Features

- **User Authentication**  
  - Register and log in securely using JWT tokens.  
  - Access-controlled endpoints for authenticated users.

- **Movie Search & Playback**  
  - Movie metadata (posters, backdrops) is fetched from TMDb and stored on the local server.  
  - Movies are downloaded to a local server, converted to **HLS format** using ffmpeg, and streamed.

- **Watch Later and Watch History**  
  - Add movies to a "Watch Later" playlist.  
  - Delete movies from your playlist.
  - If you have started watching a movie, progress will be tracked,
    and pick up from where you left of next time you watch it.

- **Electron-ready**  
  - Can be packaged as a desktop app for cross-platform usage.

---

## 🏗 Backend Architecture

- **Django REST Framework:** Handles all API endpoints.  
- **PostgreSQL:** Stores user data, playlists, and movie metadata.  
- **Movies:** Downloaded torrents are saved locally.  
- **Media Conversion:** Movies are converted to **HLS** for streaming.  
- **Images:** Posters, backdrops, and other media assets are cached locally from TMDb.  
- **Authentication:** Secured with **JWT tokens** for all protected endpoints.  

**Future backend improvements:**

- **Adaptive Bitrate Streaming** – Adjust video quality dynamically based on network speed. (Limited by storage.)  
- **Direct Torrent Streaming** – Stream movies directly from torrents without waiting for full download.  
- **Watch Party Rooms** – Real-time synchronized playback for multiple users.
- **Movie Requesting** 
  - If a movie is not available on the server, users can submit a request for it.  
  - The backend automatically downloads, processes, and converts the movie to HLS format.  
  - Once the movie is ready for streaming, the user receives a notification via email.  
  - This allows users to access new content even with limited server storage.
- **Subscription Model** - Monthly subscription for premium features.
- **Email Verification** - On register, email user to confirm email.

---

## 🛠 Tech Stack

- **Frontend:** React, HLS.js, Electron  
- **Backend:** Django, Django REST Framework, PostgreSQL  
- **Authentication:** JWT (JSON Web Tokens)  
- **Other:** Docker, nginx

---

> **Disclaimer:** This project is for educational purposes only.
