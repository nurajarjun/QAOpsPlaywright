const base = require('@playwright/test');
const defaultData = require('./placeorderTestData.json');

exports.customtest = base.test.extend({
  testDataForOrder: {
    username:    process.env.TEST_USERNAME    || defaultData[0].username,
    password:    process.env.TEST_PASSWORD    || defaultData[0].password,
    productName: process.env.TEST_PRODUCT     || defaultData[0].productName,
  }
});
