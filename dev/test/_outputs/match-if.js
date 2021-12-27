db.getCollection("users").aggregate([
{ $match: { $expr: { $gt: [{ $size: "$orders" }, 10] } } }

])
