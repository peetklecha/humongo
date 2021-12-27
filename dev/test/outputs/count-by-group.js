db.getCollection("users").aggregate([
	{ $sortByCount: { $size: "$orders" } }
])
