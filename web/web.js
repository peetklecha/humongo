const text = document.getElementById("humongo")
let state = text.value
text.addEventListener("change", e => {
	state = e.target.value
})

text.addEventListener("keydown", function (e) {
	if (e.key == "Tab") {
		e.preventDefault()
		const start = this.selectionStart
		const end = this.selectionEnd

		// set textarea value to: text before caret + tab + text after caret
		this.value =
			this.value.substring(0, start) + "  " + this.value.substring(end)

		// put caret at right position again
		this.selectionStart = this.selectionEnd = start + 2
	}
})

const mongo = document.getElementById("mongo")
const message = document.getElementById("output-header")

const button = document.getElementById("compile")
button.addEventListener("click", () => {
	const output = Humongo.run(state + "\n", true)
	mongo.innerText = output
	navigator.clipboard
		.writeText(output)
		.then(() => {
			message.innerText = "Mongo output -- copied to clipboard!"
		})
		.catch(() => {
			message.innerText = "Mongo output"
		})
})
