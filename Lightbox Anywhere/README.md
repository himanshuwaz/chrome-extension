
# Lightbox Anywhere (Chrome MV3)

A tiny Chrome extension that injects a keyboard-friendly lightbox into the current tab. Click the extension, then click any image on the page. Use ←/→ to navigate, Esc to close.

## Install (Developer Mode)
1. Open `chrome://extensions`.
2. Toggle **Developer mode** on.
3. Click **Load unpacked** and select this folder.
4. Pin the extension and click **Enable on this page** from the popup.

This extension uses Manifest V3 with `chrome.scripting` and `activeTab` to inject code only after a user gesture.
