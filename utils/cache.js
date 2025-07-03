const redisClient = require("../config/redisClient");
const clearBooksPaginationCache = async () => {
  const keys = await redisClient.keys("books:page=*:limit=*:keyword=*");
  if (keys.length > 0) {
    await redisClient.del(keys);
    console.log("Cleared pagination cache keys:", keys);
  }
};

module.exports = {
  clearBooksPaginationCache,
};
