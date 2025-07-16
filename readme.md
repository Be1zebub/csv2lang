# 🌍 CSV2Lang Converter

This is a simple CSV to Lua converter for this [awesome localization library](https://github.com/Be1zebub/Small-GLua-Things/blob/master/libs/lang.lua).

The main thing here - it's a super quick way to add translations to your Garry's Mod addons.  
No more manual translation work - just throw everything into Google Sheets, export to CSV, convert it, and boom - you've got your Lua files!

![preview](preview.png)

## 🚀 How to Use

1. Grab the latest `csv2lang.exe` from the [releases page](https://github.com/Be1zebub/csv2lang/releases)
2. You can:
   - Convert CSV to Lua: Just drop your CSV file onto the exe
   - Convert Lua to CSV: Drop a folder with `.lua` files onto the exe
3. Done! You'll find:
   - For CSV input: a `result_{filename}` folder with Lua files
   - For Lua input: an `output.csv` file next to the folder

- for [lang lib api]((https://github.com/Be1zebub/Small-GLua-Things/blob/master/libs/lang.lua)), read source - its pretty short & simple lib

## 📝 CSV File Requirements

Nothing fancy here:

- Need a `_uid` column for unique IDs
- At least one language column
- All rows with `_uid` must have translations (no empty cells)
- (Optional) `_extras` column for Lua code blocks

Here's what your CSV should look like:

```csv
_uid,en,ru,_extras
,,,"local lang = MyAddon.lang"
HELLO,"Hello world","Привет мир",
GOODBYE,"Goodbye","До свидания",
,,,"print("HELLO = ", lang:Get("HELLO"))"
```

Code blocks are rows where:

- `_uid` is empty
- `_extras` contains Lua code

🔥 **Pro tips:**

- Use Google Sheets for easy translation management on any device with web browser. [Check out this example](https://docs.google.com/spreadsheets/d/116h6fBrIeBlMfUOVRkacwtrYKDhN-D8oBUROAhks7HE/)
- When converting Lua to CSV, make sure all your language files have the same structure (same number of translations and code blocks)
- Use code blocks in `_extras` for:
  - Comments and section headers
  - Custom Lua code that runs between translations
  - File initialization and cleanup code

## 💻 For Developers

### What you'll need

- Node.js 16+ (older versions not tested)
- npm (comes with Node.js)

### Setup

```bash
npm install  # gets all the needed packages
```

### Build

```bash
npm run build  # creates the exe in the dist folder
```

## 🤔 FAQ

**Q:** Why CSV?  
**A:** CSV is simple and universal. Every spreadsheet app out there (Excel, Google Sheets, LibreOffice) can handle it.

**Q:** How do I export from Google Sheets?  
**A:** File -> Download -> Comma Separated Values (.csv)

**Q:** Getting errors?  
**A:** Check these things:

1. Your CSV has the `_uid` column
2. All translations are filled in
3. File is saved in UTF-8 encoding

## 🤝 Contributing

Found a bug? Got an idea for improvement? Create an issue or send a pull request!

## 📜 License

ISC - do whatever you want, just remember to credit the author 😉
