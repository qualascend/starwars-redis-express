const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 3000;

const REDIS_PORT = process.env.REDIS_PORT || 6379;
const client = redis.createClient(REDIS_PORT);

const app = express();

const getPeople = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`Fetching people data for id ${id}`);

    const response = await fetch(`https://swapi.co/api/people/${id}`);

    const people = await response.json();

    client.set(id, JSON.stringify(people), 'EX', 3600);

    res.send(getResponse(people));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
};

const getResponse = people => {
  const { name, height, gender } = people;
  return `
    <ul>
        <li>Name: ${name}</li>
        <li>Height: ${height}</li>
        <li>Gender: ${gender}</li>
    </ul>
    `;
};

const cachePeople = (req, res, next) => {
  const { id } = req.params;

  client.get(id, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(getResponse(JSON.parse(data)));
    } else {
      next();
    }
  });
};

app.get('/startwars/people/:id', cachePeople, getPeople);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
