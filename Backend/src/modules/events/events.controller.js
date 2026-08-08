const eventsService = require('./events.service');
const { createEventSchema, updateEventSchema } = require('./events.validation');

const wantsJson = (req) => {
    if (req.is('application/json')) return true;
    if (req.headers.accept && req.headers.accept.includes('application/json')) return true;
    if (req.headers.accept && req.headers.accept.includes('text/html')) return false;
    return true; 
};

exports.getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const { data, total } = await eventsService.getAllEvents(page, limit);
        const totalPages = Math.ceil(total / limit);

        if (wantsJson(req)) {
            return res.json({ 
                success: true, 
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            });
        }
        res.render('events/index', { events: data, title: 'Events Management', pagination: { total, page, limit, totalPages } });
    } catch (error) {
        if (wantsJson(req)) return res.status(500).json({ success: false, message: error.message });
        res.status(500).send('Server Error');
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await eventsService.getEventById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        
        if (wantsJson(req)) {
            return res.json({ success: true, data: event });
        }
        res.render('events/view', { event, title: event.title });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { error, value } = createEventSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const event = await eventsService.createEvent(value);
        res.status(201).json({ success: true, message: 'Event created successfully', data: event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { error, value } = updateEventSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const event = await eventsService.updateEvent(req.params.id, value);
        res.json({ success: true, message: 'Event updated successfully', data: event });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Event not found' });
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        await eventsService.deleteEvent(req.params.id);
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'Event not found' });
        if (error.code === 'P2003') return res.status(400).json({ success: false, message: 'Cannot delete event because it has registered attendees.' });
        res.status(500).json({ success: false, message: error.message });
    }
};
