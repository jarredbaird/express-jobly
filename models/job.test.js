"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  trackJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New",
    salary: 100,
    equity: "0.5",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);

    expect(job).toEqual({
      ...newJob,
      id: expect.any(Number),
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: trackJobIds[0],
        title: "j1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: trackJobIds[1],
        title: "j2",
        salary: 200000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: trackJobIds[2],
        title: "j3",
        salary: 300000,
        equity: "0.3",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(trackJobIds[0]);
    expect(job).toEqual({
      id: trackJobIds[0],
      title: "j1",
      salary: 100000,
      equity: "0.1",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(100000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 999,
    equity: "0.999",
    companyHandle: "c3",
  };

  test("works", async function () {
    let job = await Job.update(trackJobIds[0], updateData);
    expect(job).toEqual({
      id: trackJobIds[0],
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [trackJobIds[0]]
    );
    expect(result.rows).toEqual([
      {
        id: trackJobIds[0],
        title: "New",
        salary: 999,
        equity: "0.999",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
      companyHandle: "c3",
    };

    let job = await Job.update(trackJobIds[0], updateDataSetNulls);
    expect(job).toEqual({
      id: trackJobIds[0],
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [trackJobIds[0]]
    );
    expect(result.rows).toEqual([
      {
        id: trackJobIds[0],
        title: "New",
        salary: null,
        equity: null,
        companyHandle: "c3",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(10000, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(trackJobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(trackJobIds[0]);
    const res = await db.query(`SELECT id FROM jobs WHERE id=$1`, [
      trackJobIds[0],
    ]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(100000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
