# Poker Night — iOS app (Capacitor)

Native iOS shell around the poker web app. The web code already detects the
native shell and points API + share links at the production worker.

## Build on your Mac (M2 Air)

1. **Install Xcode** from the Mac App Store (free, big download). Open it once
   to accept the license.
2. **Pull this repo**, then in `poker/`:
   ```sh
   npm install
   npx cap sync ios        # copies public/ into the native project
   ```
3. **CocoaPods** (first time only): `sudo gem install cocoapods`, then
   ```sh
   cd ios/App && pod install && cd ../..
   ```
4. **Open** `ios/App/App.xcworkspace` in Xcode (the workspace, not the project).
5. **Signing**: Xcode → Settings → Accounts → sign in with your Apple ID.
   Select the `App` target → Signing & Capabilities → Team → your Apple ID.
   - Free Apple ID: install on your own iPhone via cable (re-sign weekly).
   - Paid **Apple Developer Program** ($99/yr): TestFlight + App Store.
6. **Run**: plug in your iPhone, pick it as the destination, hit **Run** (⌘R).

## Ship updates

Web changes need a re-sync before they appear in the app:
```sh
npx cap sync ios   # then Run / Archive again in Xcode
```
The API always hits production, so game data is live regardless.

## TestFlight / App Store

1. Join the Apple Developer Program ($99/yr).
2. In Xcode: Product → Archive → Distribute App → App Store Connect.
3. In App Store Connect: create the app record (bundle ID
   `com.dinklytics.pokernight`), add screenshots + description, submit.
4. Review note: Apple sometimes rejects pure website wrappers (Guideline 4.2).
   If that happens, the fix is adding native integrations (e.g. the
   Capacitor Share plugin for the recap card, push notifications) — ask and
   we'll wire them in.

## Dev shortcut (not for the store)

To have the app load the **live** site instead of the bundled copy (instant
updates, no re-sync), set in `capacitor.config.json`:
```json
{ "server": { "url": "https://poker-tracker.dinklytics.workers.dev", "cleartext": false } }
```
then `npx cap sync ios`. Fine for personal use; don't ship this to the store.
