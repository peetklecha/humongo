db.getCollection("users").aggregate([
	{ $match:  {
		timestamp: { $and: [{ $lt: "2021-08-23" }, { $gt: "2021-08-15" }] },
	} },
{ $limit: 10000 }
,
	{ $set:  {
		checked: true,
	} }
])
