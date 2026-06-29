# Facebook Auto-Poster Agent — Complete Setup Guide

## What This Does
Searches for trending actress/film news daily, uses AI to write an engaging post, and publishes it to your Facebook Page automatically.

---

## Step 1: Create Your Facebook Page

1. Go to https://www.facebook.com/pages/create
2. Choose a name (e.g. "Cinema Buzz Daily" / "Hollywood Spotlight" / "StarWatch")
3. Add a profile photo and cover image
4. Publish the page

---

## Step 2: Create a Meta Developer App

1. Go to https://developers.facebook.com
2. Click **My Apps → Create App**
3. Choose **Business** as the app type
4. Enter an app name (e.g. "Auto Poster") and your email
5. Click **Create App**

---

## Step 3: Get Your Page Access Token

### 3a — Find Your Page ID
1. Go to your Facebook Page
2. Look at the URL: `facebook.com/profile.php?id=123456789` — the number is your Page ID
3. Or go to **Page Settings → Page Info** — find "Page ID"
4. Save this as `FB_PAGE_ID`

### 3b — Generate Token via Graph API Explorer
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your **app** (top-right dropdown, choose "Auto Poster")
3. Select **User Token** → click **Generate Access Token**
4. In the permissions popup, add these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Click **Generate Access Token** again and approve
6. Now switch from **User Token** to **Page Token** (click "User or Page" → select your Page)
7. Copy the token that appears — this is your **Page Access Token**

### 3c — Make the Token Permanent
1. Go to https://developers.facebook.com/tools/debug/accesstoken/
2. Paste your token and click **Debug**
3. Click **Extend Token** at the bottom
4. You'll see "Expires: Never" — this token is now permanent
5. Save this as `FB_ACCESS_TOKEN`

---

## Step 4: Add Secrets to GitHub

1. Go to your repo → **Settings → Secrets and variables → Actions**
2. Add these **3 secrets**:

| Name | Value |
|---|---|
| `GROQ_API_KEY` | `gsk_...` (your existing key) |
| `FB_PAGE_ID` | Your Facebook Page ID number |
| `FB_ACCESS_TOKEN` | Your permanent page access token |

---

## Step 5: Run It

### Test manually:
Go to **Actions → Facebook Auto-Poster → Run workflow**

### Auto-schedule:
Already set to post **daily at 10:00 UTC** (3:30 PM Sri Lanka time).

---

## Customize It

- **Change posting time** — edit `fb-agent.yml`, change the `cron` line
- **Add more topics** — edit `SEARCH_TOPICS` in `fb_agent.py`
- **Change tone** — edit the `SYSTEM_PROMPT` in `fb_agent.py`
