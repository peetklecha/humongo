db.getCollection("users").aggregate([
	{ $sort: {
		signup_date: 1,
		order_count: -1,
		tags: { $meta: "textScore" },
	} }
])
