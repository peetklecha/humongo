db.getCollection("users").aggregate([
	{ $project:  {
		age: true,
		birth_date: true,
		name: "$last_name",
		address: "$street_address_1",
	} }
])
