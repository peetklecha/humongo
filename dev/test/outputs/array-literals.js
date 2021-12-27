db.getCollection("items").aggregate([
	{ $set: {
		list: [1, 2, "thing", { stuff: "junk" }],
	} }
])
