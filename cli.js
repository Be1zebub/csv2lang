const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")

const csvPath = process.argv[2]
if (!csvPath || !fs.existsSync(csvPath)) {
	console.error("Файл не найден")
	process.exit(1)
}

if (path.extname(csvPath).toLowerCase() !== ".csv") {
	console.error("Файл должен иметь расширение .csv")
	process.exit(1)
}

const langDir = path.join(__dirname, "lang")
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
let isFirstRow = true

fs.createReadStream(csvPath)
	.pipe(csv())
	.on("data", (data) => {
		if (isFirstRow) {
			if (!data._uid) {
				console.error('CSV должен содержать колонку "_uid"')
				process.exit(1)
			}
			if (Object.keys(data).length < 2) {
				console.error("CSV должен содержать хотя бы один язык")
				process.exit(1)
			}
			isFirstRow = false
		}

		if (!data._uid || data._uid.trim() === "") {
			console.error("Найдена пустая строка или строка без _uid")
			process.exit(1)
		}

		results.push(data)
		Object.keys(data).forEach((key) => key !== "_uid" && languages.add(key))
	})
	.on("end", () => {
		if (results.length === 0) {
			console.error("CSV файл пуст")
			process.exit(1)
		}

		languages.forEach((lang) => {
			const invalidRows = results.filter(
				(row) => !row[lang] || row[lang].trim() === ""
			)
			if (invalidRows.length > 0) {
				console.error(
					`Найдены пустые переводы для языка "${lang}":`,
					invalidRows.map((r) => r._uid).join(", ")
				)
				process.exit(1)
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

		console.log(`Успешно обработано ${results.length} строк(и)`)
		console.log(
			`Созданы файлы: ${Array.from(languages)
				.map((l) => l + ".lua")
				.join(", ")}`
		)
		setTimeout(() => process.exit(0), 3000)
	})
	.on("error", (error) => {
		console.error("Ошибка при чтении CSV:", error.message)
		process.exit(1)
	})
