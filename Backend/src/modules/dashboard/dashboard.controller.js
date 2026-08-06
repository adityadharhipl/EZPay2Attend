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
        const limit = parseInt(req.query.limit) || 10;
        const { data: events, total } = await eventsService.getAllEvents(page, limit);
        const totalPages = Math.ceil(total / limit);
        const schools = await db.school.findMany();
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
        const limit = parseInt(req.query.limit) || 10;
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
        const limit = parseInt(req.query.limit) || 10;
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
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let whereClause = {};
        if (search) {
            whereClause = {
                OR: [
                    { referenceNumber: { contains: search } },
                    { attendee: { fullName: { contains: search } } },
                    { attendee: { email: { contains: search } } },
                    { attendee: { event: { title: { contains: search } } } }
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
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Refund queue: Attendees who requested refunds, or are replaced, or overdue
        let whereClause = {
            status: { in: ['REFUND_REQUESTED', 'REFUNDED', 'BALANCE_OVERDUE', 'REPLACED'] }
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

exports.renderReports = async (req, res) => {
    try {
        const events = await db.event.findMany({ include: { school: true }, orderBy: { createdAt: 'desc' } });
        res.render('dashboard/reports', { user: req.user, events });
    } catch (err) {
        console.error("Error loading reports dashboard:", err);
        res.status(500).send("Server Error");
    }
};

exports.exportCustomReport = async (req, res) => {
    try {
        const { type, eventId, startDate, endDate, registrationStatus, paymentStatus, format } = req.query;

        // Build Where Clause
        let dateWhere = {};
        if (startDate || endDate) {
            dateWhere.createdAt = {};
            if (startDate) dateWhere.createdAt.gte = new Date(startDate);
            if (endDate) {
                let end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                dateWhere.createdAt.lte = end;
            }
        }

        let csv = '';
        let jsonData = [];

        if (type === 'attendee') {
            let whereClause = { ...dateWhere };
            if (eventId) whereClause.eventId = eventId;
            if (registrationStatus) whereClause.status = registrationStatus;

            const attendees = await db.attendee.findMany({ where: whereClause, include: { event: true } });
            csv = 'Name,Email,Contact,Event,Status,Registration Date\n';
            attendees.forEach(a => {
                csv += `"${a.fullName}","${a.email}","${a.contactNumber}","${a.event.title}","${a.status}","${a.createdAt.toISOString()}"\n`;
                jsonData.push({
                    name: a.fullName,
                    email: a.email,
                    contact: a.contactNumber,
                    event: a.event.title,
                    status: a.status,
                    registrationDate: a.createdAt.toISOString()
                });
            });
            if (format !== 'json') res.attachment('attendee_report.csv');
            
        } else if (type === 'payment') {
            let whereClause = { ...dateWhere };
            if (paymentStatus) whereClause.status = paymentStatus;
            
            // To filter payments by event, we need to filter by the related attendee's eventId
            if (eventId) {
                whereClause.attendee = { eventId: eventId };
            }

            const payments = await db.payment.findMany({ where: whereClause, include: { attendee: { include: { event: true } } } });
            csv = 'Reference,Gateway Ref,Name,Event,Amount,Type,Status,Payment Date\n';
            payments.forEach(p => {
                csv += `"${p.referenceNumber || ''}","${p.gatewayReference || ''}","${p.attendee.fullName}","${p.attendee.event.title}","${p.amount}","${p.type}","${p.status}","${p.createdAt.toISOString()}"\n`;
                jsonData.push({
                    reference: p.referenceNumber,
                    gatewayRef: p.gatewayReference,
                    name: p.attendee.fullName,
                    event: p.attendee.event.title,
                    amount: p.amount,
                    type: p.type,
                    status: p.status,
                    paymentDate: p.createdAt.toISOString()
                });
            });
            if (format !== 'json') res.attachment('payment_report.csv');
            
        } else if (type === 'event') {
            let whereClause = { ...dateWhere };
            if (eventId) whereClause.id = eventId;

            const events = await db.event.findMany({ 
                where: whereClause, 
                include: { 
                    school: true, 
                    _count: { select: { attendees: { where: { status: { notIn: ['REFUNDED', 'REPLACED'] } } } } } 
                } 
            });
            csv = 'Event Title,School,Status,Capacity,Enrolled,Date,Cost Per Attendee\n';
            events.forEach(e => {
                csv += `"${e.title}","${e.school.name}","${e.status}","${e.capacity}","${e._count.attendees}","${e.date ? e.date.toISOString() : 'TBD'}","${e.costPerAttendee}"\n`;
                jsonData.push({
                    eventTitle: e.title,
                    school: e.school.name,
                    status: e.status,
                    capacity: e.capacity,
                    enrolled: e._count.attendees,
                    date: e.date ? e.date.toISOString() : 'TBD',
                    costPerAttendee: e.costPerAttendee
                });
            });
            if (format !== 'json') res.attachment('event_report.csv');
            
        } else if (type === 'financial') {
            let whereClause = { ...dateWhere };
            if (eventId) whereClause.id = eventId;

            const events = await db.event.findMany({ where: whereClause, include: { attendees: { include: { payments: { where: { status: 'SUCCESS' } } } } } });
            
            csv = 'Event Title,Total Registrations,Total Revenue Collected,Total Refunds Processed,Net Revenue\n';
            events.forEach(e => {
                let totalRegistrations = e.attendees.length;
                let totalRevenue = 0;
                let totalRefunds = 0;
                
                e.attendees.forEach(a => {
                    a.payments.forEach(p => {
                        if (p.type === 'REFUND') {
                            totalRefunds += p.amount;
                        } else {
                            totalRevenue += p.amount;
                        }
                    });
                });
                
                const netRevenue = totalRevenue - totalRefunds;
                csv += `"${e.title}","${totalRegistrations}","${totalRevenue.toFixed(2)}","${totalRefunds.toFixed(2)}","${netRevenue.toFixed(2)}"\n`;
                jsonData.push({
                    eventTitle: e.title,
                    totalRegistrations,
                    totalRevenue: totalRevenue.toFixed(2),
                    totalRefunds: totalRefunds.toFixed(2),
                    netRevenue: netRevenue.toFixed(2)
                });
            });
            if (format !== 'json') res.attachment('financial_report.csv');
        }

        if (format === 'json') {
            return res.json({ success: true, data: jsonData });
        }

        res.header('Content-Type', 'text/csv');
        return res.send(csv);
    } catch (err) {
        console.error("Error exporting report:", err);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
};
