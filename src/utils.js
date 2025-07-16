const fs = require("fs")
const path = require("path")

const TYPES = Object.freeze({
	CODE: 0,
	PHRASE: 1,
})

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

function escapeLua(str) {
	return str
		.replace(/[\\]/g, "\\\\")
		.replace(/["]/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/\t/g, "\\t")
		.replace(/\v/g, "\\v")
		.replace(/\f/g, "\\f")
		.replace(/\0/g, "\\0")
}

function ensureDirectoryExists(dir) {
	if (fs.existsSync(dir)) {
		fs.readdirSync(dir).forEach((file) => fs.unlinkSync(path.join(dir, file)))
	} else {
		fs.mkdirSync(dir)
	}
}

function extractExtras(results) {
	// Находим первую и последнюю строки с extras
	const beforeCode = results.find((row) => row._extras)?.value || ""
	const afterCode = results.reverse().find((row) => row._extras)?.value || ""
	results.reverse() // Возвращаем массив в исходное состояние

	return { beforeCode, afterCode }
}

module.exports = {
	pauseAndExit,
	escapeLua,
	ensureDirectoryExists,
	extractExtras,
	TYPES,
}
