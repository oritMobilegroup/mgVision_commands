const express = require('express');
const router = express.Router();
const Cellphone = require('../cellphone'); 
const { sendSMS } = require('.../sendSMS.js'); //


router.post('/send-command', async (req, res) => {
    try {
      const cellphones = await Cellphone.find({});
      cellphones.forEach(cellphone => {
        sendSMS(req.body.command, cellphone.phone_number);
      });
      res.status(200).send({ message: 'Commands sent successfully' });
    } catch (error) {
      res.status(500).send(error);
    }
  });
  module.exports = router;
