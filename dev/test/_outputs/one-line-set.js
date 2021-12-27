db.getCollection("users").aggregate([
	{ $set:  {
		name: "john",
	} }
])
