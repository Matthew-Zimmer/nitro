import express from 'express';
import pg from 'pg';
import onHeaders from 'on-headers';

const app = express();
const client = new pg.Client({
  connectionString: `postgresql://root:password@localhost:5432/root`
});
await client.connect();

app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  onHeaders(res, () => {
    const end = process.hrtime.bigint()
    console.log((end - start) / BigInt(1000), "microseconds");
  });
  next()
})

app.get("/items", async (req, res) => {
  const { rows } = await client.query(`select id, name from item`);
  res.send(`<!doctype html><html><head><title></title></head><body>${rows.map(x => `<a>${x.name}</a>`).join('')}</body></html>`)
})

app.listen(3000);