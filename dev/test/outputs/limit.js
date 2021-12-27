db.getCollection("users").aggregate([
	{ $limit: 1000 }
])
