const attendeesService = require('./attendees.service');

exports.createAttendee = async (req, res) => {
    try {
        const attendee = await attendeesService.createAttendee(req.body);
        res.status(201).json({ success: true, message: 'Successfully registered', data: attendee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllAttendees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        const result = await attendeesService.getAllAttendees(page, limit, search);
        res.status(200).json({ 
            success: true, 
            data: result.data,
            pagination: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const attendee = await attendeesService.updateAttendeeStatus(id, status);
        res.status(200).json({ success: true, message: 'Status updated', data: attendee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteAttendee = async (req, res) => {
    try {
        const { id } = req.params;
        await attendeesService.deleteAttendee(id);
        res.status(200).json({ success: true, message: 'Attendee removed successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
