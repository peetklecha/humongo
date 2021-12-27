db.getCollection("users").aggregate([
{ $lookup: { 
	from: "subscriptions",
	localField: "subscriptions",
	foreignField: "_id",
	as: "subscriptions",
 } }

])
