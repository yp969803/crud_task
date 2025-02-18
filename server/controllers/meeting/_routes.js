const express = require('express');

const meeting = require('./meeting');
const auth = require('../../middelwares/auth');

const router = express.Router();

router.get('/view:id', auth, meeting.view);
router.get('/index', auth, meeting.index);
router.post('/add', auth, meeting.add);
router.delete('/delete:id', auth, meeting.deleteData);
router.delete('/deleteMany', auth, meeting.deleteMany);

module.exports = router