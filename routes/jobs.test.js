"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
  trackJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New",
    salary: 100,
    equity: "0.5",
    companyHandle: "c1",
  };

  test("401 for a non-admin user", async () => {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("ok for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { ...newJob, id: expect.any(Number) },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "job with no salary",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("returns 400 error if bad query parameter provided", async function () {
    // This should test that the jobQuery schema is working. The user should
    // not be able to provide non-existent query parameters in the url
    const resp = await request(app).get("/jobs?monkeyBooty=shakeShakeShake");
    expect(resp.statusCode).toEqual(400);
  });

  test("returns correct response with diff combos of query parameters", async function () {
    // You want to make sure that the user can provide different combinations of
    // query parameters to their request. Test it here!
    const resp1 = await request(app).get(
      "/jobs?minSalary=100000&maxSalary=100000"
    );
    const resp2 = await request(app).get("/jobs?title=j1&maxSalary=100000");
    const resp3 = await request(app).get("/jobs?minEquity=0.5");
    // resp4 help test case sensitive queries by looking for 'J1' instead of 'j1'
    const resp4 = await request(app).get("/jobs?title=J1");
    expect(resp1.body.jobs[0].title).toEqual("j1");
    expect(resp2.body.jobs[0].title).toEqual("j1");
    expect(resp3.body.jobs.length).toEqual(0);
    expect(resp4.body.jobs[0].title).toEqual("j1");
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${trackJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: trackJobIds[0],
        title: "j1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/10000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${trackJobIds[0]}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      job: {
        id: trackJobIds[0],
        title: "j1-new",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/${trackJobIds[0]}`).send({
      title: "j1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/100000`)
      .send({
        title: "non-existant unattainable job",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${trackJobIds[0]}`)
      .send({
        id: "j1-new",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${trackJobIds[0]}`)
      .send({
        equity: "not-equity-value",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${trackJobIds[0]}`)
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: `${trackJobIds[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/${trackJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/100000`)
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
