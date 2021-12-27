db.getCollection("users").aggregate([
{ $lookup: { 
	from: "subscriptions",
	localField: "_id",
	foreignField: "customerId",
	as: "subs",
 } }

])
