const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")
const {
	escapeLua,
	pauseAndExit,
	ensureDirectoryExists,
	TYPES,
} = require("./utils")

function validateCSVHeaders(headers) {
	// Check required columns
	if (!headers.includes("_uid")) {
		console.error('CSV should contain "_uid" column')
		pauseAndExit(1)
	}

	// Get language columns (all except service ones)
	const languageColumns = headers.filter((h) => !h.startsWith("_"))
	if (languageColumns.length === 0) {
		console.error("CSV should contain at least one language column")
		pauseAndExit(1)
	}

	return languageColumns
}

function parseCSVRow(data, rowIndex) {
	// If row has _extras and empty _uid - it's code
	if (data._extras !== undefined && data._uid === "") {
		return {
			type: TYPES.CODE,
			value: data._extras,
		}
	}

	// Check _uid for phrases
	if (!data._uid || data._uid.trim() === "") {
		console.error(
			`Found invalid row #${rowIndex} (translation row without _uid)`
		)
		pauseAndExit(1)
	}

	// Return base phrase structure, translations will be added later
	return {
		type: TYPES.PHRASE,
		value: {
			uid: data._uid,
			translations: data, // Save all translations
		},
	}
}

function validateLanguageData(results, lang) {
	const invalidRows = results.filter(
		(row) =>
			row.type === TYPES.PHRASE &&
			(!row.value.translations[lang] ||
				row.value.translations[lang].trim() === "")
	)
	if (invalidRows.length > 0) {
		console.error(
			`Found empty translations for language "${lang}":`,
			invalidRows.map((r) => r.value.uid).join(", ")
		)
		pauseAndExit(1)
	}
}

function generateLuaContent(results, lang) {
	let content = []

	results.forEach((row) => {
		if (row.type === TYPES.CODE) {
			content.push(row.value)
		} else {
			content.push(
				`lang:Add("${escapeLua(row.value.uid)}", "${escapeLua(
					row.value.translations[lang]
				)}")`
			)
		}
	})

	return content.join("\n")
}

function convertCSVToLua(csvPath) {
	const csvPath2 = path.parse(csvPath)
	const langDir = path.join(csvPath2.dir, `result_${csvPath2.name}`)
	ensureDirectoryExists(langDir)

	const results = []
	let languages = null
	let rowIndex = 0

	return new Promise((resolve, reject) => {
		fs.createReadStream(csvPath)
			.pipe(csv())
			.on("headers", (headers) => {
				// Validate headers and get languages list
				languages = validateCSVHeaders(headers)
			})
			.on("data", (data) => {
				rowIndex++
				results.push(parseCSVRow(data, rowIndex))
			})
			.on("end", () => {
				if (results.length === 0) {
					console.error("CSV file is empty")
					pauseAndExit(1)
				}

				languages.forEach((lang) => {
					validateLanguageData(results, lang)
					const luaContent = generateLuaContent(results, lang)
					fs.writeFileSync(path.join(langDir, `${lang}.lua`), luaContent)
				})

				console.log(`Successfully processed ${results.length} row(s)`)
				console.log(
					`Created files: ${languages.map((l) => l + ".lua").join(", ")}`
				)
				resolve()
			})
			.on("error", (error) => {
				console.error("Error reading CSV:", error.message)
				reject(error)
			})
	})
}

module.exports = {
	convertCSVToLua,
}
