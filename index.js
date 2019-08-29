const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 3000;

const REDIS_PORT = process.env.REDIS_PORT || 6379;
const client = redis.createClient(REDIS_PORT);

const app = express();

const getPeople = async (req, res, next) => {
  try {
    console.log('Fetching Data...');
    const { id } = req.params;

    const response = await fetch(`https://swapi.co/api/people/${id}`);

    const people = await response.json();

    client.setex(id, 3600, people);

    res.send(getResponse(people));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
};

const getResponse = people => {
  return `
    <ul>
        <li>Name: ${people.name}</li>
        <li>Height: ${people.height}</li>
        <li>Gender: ${people.gender}</li>
    </ul>
    `;
};

const cachePeople = (req, res, next) => {
  const { id } = req.params;

  client.get(id, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(getResponse(id, data));
    } else {
      next();
    }
  });
};

app.get('/startwars/people/:id', cachePeople, getPeople);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
