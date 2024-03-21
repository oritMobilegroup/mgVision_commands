const express = require('express');
const router = express.Router();
const Cellphone = require('../cellphone'); // Your Cellphone model


router.post('/register', async (req, res) => {
    try {
      const cellphone = new Cellphone(req.body);
      await cellphone.save();
      res.status(201).send({ message: 'Cellphone registered successfully' });
    } catch (error) {
      res.status(400).send(error);
    }
  });
  module.exports = router;
