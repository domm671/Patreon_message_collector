[English](README_en.md) | [中文](README.md) 
---

# Patreon Message Collector

A Chrome browser extension for saving important messages and replies in Patreon community chat pages.

## Features

- Add save buttons next to Patreon chat messages and replies
- One-click save valuable chat messages and replies
- View, search, and manage saved messages
- Support custom sorting of saved messages
- Support one-click select all or batch selection
- Support exporting saved messages in JSON, plain text, or HTML format

## Installation Steps

1. Download or clone this repository

2. Open Chrome browser and visit `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked extension"

5. Select the extracted folder

6. Installation complete!

## Usage

1. Visit Patreon's community chat page (e.g., `https://www.patreon.com/community`)

2. When browsing chat messages, a "⭐ Save" button will appear next to each message and reply

3. Click this button to save/unsave the message (button changes to "★ Saved" when saved)

4. Click the extension icon in the browser toolbar to open the saved messages management interface

5. In the management interface, you can:
   - Search saved messages
   - Move messages up and down to adjust display order
   - Select multiple messages for batch operations
   - Delete unwanted saves
   - Export saved messages in multiple formats (JSON, plain text, or HTML)

## File Structure

- **content.js**: Content script, responsible for adding save buttons and handling save functionality in Patreon pages
- **content.css**: Stylesheet, defines save button and notification styles
- **popup.html**: HTML structure for the extension popup window
- **popup.js**: Logic script for the popup window, manages saved messages
- **manifest.json**: Extension manifest file, defines extension permissions and configuration
- **images/**: Folder containing extension icons

## Notes

- This extension only works on Patreon websites
- If Patreon changes its HTML structure, the extension may need to be updated
- Exported data only includes messages you manually saved
- It's recommended to regularly export saved messages for backup to prevent data loss

## Privacy Statement

This extension does not collect any personal data. All saved messages are stored only in your browser's local storage.
