const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
   try{
        let meetingHistory = new MeetingHistory(req.body);
        await meetingHistory.save();
        res.status(201).json(meetingHistory);
    }catch (err) {
        console.error('Failed to create meeting:', err);
        res.status(400).json({ error: 'Failed to create meeting : ', err });
    }
}

const index = async (req, res) => {
    query=req.query;
    query.deleted=false;
    if(query.createBy){
        query.createBy=new mongoose.Types.ObjectId(query.createBy);
    }
    try{
        let result = await MeetingHistory.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'Contacts',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'contact'
                }
            },
            {
                $lookup: {
                    from: 'Leads', // Assuming this is the collection name for 'leads'
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'Lead'
                }
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$contact', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$Lead', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    assignToName: {
                        $cond: {
                            if: '$contact',
                            then: { $concat: ['$contact.title', ' ', '$contact.firstName', ' ', '$contact.lastName'] },
                            else: { $concat: ['$Lead.leadName'] }
                        }
                    },
                }
            },
            { $project: { users: 0, contact: 0, Lead: 0 } },
        ]);
        res.send(result);
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
}

const view = async (req, res) => {
    try{
        let response = await MeetingHistory.findOne({ _id: req.params.id })
        if (!response) return res.status(404).json({ message: "no Data Found." })
        let result = await MeetingHistory.aggregate([
            { $match: { _id: response._id } },
            {
                $lookup: {
                    from: 'Contacts',
                    localField: 'attendes',
                    foreignField: '_id',
                    as: 'contact'
                }
            },
            {
                $lookup: {
                    from: 'Leads', // Assuming this is the collection name for 'leads'
                    localField: 'attendesLead',
                    foreignField: '_id',
                    as: 'Lead'
                }
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
        ])
        res.status(200).json(result[0]);
    }catch (err) {
        console.log('Error:', err);
        res.status(400).json({ Error: err });
    }
}

const deleteData = async (req, res) => {
  try{
        let response = await MeetingHistory.findOne({ _id: req.params.id })
        if (!response) return res.status(404).json({ message: "no Data Found." })
        let result = await MeetingHistory.updateOne({ _id: req.params.id }, { $set: { deleted: true } })
        res.status(200).json(result);
    }catch (err) {
        console.log('Error:', err);
        res.status(400).json({ Error: err });
    }
}

const deleteMany = async (req, res) => {
    try{
        let result = await MeetingHistory.updateMany({ _id: { $in: req.body.ids } }, { $set: { deleted: true } })
        res.status(200).json(result);
    }catch (err) {
        console.log('Error:', err);
        res.status(400).json({ Error: err });
    }
}

module.exports = { add, index, view, deleteData, deleteMany }