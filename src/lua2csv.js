const fs = require("fs")
const path = require("path")
const { TYPES } = require("./utils")

function unescapeLua(str) {
	return str
		.replace(/\\"/g, '"')
		.replace(/\\n/g, "\n")
		.replace(/\\r/g, "\r")
		.replace(/\\t/g, "\t")
		.replace(/\\v/g, "\v")
		.replace(/\\f/g, "\f")
		.replace(/\\0/g, "\0")
		.replace(/\\\\/g, "\\")
}

function parseLuaFile(filePath) {
	const content = fs.readFileSync(filePath, "utf8")
	const entries = []

	content.split("\n").forEach((line) => {
		// Parse lang:Add calls
		const addMatch = line.match(/lang:Add\("([^"]+)",\s*"([^"]+)"\)/)
		if (addMatch) {
			entries.push({
				type: TYPES.PHRASE,
				value: {
					uid: unescapeLua(addMatch[1]),
					phrase: unescapeLua(addMatch[2]),
				},
			})
			return
		}

		// Save each code line as separate entry
		entries.push({
			type: TYPES.CODE,
			value: line,
		})
	})

	return entries
}

function findDifferences(entries, referenceEntries) {
	const maxLength = Math.max(entries.length, referenceEntries.length)
	const diffs = []

	for (let i = 0; i < maxLength; i++) {
		const ref = referenceEntries[i]
		const cur = entries[i]

		if (!ref && cur) {
			diffs.push({
				type: "extra",
				index: i,
				value:
					cur.type === TYPES.CODE ? cur.value : `lang:Add for ${cur.value.uid}`,
			})
		} else if (ref && !cur) {
			diffs.push({
				type: "missing",
				index: i,
				value:
					ref.type === TYPES.CODE ? ref.value : `lang:Add for ${ref.value.uid}`,
			})
		}
	}

	return diffs
}

function convertLuaToCSV(inputDir) {
	const luaFiles = fs
		.readdirSync(inputDir)
		.filter((file) => file.endsWith(".lua"))
		.map((file) => ({
			lang: path.parse(file).name,
			path: path.join(inputDir, file),
		}))

	if (luaFiles.length === 0) {
		console.error("No .lua files found in the directory")
		return
	}

	// Parse all lua files
	const entriesByLang = {}
	luaFiles.forEach((file) => {
		entriesByLang[file.lang] = parseLuaFile(file.path)
	})

	// Verify that all files have the same structure
	const referenceEntries = entriesByLang[luaFiles[0].lang]
	const languages = Object.keys(entriesByLang)

	// Check that all files have same structure
	for (const [lang, entries] of Object.entries(entriesByLang)) {
		if (entries.length !== referenceEntries.length) {
			console.error(
				`Different number of entries in ${lang} (${entries.length}) compared to ${luaFiles[0].lang} (${referenceEntries.length})`
			)

			const diffs = findDifferences(entries, referenceEntries)
			console.error("\nDifferences found:")
			diffs.forEach((diff) => {
				if (diff.type === "extra") {
					console.error(`Extra entry in ${lang} at line ${diff.index + 1}:`)
					console.error(`  ${diff.value}`)
				} else {
					console.error(`Missing entry in ${lang} at line ${diff.index + 1}:`)
					console.error(`  ${diff.value}`)
				}
			})
			console.error("\nPlease fix these differences before converting to CSV")
			return
		}

		for (let i = 0; i < entries.length; i++) {
			const refEntry = referenceEntries[i]
			const entry = entries[i]

			if (refEntry.type !== entry.type) {
				console.error(
					`Structure mismatch at line ${i + 1}:\n` +
						`  ${luaFiles[0].lang}: ${
							refEntry.type === TYPES.CODE ? "code" : "translation"
						} (${
							refEntry.type === TYPES.CODE ? refEntry.value : refEntry.value.uid
						})\n` +
						`  ${lang}: ${
							entry.type === TYPES.CODE ? "code" : "translation"
						} (${entry.type === TYPES.CODE ? entry.value : entry.value.uid})`
				)
				return
			}

			if (
				refEntry.type === TYPES.PHRASE &&
				refEntry.value.uid !== entry.value.uid
			) {
				console.error(
					`UID mismatch at line ${i + 1}:\n` +
						`  ${luaFiles[0].lang}: ${refEntry.value.uid}\n` +
						`  ${lang}: ${entry.value.uid}`
				)
				return
			}
		}
	}

	// Generate CSV content
	const csvHeader = ["_uid", ...languages, "_extras"].join(",")

	const csvRows = referenceEntries.map((refEntry, i) => {
		if (refEntry.type === TYPES.CODE) {
			// For code rows
			return ["", ...languages.map(() => ""), `"${refEntry.value}"`].join(",")
		} else {
			// For translation rows
			return [
				`"${refEntry.value.uid}"`,
				...languages.map((lang) => `"${entriesByLang[lang][i].value.phrase}"`),
				"",
			].join(",")
		}
	})

	// Write CSV file
	const outputPath = path.join(path.dirname(inputDir), "output.csv")
	fs.writeFileSync(outputPath, [csvHeader, ...csvRows].join("\n"))

	console.log(
		`Successfully converted ${luaFiles.length} language file(s) to CSV`
	)
	console.log(`Output file: ${outputPath}`)
}

module.exports = {
	convertLuaToCSV,
}
