/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express';
import { addAirtableRoutes } from 'jbs-airtable-express-proxy';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const airtableSpec = {
  places: {
    name: 'string',
    lat: 'number',
    long: 'number',
    active: 'boolean',
  },
  locations: {
    name: 'string',
    description: 'string',
    latitude: 'number',
    longitude: 'number',
  },
  people: {
    firstName: 'string',
    lastName: 'string',
    age: 'number',
  },
} as const;

addAirtableRoutes(app, {
  globalRoutePrefix: '/api',
  airtableSpec,
  airtableApiKey: process.env.AIRTABLE_KEY,
  airtableBaseId: process.env.AIRTABLE_BASE,
});

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
