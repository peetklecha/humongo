db.getCollection("users").aggregate([
	{ $unwind: "$orders" }
])
