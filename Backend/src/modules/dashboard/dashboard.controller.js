const dashboardService = require('./dashboard.service');
const { updateProfileSchema } = require('./dashboard.validation');
const eventsService = require('../events/events.service');
const db = require('../../config/db');

exports.renderDashboard = async (req, res) => {
    try {
        const metrics = await dashboardService.getDashboardMetrics();
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(200).json({ success: true, data: metrics });
        }
        res.render('dashboard/index', { user: req.user, metrics });
    } catch (error) {
        console.error(error);
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(500).json({ success: false, message: 'Failed to load dashboard metrics' });
        }
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

exports.getPayments = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        let whereClause = {};
        if (search) {
            whereClause = {
                OR: [
                    { referenceNumber: { contains: search } },
                    { attendee: { fullName: { contains: search } } },
                    { attendee: { email: { contains: search } } }
                ]
            };
        }

        const payments = await db.payment.findMany({
            where: whereClause,
            include: { attendee: { include: { event: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        const total = await db.payment.count({ where: whereClause });
        const totalPages = Math.ceil(total / limit);

        res.render('dashboard/payments', {
            user: req.user,
            title: 'Payments | EZPay2Attend',
            payments,
            pagination: { page, limit, total, totalPages },
            search
        });
    } catch (err) {
        console.error("Error loading payments dashboard:", err);
        res.status(500).send("Server Error");
    }
};

exports.getRefunds = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Refund queue: Attendees who requested refunds, or are replaced, or overdue
        let whereClause = {
            status: { in: ['REFUNDED', 'BALANCE_OVERDUE', 'REPLACED'] }
        };
        if (search) {
            whereClause.OR = [
                { fullName: { contains: search } },
                { email: { contains: search } }
            ];
        }

        const attendees = await db.attendee.findMany({
            where: whereClause,
            include: { event: true, payments: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        const total = await db.attendee.count({ where: whereClause });
        const totalPages = Math.ceil(total / limit);

        res.render('dashboard/refunds', {
            user: req.user,
            title: 'Refunds & Replacements | EZPay2Attend',
            attendees,
            pagination: { page, limit, total, totalPages },
            search
        });
    } catch (err) {
        console.error("Error loading refunds dashboard:", err);
        res.status(500).send("Server Error");
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

exports.exportAttendeesCSV = async (req, res) => {
    try {
        const attendees = await db.attendee.findMany({ include: { event: true } });
        let csv = 'Name,Email,Contact,Event,Status,Date\n';
        attendees.forEach(a => {
            csv += `"${a.fullName}","${a.email}","${a.contactNumber}","${a.event.title}","${a.status}","${a.createdAt.toISOString()}"\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('attendees_export.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).send('Error generating CSV');
    }
};

exports.exportPaymentsCSV = async (req, res) => {
    try {
        const payments = await db.payment.findMany({ include: { attendee: { include: { event: true } } } });
        let csv = 'Reference,Name,Event,Amount,Type,Status,Date\n';
        payments.forEach(p => {
            csv += `"${p.referenceNumber}","${p.attendee.fullName}","${p.attendee.event.title}","${p.amount}","${p.type}","${p.status}","${p.createdAt.toISOString()}"\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('payments_export.csv');
        return res.send(csv);
    } catch (err) {
        res.status(500).send('Error generating CSV');
    }
};
