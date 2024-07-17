import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const app = express();
const port = 14123;

app.use(bodyParser.json());
app.use(cors());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const matchesUrl = path.join(__dirname, './data/matches.json');

// GET request to serve the JSON file
app.get('/api/data/matches', (req, res) => {
  console.log('GET /api/data/matches');
  fs.readFile(matchesUrl, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading file');
      return;
    }
    res.send({ records: JSON.parse(data) });
  });
});

app.post('/api/data/matches', (req, res) => {
  fs.readFile(matchesUrl, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading file');
      return;
    }

    let matches;
    try {
      matches = JSON.parse(data);
      if (!Array.isArray(matches)) {
        matches = [];
      }
    } catch (parseErr) {
      matches = [];
    }

    matches.push(req.body);

    fs.writeFile(matchesUrl, JSON.stringify(matches, null, 2), (writeErr) => {
      if (writeErr) {
        res.status(500).send('Error writing file');
        return;
      }
      res.send({ matches: matches });
    });
  });
});

app.put('/api/data/matches/:id', (req, res) => {
  const id = req.params.id;
  fs.readFile(matchesUrl, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading file');
      return;
    }

    let matches;
    try {
      matches = JSON.parse(data);
      if (!Array.isArray(matches)) {
        matches = [];
      }
    } catch (parseErr) {
      matches = [];
    }

    matches = matches.filter((match) => match.id !== id);
    matches.push(req.body);

    fs.writeFile(matchesUrl, JSON.stringify(matches, null, 2), (writeErr) => {
      if (writeErr) {
        res.status(500).send('Error writing file');
        return;
      }
      res.send({ matches: matches });
    });
  });
});

app.delete('/api/data/matches/:id', (req, res) => {
  const id = req.params.id;
  fs.readFile(matchesUrl, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading file');
      return;
    }

    let matches;
    try {
      matches = JSON.parse(data);
      if (!Array.isArray(matches)) {
        matches = [];
      }
    } catch (parseErr) {
      matches = [];
    }

    const updatedMatches = matches.filter((match) => match.id !== id);

    fs.writeFile(
      matchesUrl,
      JSON.stringify(updatedMatches, null, 2),
      (writeErr) => {
        if (writeErr) {
          res.status(500).send('Error writing file');
          return;
        }
        res.send({ matches: updatedMatches });
      }
    );
  });
});

app.get('/api/sofascore/search-match', async (req, res) => {
  try {
    const response = await axios.get(
      `https://www.sofascore.com/api/v1/search/events?q=${req.query.players}&page=0`
    );
    console.log(response.data);
    if (response.data.results.length > 0) {
      res.json(response.data.results[0]);
    } else {
      res.status(404).send('Match for the players you entered was not found');
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send('An error occurred while fetching data from Sofascore');
  }
});

async function fetchPlayerData(playerName) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = `https://www.tennisabstract.com/cgi-bin/wplayer.cgi?p=${playerName}`;

    await page.goto(url, { waitUntil: 'networkidle0' }); // Wait until page is fully loaded

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);

    // Find the year-end rankings table
    const table = $('#year-end-rankings tbody');
    const currentYearRow = table.find('tr:first-child');
    const elo = parseFloat(
      currentYearRow.find('td:nth-child(5)').text().trim()
    );

    return { elo };
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error;
  }
}

app.get('/api/elo', async (req, res) => {
  const { player1, player2 } = req.query;

  try {
    const player1Data = await fetchPlayerData(player1);
    const player2Data = await fetchPlayerData(player2);
    console.log('DATA');
    console.log(player1Data);
    console.log('=====');
    res.json({
      player1: { name: player1, elo: player1Data.elo },
      player2: { name: player2, elo: player2Data.elo },
    });
  } catch (error) {
    console.error('Error fetching and parsing data:', error);
    res.status(500).send('Error fetching data');
  }
});
