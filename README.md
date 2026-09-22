# 💸 Budget

![Budget logo](logo-small.webp)

A simple, self-hosted budget tracker for daily spending.

**No npm install. No build step. Just Node.js and a browser.**

> [!NOTE]
> This project is entirely vibe coded with GPT-5.5 and GPT-5.6 Sol. Support and bug fixes are not guaranteed.

## 👀 Preview

<table>
  <tr>
    <td align="center">
      <img src="docs/screenshots/quota.png" alt="Budget quota screen" width="420" />
      <br />
      <sub>Overview & quota</sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/activity.png" alt="Budget activity screen" width="420" />
      <br />
      <sub>Activity & heatmap</sub>
    </td>
  </tr>
</table>

## ✨ Features

- Daily quota and total budget tracking
- Expense history with a spending heatmap
- Auto rollover, budget splitting, and monthly resets
- Multiple local profiles with optional PINs
- Custom currencies and background themes
- Desktop, mobile, and optional Android wrapper

## 🚀 Quick start

Requires **Node.js 18+**.

```bash
git clone https://github.com/Rynowastaken/budget.git
cd budget
node server.js
```

Then open:

```text
http://localhost:4173
```

You can also download the repository as a ZIP if you do not use Git.

## 🧭 Basic use

### Create a profile

On first launch, leave **Saved profiles** on **New profile**, enter a name, optionally add a PIN, then log in.

### Set your budget

Open **Overview → Quota** to set:

- daily quota
- today's quota
- total amount
- currency
- auto rollover

Extra tools are inside **Advanced options**.

### Add expenses

Open **Activity**, choose a date, then press **+**.

On mobile, you can swipe between dates, swipe the heatmap between months, pinch to zoom, and swipe expenses to reveal actions.

### Change the background

Open the menu and choose **Upload**.

You can select a file, drag one in, or paste an image directly. Budget generates matching interface colors from it.

## 🌐 Use it on another device

Budget listens on port `4173` by default.

On another device on the same network, open the computer's local IP address, for example:

```text
http://192.168.1.100:4173
```

If it does not connect, check that the server is still running and your firewall allows port `4173`.

To use a different port:

```bash
PORT=8080 node server.js
```

## 💾 Data and backups

Budget stores profile and spending data in:

```text
data/finance-db.json
```

Uploaded backgrounds are stored in:

```text
uploads/
```

To make a backup, copy both locations somewhere safe.

> [!WARNING]
> These files can contain private financial information. Do not commit `data/` or `uploads/` to a public repository.

## 🤖 Android

The `android/` folder contains an optional WebView wrapper.

It still connects to a running Budget server. For full build instructions, see [android/README.md](android/README.md).

## 🔒 Security

Budget is intended mainly for personal use on a trusted device or local network.

The built-in server does not include production features such as HTTPS, rate limiting, or account recovery.

**Do not expose it directly to the public internet without proper HTTPS and access controls.**

## 🛠️ Development

Main files:

- `index.html` — page structure
- `assets/css/app.css` — styling
- `assets/js/app.js` — frontend behavior
- `server.js` — server, API, profiles, and storage

There is no frontend build step. Edit, save, and refresh.

Quick syntax check:

```bash
node --check assets/js/app.js
node --check server.js
```

## 📜 License

There is currently no license file in this repository.
