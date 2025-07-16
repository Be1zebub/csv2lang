const fs = require("fs")
const path = require("path")
const { pauseAndExit } = require("./src/utils")
const { convertCSVToLua } = require("./src/csv2lua")
const { convertLuaToCSV } = require("./src/lua2csv")

// For regular errors
process.on("uncaughtException", (err) => {
	console.error("Unexpected error:", err)
	pauseAndExit(1)
})

// For promise errors
process.on("unhandledRejection", (err) => {
	console.error("Unexpected async error:", err)
	pauseAndExit(1)
})

// Get the input path from command line or drag & drop
const inputPath = process.argv[2] || process.argv[1]
if (!inputPath || !fs.existsSync(inputPath)) {
	console.error("File or directory not found")
	pauseAndExit(1)
}

// Check if input is a directory (for lua2csv conversion)
const isDirectory = fs.lstatSync(inputPath).isDirectory()

try {
	if (isDirectory) {
		console.log("Converting Lua files to CSV...")
		convertLuaToCSV(inputPath)
		pauseAndExit(0)
	} else if (path.extname(inputPath).toLowerCase() === ".csv") {
		console.log("Converting CSV to Lua files...")
		convertCSVToLua(inputPath)
			.then(() => {
				console.log("Done!")
				pauseAndExit(0)
			})
			.catch((error) => {
				console.error("CSV conversion error:", error)
				pauseAndExit(1)
			})
	} else {
		console.error(
			"Input should be either a .csv file or a directory containing .lua files"
		)
		pauseAndExit(1)
	}
} catch (error) {
	console.error("Error:", error)
	pauseAndExit(1)
}
