# Publishing AI RoboPet on Google Play

The Android app is a Trusted Web Activity (TWA): a thin Android shell that opens the hosted
web app full screen in Chrome. You don't need to maintain any native code. App updates ship
by deploying the website; you only upload a new Android build to change the icon, name or
version.

## Before you start

- Host the app (`npm run build && npm start`) on HTTPS at a stable domain, for example Cloud Run
  with a custom domain. The server must stay up because it holds `GEMINI_API_KEY`.
- Pick the package name. `android/twa-manifest.json` and `public/.well-known/assetlinks.json` use
  `com.psychemulation.robopet`. **You can't change it after the first upload to Play.**
- Replace `REPLACE_WITH_SUPPORT_EMAIL` in `public/privacy.html` and
  `public/delete-account.html` with a real support address.

## Build the Android app

```bash
npm i -g @bubblewrap/cli
cd android
# Replace REPLACE_WITH_YOUR_DOMAIN in twa-manifest.json first
bubblewrap update      # generates the Android project from twa-manifest.json
bubblewrap build       # creates app-release-bundle.aab, and android.keystore on first run
```

Keep `android.keystore` and its passwords safe and out of git (it is in `.gitignore`). With Play
App Signing it is only your upload key, and Google can reset it if it's lost.

## Link the app to the site (Digital Asset Links)

1. Upload the `.aab` to a closed testing track in Play Console.
2. Open **Setup > App signing** and copy the **App signing key certificate** SHA-256 fingerprint.
3. Put it in `public/.well-known/assetlinks.json` in place of the placeholder, then deploy.
4. Check that `https://YOUR_DOMAIN/.well-known/assetlinks.json` returns the file.

If the fingerprint is wrong, the app still opens but shows a Chrome address bar.

## Play Console checklist

- **Privacy policy URL:** `https://YOUR_DOMAIN/privacy.html`
- **Data safety > account deletion URL:** `https://YOUR_DOMAIN/delete-account.html`
  (in-app deletion is under profile > Delete account)
- **Data safety:** declare name, email and user ID (account management), user content (community
  posts and photos) and app interactions sent to the AI feature. None of it is sold or used for ads.
- **App content > AI-generated content:** users can report AI output with the flag button on the
  LLM brain, code generator and concept image results.
- **User-generated content:** users can report showcase projects and community posts. Reports
  go to the `reports` collection in Firestore; review them in the Firebase console.
- **Closed testing:** new personal developer accounts need at least 12 testers opted in for
  14 days before you can apply for production.
- **Payments:** the PayPal "support the creator" section may count as in-app payment for digital
  goods under Play policy. Consider hiding it in the Android build or switching to Play Billing.

## Deploy the Firestore rules

The `reports` collection needs the updated rules:

```bash
firebase deploy --only firestore:rules
```
