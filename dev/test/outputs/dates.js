db.getCollection("orders").aggregate([
	{ $match: {
		purchase_date: { $and: [{ $lte: ISODate("2021-08-15") }, { $gt: ISODate("2021-08-07") }] },
	} }
])
