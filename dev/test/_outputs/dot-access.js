db.getCollection("users").aggregate([
	{ $match:  {
		"order.0.id": { $eq: 1234567 },
	} }
])
