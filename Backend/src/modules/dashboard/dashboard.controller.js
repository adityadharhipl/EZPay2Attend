const dashboardService = require('./dashboard.service');
const { updateProfileSchema } = require('./dashboard.validation');
const eventsService = require('../events/events.service');
const db = require('../../config/db');

exports.renderDashboard = async (req, res) => {
    try {
        const metrics = await dashboardService.getDashboardMetrics();
        res.render('dashboard/index', { user: req.user, metrics });
    } catch (error) {
        console.error(error);
        res.render('dashboard/index', { user: req.user, metrics: null, error: 'Failed to load dashboard metrics' });
    }
};

exports.renderProfile = (req, res) => {
    res.render('dashboard/profile', { user: req.user, error: null, success: null });
};

exports.getEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const { data: events, total } = await eventsService.getAllEvents(page, limit);
        const totalPages = Math.ceil(total / limit);
        const schools = await db.school.findMany(); // Needed for the Create Event dropdown
        res.render('dashboard/events', { 
            user: req.user, 
            title: 'Event Management', 
            events, 
            schools,
            pagination: { page, limit, total, totalPages }
        });
    } catch (err) {
        res.status(500).send('Error loading events');
    }
};

exports.getSchools = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const schoolsService = require('../schools/schools.service');
        const { data: schools, total } = await schoolsService.getAllSchools(page, limit);
        const totalPages = Math.ceil(total / limit);
        
        res.render('dashboard/schools', { 
            user: req.user, 
            title: 'School Management', 
            schools,
            pagination: { page, limit, total, totalPages }
        });
    } catch (err) {
        res.status(500).send('Error loading schools');
    }
};

exports.getAttendees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const search = req.query.search || '';
        
        const attendeesService = require('../attendees/attendees.service');
        const { data: attendees, total } = await attendeesService.getAllAttendees(page, limit, search);
        const totalPages = Math.ceil(total / limit);
        
        res.render('dashboard/attendees', { 
            user: req.user, 
            title: 'Attendee Management', 
            attendees,
            search,
            pagination: { page, limit, total, totalPages }
        });
    } catch (err) {
        res.status(500).send('Error loading attendees');
    }
};

exports.handleUpdateProfile = async (req, res) => {
    try {
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            return res.render('dashboard/profile', { user: req.user, error: error.details[0].message, success: null });
        }

        await dashboardService.updateAdminProfile(req.user.id, value);
        
        // Fetch updated user to reflect changes
        const updatedUser = { ...req.user, name: value.name, email: value.email };
        res.render('dashboard/profile', { user: updatedUser, error: null, success: 'Profile updated successfully' });
    } catch (error) {
        res.render('dashboard/profile', { user: req.user, error: error.message || 'An error occurred', success: null });
    }
};
