/* jshint esversion: 9 */

const express = require('express');
const router=express.Router();
const User  = require('../models/user');

const crypto = require('crypto');
const {sendPasswordEmail}=require("./mailService");
const {saveData}=require("../models/savedata");

const tempPasswords = {};


router.get('/:usernameForAny', async (req, res) => {
    const usernameForAny = req.params.usernameForAny;
    console.log("any");
    try {
      // Find the user by username
      const user = await User.findOne({ username: usernameForAny });
      console.log(user);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Generate a new special password
      const newPassword = crypto.randomBytes(5).toString('hex');
      user.specialPassword = newPassword;
      user.specialPasswordTimestamp = new Date();
  
      await user.save();
  
      const email = user.email;
      console.log(newPassword);
      // Send the new special password to the user
      sendPasswordEmail(email, newPassword); // Call the sendPasswordEmail function
  
      res.status(200).json({ message: 'Password sent to the user' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Add a route to check the password and redirect to INDEX page
router.post('/any', async (req, res) => {
    const { username, specialPassword } = req.body;
    try {
      // Find the user by username
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Compare the entered password with the stored password
      if (specialPassword === user.specialPassword) {
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
  
        if (user.specialPasswordTimestamp > fiveMinutesAgo) {
          // Passwords match, log and respond
          console.log(specialPassword);
          res.status(200).json({ msg: 'password' });
        } else {
          res.status(401).json({ error: 'Expired password' });
        }
      } else {
        res.status(401).json({ error: 'Incorrect password' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  




module.exports = router;