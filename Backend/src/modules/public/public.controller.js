const db = require('../../config/db');

exports.renderRegisterPage = async (req, res) => {
    try {
        // Fetch all open events that have capacity
        const events = await db.event.findMany({
            where: { status: 'OPEN' },
            include: { school: true, _count: { select: { attendees: true } } }
        });
        
        // Filter out events that are full
        const availableEvents = events.filter(e => e._count.attendees < e.capacity);
        
        res.render('public/register', { 
            title: 'Register for Event', 
            events: availableEvents, 
            preSelectedEvent: req.query.eventId || null,
            error: null, 
            success: null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading registration page');
    }
};

exports.renderSingleEventRegisterPage = async (req, res) => {
    try {
        const slug = req.params.slug;
        const event = await db.event.findUnique({
            where: { slug },
            include: { school: true, _count: { select: { attendees: true } } }
        });

        if (!event) return res.status(404).send('Event not found');
        if (event.status !== 'OPEN') return res.status(400).send('Event is closed for registration');
        if (event._count.attendees >= event.capacity) return res.status(400).send('Event is fully booked');

        res.render('public/register', { 
            title: `Register for ${event.title}`, 
            events: [event], 
            preSelectedEvent: event.id,
            isSingleEvent: true, // Used by the view to hide the dropdown
            error: null, 
            success: null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading registration page');
    }
};

exports.renderCheckoutPage = async (req, res) => {
    try {
        const attendeeId = req.query.attendeeId;
        if (!attendeeId) return res.status(400).send('Attendee ID required');
        
        const attendee = await db.attendee.findUnique({
            where: { id: attendeeId },
            include: { event: true }
        });

        if (!attendee) return res.status(404).send('Attendee not found');
        
        const reference = req.query.reference;
        res.render('public/checkout', { title: 'Checkout | EZPay2Attend', attendee, reference });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading checkout page');
    }
};

exports.renderSchoolDashboard = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 100;
        const skip = (page - 1) * limit;

        const school = await db.school.findUnique({ where: { id: schoolId } });
        if (!school) return res.status(404).send('School not found');

        // All events for calculating accurate top-level metrics
        const allEvents = await db.event.findMany({
            where: { schoolId },
            include: { 
                _count: { select: { attendees: { where: { status: { notIn: ['REFUNDED', 'REPLACED'] } } } } },
                attendees: {
                    include: {
                        payments: { where: { status: 'SUCCESS', type: { not: 'REFUND' } } }
                    }
                }
            }
        });

        // Calculate Revenue for the school
        let totalSchoolRevenue = 0;
        allEvents.forEach(event => {
            event.attendees.forEach(att => {
                att.payments.forEach(pay => {
                    totalSchoolRevenue += pay.amount;
                });
            });
        });

        // Paginated events for the table display
        const paginatedEvents = await db.event.findMany({
            where: { schoolId },
            include: { 
                _count: { select: { attendees: { where: { status: { notIn: ['REFUNDED', 'REPLACED'] } } } } },
                attendees: {
                    include: { payments: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        const totalItems = allEvents.length;
        const totalPages = Math.ceil(totalItems / limit);

        res.render('public/school_dashboard', { 
            school, 
            events: allEvents, // For top cards
            totalSchoolRevenue, // Payment Status
            paginatedEvents, // For table
            page, 
            totalPages 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading school dashboard');
    }
};
