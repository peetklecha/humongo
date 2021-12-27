db.getCollection("subscriptions").aggregate([
	{ $match: {
		name: { $eq: "john" },
		timestamp: { $and: [{ $lt: "2021-08-23" }, { $gt: "2021-08-15" }] },
	} }
])
