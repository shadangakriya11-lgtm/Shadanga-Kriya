# Supporting Scripts for Cloudflare R2 Integration

This directory contains utility scripts used to configure and debug the Cloudflare R2 storage integration.

## Prerequisites
These scripts require the following environment variables to be set in `backend/.env`:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_AUDIOS` (Target bucket name)

## Scripts

### 1. `configure-r2-cors.js`
**Purpose:** Configures the Cross-Origin Resource Sharing (CORS) policy for the R2 bucket.
**Usage:** `node supporting-scripts/configure-r2-cors.js`
**Why:** Required for mobile apps (APK) and web browsers to download or play files directly from R2 via fetch/XHR. It allows all origins (`*`) and standard methods (`GET`, `HEAD`, etc.).

### 2. `create-r2-bucket.js`
**Purpose:** Programmatically creates a new R2 bucket.
**Usage:** `node supporting-scripts/create-r2-bucket.js`
**Why:** Use this if setting up the project in a new environment where the bucket does not exist yet.

### 3. `list-r2-buckets.js`
**Purpose:** Lists all R2 buckets available to the account.
**Usage:** `node supporting-scripts/list-r2-buckets.js`
**Why:** Useful for verifying credentials and checking if a bucket exists.

### 4. `debug-r2-upload.js`
**Purpose:** Tests the entire upload flow by uploading a dummy text file to R2.
**Usage:** `node supporting-scripts/debug-r2-upload.js`
**Why:** Use this to verify that `PUT` permissions are correct and to see the raw URL returned by R2.

## Note
These scripts are standalone and are not required for the main application to run, but are helpful for DevOps and troubleshooting.
