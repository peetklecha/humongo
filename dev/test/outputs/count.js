db.getCollection("users").aggregate([
	{ $match: {
		name: { $eq: "Fred" },
	} },
	{ $count: "count" }
])
