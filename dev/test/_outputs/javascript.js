db.getCollection("users").aggregate([
	{ $match:  {
		date: { $lt: moment().subtract(5, "days").toDate() },
	} }
])
