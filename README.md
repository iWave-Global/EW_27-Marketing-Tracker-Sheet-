# EW27 Marketing Tracker Dashboard (GitHub Pages)

This frontend uses the existing Google Sheet as its data source. It supports task search, status/section filters, task rename, status update, dashboard counts, and read-only target-date warnings.

## Setup
1. In the Google Sheet, open **Extensions → Apps Script**.
2. Replace the Apps Script editor with the contents of `Code.gs` in this folder and save.
3. Deploy → **New deployment** → type **Web app**.
4. Execute as **Me**. Access: **Anyone** (or a permitted organization setting). Authorize and deploy.
5. Copy the deployed URL ending in `/exec`.
6. In `app.js`, replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the copied URL, including `/exec`.
7. The Apps Script URL is already configured in `app.js`. If you redeploy Apps Script later, update this URL.
8. Upload `index.html`, `styles.css`, and `app.js` to the root of your GitHub repository.
9. In repository **Settings → Pages**, deploy from branch `main`, folder `/ (root)`.

## Important after edits
If you change Apps Script code after deploying, choose **Deploy → Manage deployments → Edit** and deploy a new version. Refresh GitHub Pages after updating `app.js`.

The dashboard uses JSONP to avoid common cross-origin fetch issues with Apps Script. Both listing and updates use GET requests. For private company data, do not use a public GitHub Pages site with an Apps Script deployment accessible to anyone; use company-approved access controls.

## Sheet structure expected
- Marketing Plan: columns A–E (Task in B, Owner in C, Target Date in D, Status in E)
- Activity: columns G–J (Task in G, Owner/reviewer in H, Target Date in I, Status in J)
- Sheet tab name configured as `Marketing Plan ` (trailing space). Verify this exact tab name in Apps Script if loading errors persist.


**Fix in this package:** Apps Script now matches the tab name ignoring accidental leading/trailing spaces and reports the available tab names if no match is found. Redeploy as a new version after replacing `Code.gs`.
