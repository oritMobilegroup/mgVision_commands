/* jshint esversion: 9 */

const user = require("./user");

const getSubsByName = (username) => {
  return new Promise((resolve, reject) => {
    user.find({ username: username })
      .then((users) => {
        if (users.length > 0) {
          resolve(users);
        } else {
          reject(new Error(`User with username '${username}' not found.`));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};
module.exports={getSubsByName};
