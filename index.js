require("dotenv").config();

const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

// parse the body into JS Objects
app.use(express.json());

// Log the requests as they come in
app.use(require("morgan")("dev"));

// Create Flavors - C
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
        INSERT INTO flavors(txt)
        VALUES($1)
        RETURNING *
      `;
    const response = await client.query(SQL, [req.body.txt]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// Read Flavors - R
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
        SELECT * from flavors ORDER BY created_at DESC;
      `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

// Update Flavors - U
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE flavors
        SET txt=$1, ranking=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// Delete Flavors - D
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE from flavors
        WHERE id = $1
      `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// create and run the express app

const init = async () => {
  await client.connect();
  let SQL = /* sql */ `
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        is_favorite BOOLEAN DEFAULT FALSE,
        name VARCHAR(255) NOT NULL
      );
    `;
  await client.query(SQL);
  console.log("tables created");
  SQL = /* sql */ `
      INSERT INTO flavors(name, is_favorite) VALUES('chocolate', false);
      INSERT INTO flavors(name, is_favorite) VALUES('vanilla', true);
      INSERT INTO flavors(name, is_favorite) VALUES('strawberry', false);
    `;
  await client.query(SQL);
  console.log("data seeded");
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
