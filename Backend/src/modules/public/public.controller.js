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

exports.renderCheckoutPage = async (req, res) => {
    try {
        const attendeeId = req.query.attendeeId;
        if (!attendeeId) return res.status(400).send('Attendee ID required');
        
        const attendee = await db.attendee.findUnique({
            where: { id: attendeeId },
            include: { event: true }
        });

        if (!attendee) return res.status(404).send('Attendee not found');
        
        res.render('public/checkout', { title: 'Checkout | EZPay2Attend', attendee });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading checkout page');
    }
};

exports.renderSchoolDashboard = async (req, res) => {
    try {
        const schoolId = req.params.id;
        const school = await db.school.findUnique({ where: { id: schoolId } });
        if (!school) return res.status(404).send('School not found');

        const events = await db.event.findMany({
            where: { schoolId },
            include: { _count: { select: { attendees: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.render('public/school_dashboard', { school, events });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading school dashboard');
    }
};
