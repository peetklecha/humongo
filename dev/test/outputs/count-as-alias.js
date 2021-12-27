db.getCollection("users").aggregate([
	{ $count: "user_count" }
])
