db.getCollection("users").aggregate([
	{ $project:  {
		orders: { $map: { input: "$orders", in: "$$this.id" } },
	} }
])
