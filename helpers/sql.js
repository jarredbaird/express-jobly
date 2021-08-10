const { BadRequestError } = require("../expressError");

/* This JUST helps to format a sql query. For use on ANY db table. 

Should throw a BadRequestError is there is no data. 

jsToSql is optional, but should be used in the case that the database uses different characters than your JS. 

dataToUpdate is a sub-set of any column of any table*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

function sqlForPartialQuery(dataToQuery, jsToSql) {
  const keys = Object.keys(dataToQuery);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => {
    if (colName === "minEmployees") {
      return `"num_employees">=$${idx + 1}`;
    } else if (colName === "maxEmployees") {
      return `"num_employees"<=$${idx + 1}`;
    } else if (colName === "minSalary") {
      return `"salary"<=$${idx + 1}`;
    } else if (colName === "maxSalary") {
      return `"salary"<=$${idx + 1}`;
    } else if (colName === "minEquity") {
      return `"equity"<=$${idx + 1}`;
    } else if (colName === "maxEquity") {
      return `"equity"<=$${idx + 1}`;
    } else {
      dataToQuery[colName] = `%${Object.values(dataToQuery)[idx]}%`;
      return `lower(${jsToSql[colName] || colName}) LIKE lower($${idx + 1})`;
    }
  });

  return {
    whereCols: cols.join(" AND "),
    values: Object.values(dataToQuery),
  };
}

module.exports = { sqlForPartialUpdate, sqlForPartialQuery };
