const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // EJS fix trigger
const { createObjectCsvStringifier } = require('csv-writer');

exports.renderReportsPage = async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.render('dashboard/reports', {
            title: 'Reports & Exports',
            user: req.user,
            events
        });
    } catch (error) {
        console.error("Error loading reports page:", error);
        res.redirect('/admin/dashboard');
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const { reportType, eventId, startDate, endDate, paymentStatus, regStatus } = req.query;

        // Base where clauses
        let eventWhere = {};
        let attendeeWhere = {};
        let paymentWhere = {};

        if (eventId) {
            eventWhere.id = eventId;
            attendeeWhere.eventId = eventId;
            paymentWhere.attendee = { eventId };
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            eventWhere.createdAt = { gte: start, lte: end };
            attendeeWhere.createdAt = { gte: start, lte: end };
            paymentWhere.createdAt = { gte: start, lte: end };
        }

        if (regStatus) {
            attendeeWhere.status = regStatus;
        }

        if (paymentStatus) {
            paymentWhere.status = paymentStatus;
        }

        let csvString = '';
        let filename = 'report.csv';

        switch (reportType) {
            case 'attendee': {
                const attendees = await prisma.attendee.findMany({
                    where: attendeeWhere,
                    include: { event: true, payments: true },
                    orderBy: { createdAt: 'desc' }
                });

                const csvWriter = createObjectCsvStringifier({
                    header: [
                        { id: 'name', title: 'Name' },
                        { id: 'email', title: 'Email' },
                        { id: 'contact', title: 'Contact Number' },
                        { id: 'event', title: 'Event' },
                        { id: 'status', title: 'Registration Status' },
                        { id: 'date', title: 'Registration Date' }
                    ]
                });

                const records = attendees.map(a => ({
                    name: a.fullName,
                    email: a.email,
                    contact: a.contactNumber,
                    event: a.event.title,
                    status: a.status,
                    date: a.createdAt.toISOString().split('T')[0]
                }));

                if (req.query.format === 'json') return res.status(200).json({ success: true, data: records });
                csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
                filename = `attendee_report_${new Date().getTime()}.csv`;
                break;
            }

            case 'payment': {
                const payments = await prisma.payment.findMany({
                    where: paymentWhere,
                    include: { attendee: { include: { event: true } } },
                    orderBy: { createdAt: 'desc' }
                });

                const csvWriter = createObjectCsvStringifier({
                    header: [
                        { id: 'name', title: 'Attendee Name' },
                        { id: 'event', title: 'Event' },
                        { id: 'amount', title: 'Amount' },
                        { id: 'type', title: 'Payment Type' },
                        { id: 'status', title: 'Status' },
                        { id: 'ref', title: 'Gateway Ref' },
                        { id: 'date', title: 'Date' }
                    ]
                });

                const records = payments.map(p => ({
                    name: p.attendee.fullName,
                    event: p.attendee.event.title,
                    amount: p.amount,
                    type: p.type,
                    status: p.status,
                    ref: p.gatewayReference || p.referenceNumber || 'N/A',
                    date: p.createdAt.toISOString().split('T')[0]
                }));

                if (req.query.format === 'json') return res.status(200).json({ success: true, data: records });
                csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
                filename = `payment_report_${new Date().getTime()}.csv`;
                break;
            }

            case 'event': {
                const events = await prisma.event.findMany({
                    where: eventWhere,
                    include: { 
                        _count: { select: { attendees: { where: { status: { notIn: ['REFUNDED', 'REPLACED'] } } } } },
                        attendees: { include: { payments: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const csvWriter = createObjectCsvStringifier({
                    header: [
                        { id: 'title', title: 'Event Title' },
                        { id: 'date', title: 'Event Date' },
                        { id: 'capacity', title: 'Capacity' },
                        { id: 'registrations', title: 'Total Registrations' },
                        { id: 'revenue', title: 'Total Revenue' }
                    ]
                });

                const records = events.map(e => {
                    let rev = 0;
                    e.attendees.forEach(a => {
                        a.payments.forEach(p => {
                            if (p.status === 'SUCCESS' && p.type !== 'REFUND') rev += p.amount;
                        });
                    });
                    return {
                        title: e.title,
                        date: e.date ? new Date(e.date).toISOString().split('T')[0] : 'N/A',
                        capacity: e.capacity,
                        registrations: e._count.attendees,
                        revenue: rev
                    };
                });

                if (req.query.format === 'json') return res.status(200).json({ success: true, data: records });
                csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
                filename = `event_report_${new Date().getTime()}.csv`;
                break;
            }

            case 'financial': {
                const events = await prisma.event.findMany({
                    where: eventWhere,
                    include: { 
                        attendees: { include: { payments: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const csvWriter = createObjectCsvStringifier({
                    header: [
                        { id: 'title', title: 'Event Title' },
                        { id: 'collected', title: 'Total Collected' },
                        { id: 'outstanding', title: 'Total Outstanding' },
                        { id: 'refunded', title: 'Total Refunded' }
                    ]
                });

                const records = events.map(e => {
                    let collected = 0;
                    let outstanding = 0;
                    let refunded = 0;
                    
                    e.attendees.forEach(a => {
                        a.payments.forEach(p => {
                            if (p.status === 'SUCCESS' && p.type !== 'REFUND') collected += p.amount;
                            if (p.status === 'PENDING' && p.type !== 'REFUND') outstanding += p.amount;
                            if (p.status === 'SUCCESS' && p.type === 'REFUND') refunded += Math.abs(p.amount);
                        });
                    });
                    
                    return {
                        title: e.title,
                        collected: collected,
                        outstanding: outstanding,
                        refunded: refunded
                    };
                });

        if (req.query.format === 'json') {
            return res.status(200).json({ success: true, data: records });
        }

        if (req.query.format === 'json') return res.status(200).json({ success: true, data: records });
                csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
        filename = `financial_report_${new Date().getTime()}.csv`;
        break;
    }

    default:
        return res.status(400).send("Invalid report type");
}

if (req.query.format === 'json') {
    return res.status(200).json({ success: true, data: [{}] }); // For other types if not captured inside switch
}

res.setHeader('Content-Type', 'text/csv');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
res.status(200).send(csvString);

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).send("Internal Server Error generating report");
    }
};
