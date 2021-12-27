db.getCollection("users").aggregate([
	{ $match: {
		_id: { $eq: ObjectId("111111111111") },
	} }
])
