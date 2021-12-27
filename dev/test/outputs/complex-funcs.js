db.getCollection("users").aggregate([
	{ $set: {
		pairs: { $zip: { inputs: ["$orders", "$transactions"], useLongestLength: true } },
	} }
])
