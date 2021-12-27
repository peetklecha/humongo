db.getCollection("users").aggregate([
	{ $set:  {
		price: { $toDecimal: "$cost" },
	} }
])
