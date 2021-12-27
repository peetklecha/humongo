db.getCollection("users").aggregate([
	{ $set: {
		name: "john",
		age: 47,
	} }
])
