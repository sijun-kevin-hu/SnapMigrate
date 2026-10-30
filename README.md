# SnapMigrate

SnapMigrate is a native iOS app that imports Snapchat Memories from a "My Data" ZIP file into Apple Photos while preserving original capture dates.

## Setup Instructions

1.  **Open Project**
    - Open `SnapMigrate/SnapMigrate.xcodeproj` in Xcode.

2.  **Add Source Files**
    - If the source groups are missing in Xcode (because I added files to the filesystem), right-click on the "SnapMigrate" group in Xcode Navigator -> "Add Files to 'SnapMigrate'..."
    - Select the `Models`, `Logic`, `ViewModels`, and `Views` folders.
    - Ensure **"Create groups"** is selected.
    - Select `SnapMigrate` as the target.

3.  **Configure Permissions**
    - Ensure `Info.plist` is properly configured with Photo Library Usage descriptions.
    - If needed, locate the `Info.plist` provided in `SnapMigrate/SnapMigrate/` and integrate its keys into the project settings or drag it into the project.

4.  **Frameworks & Dependencies**
    - **ZIPFoundation**: This project requires `ZIPFoundation` to handle ZIP files.
      - File -> Add Packages...
      - URL: `https://github.com/weichsel/ZIPFoundation`
      - Add to Target: `SnapMigrate`
    - Ensure `Photos` framework is linked.

5.  **Build and Run**
    - Connect your iPhone.
    - Run the app (Cmd+R).

## Troubleshooting

### Build Error: "Multiple commands produce Info.plist"

If you get this error during build:

1. Open **Xcode**.
2. Select the **SnapMigrate** project in the sidebar.
3. Select the **SnapMigrate** target.
4. Go to the **Build Phases** tab.
5. Expand **Copy Bundle Resources**.
6. Select `Info.plist` and click the **Minus (-)** button to remove it.
   - _Note: Xcode 13+ handles Info.plist automatically if it is in the target settings._

## Usage

1.  Export your data from Snapchat: Settings -> My Data -> Export.
2.  Save the ZIP file to your iPhone (Files app).
3.  Open **SnapMigrate**.
4.  Tap "Select ZIP File" and choose your `my_data.zip`.
5.  Wait for extraction and scanning.
6.  Review the range and item count.
7.  Tap "Start Import".
8.  Open Photos app -> Albums -> "Snapchat Memories" to see you imported media!

## Notes

- **Photo Library Access**: Uses `.readWrite` permission to ensure the "Snapchat Memories" album can be detected and updated without creating duplicates.
- **Privacy**: No data leaves the device. Processed locally.
