db.getCollection("users").aggregate([
	{ $group:  {
		_id: "$signup_date",
		count: { $sum: 1 },
		list: { $push: "$$ROOT" },
	} }
])
