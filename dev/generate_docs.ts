import { html } from './dev_deps.ts';

const docs = {
	"Aggregation Stages": {
		"count": [
			{
				text: 'Default to labelling the field "count":',
				file: 'count'
			},
			{
				text: 'Specify the field name:',
				file: 'count-as-alias'
			}
		],
		"project": {
			text: "Fields that should be directly projected can be listed on one line separated by commas.",
			file: "project",
		},
		"set": [
			{
				text: "Tersely, on one line:",
				file: "one-line-set"
			},
			{
				text: "Or spread across multiple lines:",
				file: "multiline-set"
			}
		],
		"sortByCount": "count-by-group",
		"unwind": "unwind",
		"limit": "limit",
		"zzz": {
			text: "Use single-quotes to interpolate raw JavaScript (or anything else).",
			file: "js-stage",
			header: "Interpolate raw JavaScript"
		},
		"match": [
			{
				text: "Tersely, on one line:",
				file: "one-line-match"
			},
			{
				text: "Or spread across multiple lines:",
				file: "multiline-match"
			}
		],
		"lookup": [
			{
				text: "Called 'import' in Humongo:",
				file: "import-verbose"
			},
			{
				text: "Omitting the collection name will cause collection name to be the same as the new field name. Omitting the localField will cause the localField to be the same as the collection name. Omitting foreignField defaults to '_id'.",
				file: "import-compact"
			},
			{
				text: "To import a single element, use 'import one'.",
				file: "import-one"
			}
		],
		"group": "group"
	},
	"Expressions": {
		"Array and object literals": [
			{
				text: "Array and object literals work like you expect.",
				file: "array-literals"
			},
			{
				text: "",
				file: "object-literals"
			}
		],
		"Type conversion": {
			text: "Use `as` to convert to different types (as well as Upper and Lower case).",
			file: "cast"
		},
		"Conditionals": {
			text: "Use C-style ternary syntax for conditional expressions.",
			file: "conditional"
		},
		"Dates": {
			text: "Date literals consist of @@ followed by a date in ISO format.",
			file: "dates"
		},
		"Functions": {
			text: "Most operators are verbatim from MongoDB, using standard function invocation notation. Note that 'all' and 'any' alias 'allElementsTrue' and 'anyElementTrue'. And some operators that require an extra array wrapping do not require it in Humongo.",
			file: "funcs"
		},
		"Operators": {
			text: "Most operators (+, -, <) work like you'd expect. Note that '@' aliases Mongo's '$in' (both in query operations and expressions)",
			file: "in"
		},
		"Array Element Access": {
			text: "Use C-style array element access.",
			file: "item-access"
		},
		"Interpolating JavaScript": {
			text: "Use single quotes to interpolate JavaScript in the place of any valid expression.",
			file: "javascript"
		},
		"Complex Operators": {
			text: "For MongoDB operators that require a spec object, simply pass the object using function notation.",
			file: "map"
		},
		"ObjectIDs": {
			text: "ObjectID literals begin with '#' followed by 12 hexadecimal digits",
			file: "objectids"
		}
	}
}

let overall = html`
<!DOCTYPE html>
<html>
	<head>
		<title>Humongo</title>
		<link rel="stylesheet" href="index.css" />
		<script src="bundle.js" defer></script>
		<script src="web.js" defer></script>
	</head>
	<body>
		<div class="header">
			<h1 id="main-banner">Humongo</h1>
			<h3 id="main-subtitle">Mongo for humans</h3>
		</div>
		<div class="nav">
			<!-- <a href="/">Try it out</a>
			<a href="/docs">Docs</a> -->
		</div>
		<p>Humongo is a little language for writing <a href="https://docs.mongodb.com/manual/aggregation/">MongoDB aggregation queries</a> a little more tersely. Not every Mongo feature is supported, but keep in mind that it is possible to write raw queries and interpolate them with Humongo. Scroll down for docs.<br /><br />Write your query here to compile to JS: </p>
		<textarea id="humongo">aggregate orders:
	match purchase_date > @@2021-08-15, < @@2021-08-23
	set line_item_ids = map({ input: line_items, in: $$this.product_id })
	import products using line_item_ids
	set label = size(line_items) < 6 ? "small" : (size(line_items) >= 12 ? "large" : "medium")
	project line_item_ids, label, tags, customer_id
		</textarea>
		<button id="compile">Compile</button>
		<h4 id="output-header">Mongo output</h4>
		<div id="mongo">db.getCollection("orders").aggregate([
  { $match: {
    purchase_date: { $gt: ISODate("2021-08-15"), $lt: ISODate("2021-08-23") }] },
  } },
  { $set:  {
    line_item_ids: { $map: { input: "$line_items", in: "$$this.product_id" } },
  } },
  { $lookup: {
    from: "products",
    localField: "line_item_ids",
    foreignField: "_id",
    as: "products",
  } },
  { $set: {
    label: { $cond: {
      if: { $lt: [{ $size: "$line_items" }, 6] },
      then: "small", else: { $cond: {
        if: { $gte: [{ $size: "$line_items" }, 12] },
        then: "large",
        else: "medium"
      } }
    } },
  } },
   { $project: {
    line_item_ids: true,
    label: true,
    tags: true,
    customer_id: true,
  } }
])</div>
		<hr />
		<h1>Docs</h1>
`;

for (const [h1, body] of Object.entries(docs)) {
	let docSection = `<h1>${h1}</h1>\n\<div class="doc-section">\n`
	const subsections =  Object.entries(body);
	subsections.sort(([keyA],[keyB]) => keyA < keyB ? -1 : 1 );
	for (let [h2, body2] of subsections) {
		if (h1 === "Aggregation Stages") h2 = "$" + h2;
		let docSubsection = ''
		if (typeof body2 === 'string') docSubsection += getFilePair(body2);
		else if (Array.isArray(body2)) docSubsection += body2.map(fromObject).join('\n<br />')
		else {
			docSubsection += fromObject(body2);
			if ("header" in body2) h2 = body2.header;
		}
		docSubsection += '\t</div>';
		const docSubsectionHeader = `\t<h2>${h2}</h2>\n<div class="doc-subsection">\n`
		docSection +=docSubsectionHeader + docSubsection;
	}
	docSection += "</div>";
	overall += docSection;
}

overall += '\n</body></html>'

Deno.writeTextFileSync('./web/index.html', overall);

function fromObject({ text, file }: { text: string, file: string }) {
	return `<p>${text}</p>
${getFilePair(file)}
`
}

function getFilePair(filename: string) {
	const input = Deno.readTextFileSync(`./dev/test/inputs/${filename}.bmql`)
	const output = Deno.readTextFileSync(`./dev/test/outputs/${filename}.js`)
	return `
	<h4>Humongo input</h4>
	<div class="humongo-example">
${input}
	</div>
	<h4>JS/Mongo query language output</h4>
	<div class="mongo-example">
${output}
	</div>`
}

// for (const file of Deno.readDirSync('./dev/test/inputs')) {
// 	const name = file.name.slice(0, -5)
// 	console.group(`checking ${name}`)
// 	if (existsSync(`./dev/test/outputs/${name}.js`)) {
// 		console.log('found js output.')
		// const input = Deno.readTextFileSync(`./dev/test/inputs/${file.name}`)
		// const output = Deno.readTextFileSync(`./dev/test/outputs/${name}.js`)
// 		console.log(`input file ${input.length} chars; output file ${output.length}`)
// 		const html = `
// 		<h3>${name.split('-').join(' ')}</h3>
// 			<h4>Humongo input</h4>
// 			<div class="humongo-example">
// ${input}
// 			</div>
// 			<h4>JS/Mongo query language output</h4>
// 			<div class="mongo-example">
// ${output}
// 			</div>
// 			<br /><br />
// 		`
// 		overall += html;
// 	}
// 	console.groupEnd();
// }

