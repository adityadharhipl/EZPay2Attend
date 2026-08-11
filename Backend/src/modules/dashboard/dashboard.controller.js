const dashboardService = require('./dashboard.service');
const { updateProfileSchema } = require('./dashboard.validation');
const eventsService = require('../events/events.service');
const db = require('../../config/db');
const ExcelJS = require('exceljs');

exports.renderDashboard = async (req, res) => {
    try {
        const metrics = await dashboardService.getDashboardMetrics();
        const wantsJson = req.originalUrl.startsWith('/api/') || (req.headers.accept && !req.headers.accept.includes('text/html'));
        if (wantsJson) {
            return res.status(200).json({ success: true, data: metrics });
        }
        res.render('dashboard/index', { user: req.user, metrics, query: req.query });
    } catch (error) {
        console.error(error);
        const wantsJson = req.originalUrl.startsWith('/api/') || (req.headers.accept && !req.headers.accept.includes('text/html'));
        if (wantsJson) {
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

exports.exportAttendeesCSV = async (req, res) => {
    try {
        const attendees = await db.attendee.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' } });
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendees');

        worksheet.columns = [
            { header: 'Name', key: 'fullName', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Contact', key: 'contactNumber', width: 20 },
            { header: 'Event', key: 'eventTitle', width: 30 },
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Registration Date', key: 'date', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true };

        attendees.forEach(a => {
            worksheet.addRow({
                fullName: a.fullName,
                email: a.email,
                contactNumber: a.contactNumber,
                eventTitle: a.event.title,
                status: a.status.replace('_', ' '),
                date: a.createdAt.toLocaleDateString()
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="attendees.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Error exporting attendees:", err);
        res.status(500).send("Server Error");
    }
};

exports.exportPaymentsCSV = async (req, res) => {
    try {
        const payments = await db.payment.findMany({ include: { attendee: { include: { event: true } } }, orderBy: { createdAt: 'desc' } });
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payments');

        worksheet.columns = [
            { header: 'S.No', key: 'sno', width: 10 },
            { header: 'Ref Number', key: 'referenceNumber', width: 25 },
            { header: 'Attendee Name', key: 'fullName', width: 25 },
            { header: 'Event Title', key: 'eventTitle', width: 30 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Payment Date', key: 'date', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true };

        let count = 1;
        payments.forEach(p => {
            worksheet.addRow({
                sno: count++,
                referenceNumber: p.referenceNumber || '',
                fullName: p.attendee.fullName,
                eventTitle: p.attendee.event.title,
                amount: p.amount,
                type: p.type,
                status: p.status,
                date: p.createdAt.toLocaleDateString()
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="payments.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Error exporting payments:", err);
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

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        let jsonData = [];

        // Helper function to format headers
        const styleHeaders = (sheet) => {
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E293B' }
            };
            sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        };

        if (type === 'attendee') {
            let whereClause = { ...dateWhere };
            if (eventId) whereClause.eventId = eventId;
            if (registrationStatus) whereClause.status = registrationStatus;

            const attendees = await db.attendee.findMany({ where: whereClause, include: { event: true } });
            
            worksheet.columns = [
                { header: 'Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Contact', key: 'contact', width: 15 },
                { header: 'Event', key: 'event', width: 30 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Registration Date', key: 'registrationDate', width: 20 }
            ];
            
            attendees.forEach(a => {
                const regDate = a.createdAt.toISOString();
                worksheet.addRow({
                    name: a.fullName,
                    email: a.email,
                    contact: a.contactNumber,
                    event: a.event.title,
                    status: a.status,
                    registrationDate: regDate.split('T')[0]
                });
                jsonData.push({
                    name: a.fullName,
                    email: a.email,
                    contact: a.contactNumber,
                    event: a.event.title,
                    status: a.status,
                    registrationDate: regDate
                });
            });
            styleHeaders(worksheet);
            
        } else if (type === 'payment') {
            let whereClause = { ...dateWhere };
            if (paymentStatus) whereClause.status = paymentStatus;
            
            if (eventId) {
                whereClause.attendee = { eventId: eventId };
            }

            const payments = await db.payment.findMany({ where: whereClause, include: { attendee: { include: { event: true } } } });
            
            worksheet.columns = [
                { header: 'S.No', key: 'sno', width: 10 },
                { header: 'Ref Number', key: 'reference', width: 20 },
                { header: 'Attendee Name', key: 'name', width: 25 },
                { header: 'Event Title', key: 'event', width: 30 },
                { header: 'Amount', key: 'amount', width: 12 },
                { header: 'Type', key: 'type', width: 12 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Payment Date', key: 'paymentDate', width: 20 }
            ];

            let count = 1;
            payments.forEach(p => {
                const payDate = p.createdAt.toISOString();
                worksheet.addRow({
                    sno: count,
                    reference: p.referenceNumber || '-',
                    name: p.attendee.fullName,
                    event: p.attendee.event.title,
                    amount: p.amount,
                    type: p.type,
                    status: p.status,
                    paymentDate: payDate.split('T')[0]
                });
                jsonData.push({
                    'S.No': count,
                    'Ref Number': p.referenceNumber,
                    'Attendee Name': p.attendee.fullName,
                    'Event Title': p.attendee.event.title,
                    'Amount': p.amount,
                    'Type': p.type,
                    'Status': p.status,
                    'Payment Date': payDate
                });
                count++;
            });
            styleHeaders(worksheet);
            
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
            
            worksheet.columns = [
                { header: 'Event Title', key: 'eventTitle', width: 30 },
                { header: 'School', key: 'school', width: 30 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Capacity', key: 'capacity', width: 12 },
                { header: 'Enrolled', key: 'enrolled', width: 12 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Cost Per Attendee', key: 'costPerAttendee', width: 20 }
            ];

            events.forEach(e => {
                const eventDate = e.date ? e.date.toISOString().split('T')[0] : 'TBD';
                worksheet.addRow({
                    eventTitle: e.title,
                    school: e.school.name,
                    status: e.status,
                    capacity: e.capacity,
                    enrolled: e._count.attendees,
                    date: eventDate,
                    costPerAttendee: e.costPerAttendee
                });
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
            styleHeaders(worksheet);
            
        } else if (type === 'financial') {
            let whereClause = { ...dateWhere };
            if (eventId) whereClause.id = eventId;

            const events = await db.event.findMany({ where: whereClause, include: { attendees: { include: { payments: { where: { status: 'SUCCESS' } } } } } });
            
            worksheet.columns = [
                { header: 'Event Title', key: 'eventTitle', width: 35 },
                { header: 'Total Registrations', key: 'totalRegistrations', width: 20 },
                { header: 'Total Revenue Collected', key: 'totalRevenue', width: 25 },
                { header: 'Total Refunds Processed', key: 'totalRefunds', width: 25 },
                { header: 'Net Revenue', key: 'netRevenue', width: 20 }
            ];

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
                worksheet.addRow({
                    eventTitle: e.title,
                    totalRegistrations,
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    totalRefunds: parseFloat(totalRefunds.toFixed(2)),
                    netRevenue: parseFloat(netRevenue.toFixed(2))
                });
                jsonData.push({
                    eventTitle: e.title,
                    totalRegistrations,
                    totalRevenue: totalRevenue.toFixed(2),
                    totalRefunds: totalRefunds.toFixed(2),
                    netRevenue: netRevenue.toFixed(2)
                });
            });
            styleHeaders(worksheet);
        }

        if (format === 'json') {
            return res.json({ success: true, data: jsonData });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Error exporting report:", err);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
};
