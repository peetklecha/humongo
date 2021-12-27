db.getCollection("things").aggregate([
	{ $set: {
		xyz: { $cos: "$abc" },
		abc: { $split: ["$name", ","] },
		def: { $allElementsTrue: ["$one", "$two", "$three", "$four"] },
	} }
])
