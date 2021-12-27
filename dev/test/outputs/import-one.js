db.getCollection("users").aggregate([
	{ $lookup: { 
		from: "orders",
		localField: "orderIds",
		foreignField: "_id",
		as: "order",
	} },
	{ $set: {
		order: { $arrayElemAt: ["$order", 0] },
	} }
])
