const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const { popular } = req.query;
    let query = 'SELECT id, name, country, popular FROM makes';
    const params = [];

    if (popular === 'true') {
      query += ' WHERE popular = true';
    }
    query += ' ORDER BY popular DESC, name ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, country, popular FROM makes WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
