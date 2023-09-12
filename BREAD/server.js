const fs = require("fs");
const readline = require("readline");

//const dataPath = path.join(_dirname, 'data', 'data.json')

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { get } = require("http");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(path.join(__dirname, "db", "data.db"));

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  //create router read
  const { page = 1, name, height, weight, startdate, enddate, married, radio_button } = req.query;

  const limit = 3;
  const offset = (page - 1) * 3;

  const queries = [];
  const params = [];

  const count = [];

  if (name) {
    queries.push(`name like '%' || ? || '%'`);
    params.push(name);
    count.push(name);
  }

  if (height) {
    queries.push(`height = ?`);
    params.push(height);
    count.push(height);
  }

  if (weight) {
    queries.push(`weight = ?`);
    params.push(weight);
    count.push(weight);
  }

  if (startdate && enddate) {
    queries.push(`birthdate between ? and ?`);
    params.push(startdate, enddate);
    count.push(startdate, enddate);
  } else if (startdate) {
    queries.push("birthdate >= ?");
    params.push(startdate);
    count.push(startdate);
  } else if (enddate) {
    queries.push("birthdate <= ?");
    params.push(enddate);
    count.push(enddate);
  }

  if (married) {
    queries.push(`married = ?`);
    params.push(married);
    count.push(married);
  }

  let sqlCount = "SELECT COUNT (*) AS total FROM data";
  let sql = "SELECT * FROM data";
  if (queries.length > 0) {
    sql += ` WHERE ${queries.join(` ${radio_button} `)}`;
    sqlCount += ` WHERE ${queries.join(` ${radio_button} `)}`;
  }

  sql += ` limit ? offset ?`;
  params.push(limit, offset);

  db.get(sqlCount, (err, data) => {
    const total = data.total;
    const pages = Math.ceil(total / limit);

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.log(err);
        res.send("Gagal dapat data");
      }
      res.render("list", { data: rows, query: req.query, page, pages, offset, url: req.url});
    });
  });
});

app.get("/add", (req, res) => {
  //create router add
  res.render("add");
});

app.post("/add", (req, res) => {
  db.run("INSERT INTO data (name,height,weight,birthdate,married) VALUES(?,?,?,?,?)", [req.body.name, req.body.height, req.body.weight, req.body.birthdate, req.body.married], (err) => {
    if (err) return res.send(err);
    else res.redirect("/");
  });
});

app.get("/delete/:index", (req, res) => {
  const index = req.params.index;
  db.run("DELETE FROM data WHERE id = ?", [index], (err) => {
    if (err) return res.send(err);
    else res.redirect("/");
  });
});

app.get("/edit/:index", (req, res) => {
  const index = req.params.index;
  const item = db.get("SELECT * FROM data WHERE id = ?", [index], (err, rows) => {
    if (err) return res.send(err);
    else res.render("edit", { item: rows });
  });
});

app.post("/edit/:index", (req, res) => {
  const dataBaru = [];
  const index = req.params.index;
  dataBaru[index] = {
    name: req.body.name,
    height: req.body.height,
    weight: req.body.weight,
    birthdate: req.body.birthdate,
    married: req.body.married,
  };
  db.run("UPDATE data SET name = ?, height = ?, weight = ?, birthdate = ?, married = ? WHERE id = ?", [req.body.name, req.body.height, req.body.weight, req.body.birthdate, req.body.married, index], (err, data) => {
    if (err) return res.send(err);
    else res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
