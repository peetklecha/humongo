db.getCollection("subscriptions").aggregate([
	{ $match: {
		name: { $eq: "john" },
	} }
])
