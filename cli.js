const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")

function pauseAndExit(code = 0) {
	process.stdout.write("Press any key to exit...\n")
	process.stdin.setRawMode(true)
	process.stdin.resume()

	const buffer = Buffer.alloc(1)
	fs.readSync(process.stdin.fd, buffer, 0, 1, null)

	process.stdin.setRawMode(false)
	process.stdin.pause()
	process.exit(code)
}

// Get the CSV file path from command line or drag & drop
const csvPath = process.argv[2] || process.argv[1]
if (!csvPath || !fs.existsSync(csvPath)) {
	console.error("File not found")
	pauseAndExit(1)
}

if (path.extname(csvPath).toLowerCase() !== ".csv") {
	console.error("File should have .csv extension")
	pauseAndExit(1)
}

const csvPath2 = path.parse(csvPath)
const langDir = path.join(csvPath2.dir, `result_${csvPath2.name}`)
if (fs.existsSync(langDir)) {
	fs.readdirSync(langDir).forEach((file) =>
		fs.unlinkSync(path.join(langDir, file))
	)
} else {
	fs.mkdirSync(langDir)
}

const escapeLua = (str) =>
	str
		.replace(/[\\]/g, "\\\\")
		.replace(/["]/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/\t/g, "\\t")
		.replace(/\v/g, "\\v")
		.replace(/\f/g, "\\f")
		.replace(/\0/g, "\\0")

const results = []
const languages = new Set()
let rowIndex = 0

fs.createReadStream(csvPath)
	.pipe(csv())
	.on("data", (data) => {
		rowIndex++

		if (rowIndex === 1) {
			if (!data._uid) {
				console.error('CSV should contain "_uid" column')
				pauseAndExit(1)
			}
			if (Object.keys(data).length < 2) {
				console.error("CSV should contain at least one language")
				pauseAndExit(1)
			}
		}

		if (!data._uid || data._uid.trim() === "") {
			console.error(
				`Found invalid row #${rowIndex} (without _uid or empty localization)`
			)
			pauseAndExit(1)
		}

		results.push(data)
		Object.keys(data).forEach((key) => key !== "_uid" && languages.add(key))
	})
	.on("end", () => {
		if (results.length === 0) {
			console.error("CSV file is empty")
			pauseAndExit(1)
		}

		languages.forEach((lang) => {
			const invalidRows = results.filter(
				(row) => !row[lang] || row[lang].trim() === ""
			)
			if (invalidRows.length > 0) {
				console.error(
					`Found empty translations for language "${lang}":`,
					invalidRows.map((r) => r._uid).join(", ")
				)
				pauseAndExit(1)
			}

			fs.writeFileSync(
				path.join(langDir, `${lang}.lua`),
				results
					.map(
						(row) =>
							`lang:Add("${escapeLua(row._uid)}", "${escapeLua(row[lang])}")`
					)
					.join("\n")
			)
		})

		console.log(`Successfully processed ${results.length} row(s)`)
		console.log(
			`Created files: ${Array.from(languages)
				.map((l) => l + ".lua")
				.join(", ")}`
		)
		pauseAndExit(0)
	})
	.on("error", (error) => {
		console.error("Error reading CSV:", error.message)
		pauseAndExit(1)
	})
