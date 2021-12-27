db.getCollection("users").aggregate([
	{ $match: { $expr: { $gt: [{ $size: "$orders" }, 10] } } },
	{ $match: { $expr: { $eq: ["$_id", "$codename"] } } }
])
