# Finance Manager Android Wrapper

This Android app wraps the existing Finance Manager server in a native WebView.

## Behavior

- On first launch, the app asks for the Finance Manager server address.
- The server address is saved in Android `SharedPreferences`.
- Future launches open the saved server automatically.
- Use the app menu item `Log out / Change server` to clear the saved address and return to setup.
- Plain HTTP LAN servers are allowed through `android:usesCleartextTraffic="true"`.

## Server URL examples

Use the server URL reachable from the Android device:

```text
http://192.168.0.95:4173
http://10.0.2.2:4173
```

`10.0.2.2` is useful from the Android emulator when the server is running on the host machine.

## Build

Install Android Studio or configure an Android SDK, then either open this `android/` folder in Android Studio or build from the terminal:

```bash
cd /home/ryno/Projects/finance-manager/android
gradle :app:assembleDebug
```

If Gradle reports `SDK location not found`, create `local.properties`:

```properties
sdk.dir=/path/to/Android/Sdk
```

The debug APK will be generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```
