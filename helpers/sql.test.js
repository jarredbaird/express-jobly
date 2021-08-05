const { sqlForPartialUpdate } = require("./sql");

describe(`update (not create or overwrite) an entry from ANY table`, function () {
  test("throw BadRequestError if there are is no data", function () {
    const data = {};
    const jsToSql = {};
    const testing123 = () => {
      sqlForPartialUpdate(data, jsToSql);
    };
    expect(testing123).toThrowError("No data");
  });
});
