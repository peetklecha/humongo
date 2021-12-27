db.getCollection("things").aggregate([
	{ $set: {
		tag: { $cond: { if: { $gt: [{ $size: "$things" }, 5] }, then: "big", else: "small" } },
	} }
])
