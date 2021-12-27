db.getCollection("users").aggregate([
	{ $match: {
		name: { $in: ["john", "fred", "george"] },
	} }
])
