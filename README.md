# Budget

![Budget logo](logo-small.webp)

> [!IMPORTANT]
>This project is entirely vibe coded by GPT 5.5 and GPT 5.6 Sol.
>I will not provide any support for bug fixes unless I also find it annoying.

A lightweight, self-hosted budget and expense tracker built with vanilla HTML, CSS, JavaScript, and Node.js. It has no npm dependencies and stores profile data in a local JSON file.

## Features

- Daily quota, today-specific quota, total budget, and automatic rollover
- Multiple currencies with locale-aware formatting
- Multiple local profiles protected by a PIN
- Add, edit, and delete expenses
- Reusable expense suggestions that preserve fields you have already filled in
- Activity view with date filtering and a 30-week contribution-style heatmap
- Future-date selection prevention
- Custom background uploads with automatic color-palette extraction
- Responsive glass-style interface for desktop and mobile
- Optional Android WebView client with saved server profiles

### Mobile gestures

- Swipe left or right on the Activity date to change days
- Pinch the Activity heatmap to zoom, then swipe to pan
- Swipe an expense left to reveal Edit and Delete
- Swipe the expense right or tap elsewhere to close its actions

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- A modern browser

No package installation or build step is required for the web application. The frontend dependencies used by the page are included in `vendor/`.

## Quick start

```bash
git clone <your-repository-url>
cd finance-manager
node server.js
```

Open [http://localhost:4173](http://localhost:4173).

On first use, enter a profile name and PIN. If the profile does not exist, it will be created automatically.

### Server configuration

The server listens on every network interface at port `4173` by default. Override either value with environment variables:

```bash
HOST=127.0.0.1 PORT=8080 node server.js
```

To use the application from another device on your local network, keep the default host and open:

```text
http://YOUR_COMPUTER_LAN_IP:4173
```

Make sure the selected port is permitted by your firewall.

## Using the application

### Budget settings

Open the Overview tab and expand **Quota** to configure:

- Daily quota
- A quota override for today
- Total available amount
- Currency
- Automatic rollover of unused daily money

### Expenses and Activity

The Activity tab lets you select a date, inspect its expenses, and add a new expense. Dates after today are disabled.

On desktop, hover over an expense to reveal Edit and Delete. On mobile, swipe the expense left to reveal those actions.

The heatmap summarizes the last 30 weeks. Darker cells represent days with higher spending relative to the largest daily total in that period. Tap a cell to select its date.

### Profiles

Profiles are stored on the server. A profile name is case-insensitive, and entering a new name creates a new profile. Enable **Remember me** to keep the active profile in that browser.

### Custom appearance

Use the hamburger menu to upload or clear a background image. Uploaded images are resized and compressed in the browser before being saved by the server. The interface automatically derives a matching color palette from the image.

## Data storage and backups

Application data is stored in:

```text
data/finance-db.json
```

Uploaded backgrounds are stored in:

```text
uploads/
```

Back up both locations if you want to preserve profiles, budgets, expenses, and uploaded backgrounds. Stop the server before replacing the database file.

These directories may contain private financial information and should not be committed to a public repository.

For a public repository, a useful `.gitignore` starting point is:

```gitignore
data/
uploads/
android/.gradle/
android/build/
android/app/build/
android/local.properties
```

## Android client

The `android/` directory contains an optional native Android wrapper. It connects a WebView to a Finance Manager server and remembers previously used server addresses.

### Build requirements

- Android SDK with API 35
- Android build tools
- Gradle compatible with Android Gradle Plugin 8.7.3

Build a debug APK:

```bash
cd android
gradle :app:assembleDebug
```

If Android cannot find the SDK, create `android/local.properties`:

```properties
sdk.dir=/path/to/Android/Sdk
```

The APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Use a server address reachable from the Android device:

```text
http://192.168.1.100:4173
```

For the standard Android emulator, `10.0.2.2` points to the host machine:

```text
http://10.0.2.2:4173
```

See [android/README.md](android/README.md) for additional Android-specific details.

## API overview

Authenticated requests use the profile credentials in the `X-Profile-Id` and `X-Profile-Pin` headers.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/assets` | Read versioned public asset information |
| `GET` | `/api/profiles` | List public profile names |
| `POST` | `/api/login` | Create or open a profile |
| `GET` | `/api/state` | Read the authenticated profile state |
| `PUT` | `/api/state` | Update budget, theme, and profile state |
| `POST` | `/api/expenses` | Add an expense |
| `PUT` | `/api/expenses/:id` | Update an expense |
| `DELETE` | `/api/expenses/:id` | Delete an expense |
| `POST` | `/api/background` | Upload a profile background |

The server supports ETags, conditional reads, gzip responses, and minimal write responses.

## Project structure

```text
.
├── index.html              # Application markup
├── server.js               # Static server, API, authentication, and storage
├── assets/
│   ├── css/app.css         # Responsive theme and animations
│   └── js/app.js           # Frontend state and interactions
├── vendor/                 # Browser libraries served locally
├── android/                # Optional Android WebView client
├── data/                   # Generated profile database
└── uploads/                # Generated background uploads
```

## Security notes

This project is intended for personal use on a trusted device or local network.

- PINs are salted and hashed in the JSON database, but credentials are sent with API requests.
- The Android client allows cleartext HTTP for local-network servers.
- The built-in server does not provide TLS, rate limiting, account recovery, or production-grade session management.
- Do not expose it directly to the public internet. Use HTTPS and appropriate access controls through a trusted reverse proxy if remote access is required.
- Anyone with filesystem access to the server can read or replace its stored data.

## Development

Edit `index.html`, `assets/css/app.css`, or `assets/js/app.js`, then refresh the browser. JavaScript syntax can be checked with:

```bash
node --check assets/js/app.js
node --check server.js
```

Run the server on an alternate port while testing:

```bash
PORT=4174 node server.js
```

## License

No license file is currently included. Add a license before distributing or accepting external contributions.
