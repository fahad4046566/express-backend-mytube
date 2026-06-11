## 🚀 MyTube Backend – Production-Ready Video Platform API

A **professional, scalable, and fully-featured** backend API for a video-sharing platform (like YouTube) built with **Node.js, Express, MongoDB, and Cloudinary**. Includes authentication, video upload, subscriptions, likes, comments, playlists, and channel analytics.

---

### ✨ Features

- 🔐 **User Authentication** – JWT access/refresh tokens, HTTP-only cookies, secure password hashing
- 📹 **Video Management** – Upload via Cloudinary (unsigned, direct from frontend), metadata CRUD, publish/unpublish, paginated search & filtering
- 📊 **Channel Analytics** – Total views, videos, subscribers, likes (single aggregation pipeline)
- 🔔 **Subscription System** – Subscribe/unsubscribe, list subscribers, list subscribed channels
- ❤️ **Likes** – Toggle like on videos and comments, get liked videos list
- 💬 **Comments** – Add, update, delete, paginated retrieval with owner details
- 📂 **Playlists** – Create, update, delete, add/remove videos, fetch user playlists
- ⚡ **Advanced Aggregation** – `$lookup`, `$facet`, `$unwind`, `$group`, `$project` for complex reporting
- 🛡️ **Security** – Helmet, CORS, rate limiting (optional), cookie flags, input sanitization
- 🚀 **Deployment Ready** – Configured for Vercel (serverless) with memory storage & buffer-based file uploads

---

### 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Runtime** | Node.js, Express |
| **Database** | MongoDB, Mongoose (ODM) |
| **Authentication** | JWT, bcrypt, cookie-parser |
| **File Storage** | Cloudinary (with buffer uploads) |
| **Validation** | Custom + Joi (optional) |
| **Environment** | dotenv |
| **Dev Tools** | Nodemon, Prettier, ESLint (setup optional) |
| **Deployment** | Vercel / Railway / Render |

---

### 📁 Project Structure

```
src/
├── controllers/       # Business logic (user, video, subscription, like, comment, playlist)
├── models/            # Mongoose schemas (User, Video, Subscription, Like, Comment, Playlist)
├── routes/            # Express routers (versioned endpoints)
├── middlewares/       # Multer, verifyJWT, error handling
├── utils/             # ApiError, ApiResponse, asyncHandler, cloudinary helper
├── db/                # MongoDB connection
└── app.js             # Express app config
```

---

### 🔧 Environment Variables

Create a `.env` file with:

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

---

### 🧪 API Endpoints Overview

<details>
<summary><b>User Routes</b> <code>/api/v1/users</code></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create new user (with avatar/cover image) |
| POST | `/login` | Login → returns cookies |
| POST | `/logout` | Clears cookies, removes refresh token |
| GET | `/current-user` | Fetch logged-in user details |
| PATCH | `/update-account` | Update name/email |
| PATCH | `/avatar` | Update avatar (single file) |
| PATCH | `/cover-image` | Update cover image |
| POST | `/refresh-token` | Generate new access token |
| GET | `/c/:username` | Get channel profile (subscribers, subscription status) |
| GET | `/watch-history` | Get user's watch history (with video details) |
</details>

<details>
<summary><b>Video Routes</b> <code>/api/v1/videos</code></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all videos (public) with search, pagination, sorting, userId filter |
| POST | `/` | Save video metadata (after frontend uploads to Cloudinary) |
| GET | `/get-upload-config` | Return unsigned Cloudinary config for direct upload |
| GET | `/:videoId` | Get video by ID (increments views) |
| PATCH | `/:videoId` | Update video details (owner only) |
| DELETE | `/:videoId` | Delete video (removes from DB + Cloudinary) |
| PATCH | `/status/:videoId/:bool` | Publish/unpublish video |
</details>

<details>
<summary><b>Subscription Routes</b> <code>/api/v1/subscriptions</code></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/c/:channelId` | Subscribe/unsubscribe channel |
| GET | `/c/:channelId/subscribers` | Get all subscribers of a channel |
| GET | `/u/:subscriberId` | Get all channels a user has subscribed to |
</details>

<details>
<summary><b>Comment Routes</b> <code>/api/v1/comments</code></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/add/:videoId` | Add comment to video |
| PATCH | `/update/:commentId` | Update comment (owner only) |
| DELETE | `/delete/:commentId` | Delete comment (owner only) |
| GET | `/video/:videoId` | Get all comments of a video (paginated) |
</details>

<details>
<summary><b>Like Routes</b> <code>/api/v1/likes</code></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/video/:videoId` | Toggle like on video |
| POST | `/comment/:commentId` | Toggle like on comment |
| GET | `/videos` | Get all liked videos (by logged-in user) |
</details>

<details>
<summary><b>Playlist Routes</b> <code>/api/v1/playlists</code></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create playlist |
| GET | `/user/:userId` | Get all playlists of a user |
| GET | `/:playlistId` | Get playlist by ID (with populated videos) |
| PATCH | `/:playlistId` | Update playlist (name/description) |
| DELETE | `/:playlistId` | Delete playlist |
| PATCH | `/:playlistId/add/:videoId` | Add video to playlist |
| PATCH | `/:playlistId/remove/:videoId` | Remove video from playlist |
</details>

<details>
<summary><b>Dashboard</b> <code>/api/v1/dashboard</code></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get channel statistics (total views, videos, subscribers, likes) |
</details>

---

### 🧠 Key Design Decisions & Highlights

- **Direct Cloudinary Uploads** – Frontend uploads files directly to Cloudinary using unsigned presets. The backend only returns config and stores metadata. This keeps the server lightweight and Vercel‑friendly.
- **Buffer‑Based Uploads in Dev** – Locally, `multer.memoryStorage()` is used to avoid writing to disk, making the same code work on serverless platforms.
- **Aggregation Pipelines** – Used `$facet`, `$lookup`, `$unwind`, `$project` for efficient paginated responses and complex stats.
- **Token Rotation** – Refresh tokens are stored in the database and rotated on every refresh. Invalid or used tokens are rejected.
- **Error Handling** – Custom `ApiError` and `asyncHandler` eliminate try/catch boilerplate. All responses follow a consistent `ApiResponse` structure.

---

### 🧪 Testing

1. **Clone the repository**
2. **Install dependencies** – `npm install`
3. **Set up environment variables** (see above)
4. **Run locally** – `npm run dev` (uses nodemon)
5. **Test with Postman** – import the collection (link to be added)

---

### 📦 Deployment (Vercel)

- The project is configured to run as a serverless function.
- Set all environment variables in your Vercel dashboard.
- Ensure `vercel.json` points to `src/index.js`.
- Memory storage ensures file uploads work without a writable filesystem.

---

### 📄 License

ISC

---

### 👨‍💻 Author

**Fahad Bashir** – [GitHub](https://github.com/fahad4046566)

> Built from scratch as a learning journey – from authentication to complex aggregations. Ready for your next big idea! 🚀

---

### ⭐ Support

If you find this project helpful, give it a star on GitHub! Feel free to fork, raise issues, or contribute.

---

**Need help?** Open an issue or reach out. Happy coding! 🎥