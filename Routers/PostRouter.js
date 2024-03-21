const express = require('express');
const router = express.Router();
const PostModel = require('../Models/PostModel');
const PostBl = require('../Models/PostBl');

router.post("/:num", async function (req, res) {
    try {
        let iemi = req.body;
        await PostBl.updateIemi(iemi);
        res.status(201).json(iemi); // Respond with the created data
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error });
    }
});

router.put('/:iemi', async (req, res) => {
    try {
        console.log("hihii")
        const { iemi } = req.params;
        console.log(iemi)
        const existingData = await PostModel.findOne({ "arrayOfObjects.Timestemp": iemi });

        if (!existingData) {
            return res.status(404).json({ message: 'Data not found' });
        }

        if (req.body.fieldToUpdate) {
            existingData.fieldToUpdate = req.body.fieldToUpdate;
        }

        await existingData.save();

        res.status(200).json(existingData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
