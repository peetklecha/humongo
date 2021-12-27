db.getCollection("users").aggregate([
	{ $set:  {
		first_order: { $arrayElemAt: ["$orders", 0] },
	} }
])
