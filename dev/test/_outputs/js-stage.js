db.getCollection("users").aggregate([
	{ $match:  {
		name: { $eq: "fred" },
	} },
{ $set: { tags: { $concat: ["$tags", ", checked"] } } },
{ $unwind: "$orders" }

])
