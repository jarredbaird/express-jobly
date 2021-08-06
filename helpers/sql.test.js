const { sqlForPartialUpdate } = require("./sql");

describe(`update (not create or overwrite) an entry from ANY table`, function () {
  test("throw BadRequestError if there is no data", function () {
    const data = {};
    const jsToSql = {};
    const testing123 = () => {
      sqlForPartialUpdate(data, jsToSql);
    };
    expect(testing123).toThrowError("No data");
  });
  test("Outputs setCols and values correctly", () => {
    const data = { numEmployees: 100 };
    const camel = { numEmployees: "num_employees" };
    const results = sqlForPartialUpdate(data, camel);
    const correct = {
      setCols: `"num_employees"=$1`,
      values: [100],
    };
    console.log("Function output ", results);
    console.log("Correct output: ", correct);
    expect(results).toEqual(correct);
  });
});
