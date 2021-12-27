db.getCollection("users").aggregate([
	{ $set:  {
		order: { dog: "fido", cat: "snuffles" },
	} }
])
