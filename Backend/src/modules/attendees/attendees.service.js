const db = require('../../config/db');

exports.createAttendee = async (data) => {
    // Check event capacity
    const event = await db.event.findUnique({
        where: { id: data.eventId },
        include: { _count: { select: { attendees: true } } }
    });

    if (!event) throw new Error("Event not found");
    if (event.status !== 'OPEN') throw new Error("Event is not open for registration");
    if (event._count.attendees >= event.capacity) throw new Error("Event is fully booked");

    // Check if already registered
    const existing = await db.attendee.findUnique({
        where: {
            eventId_email: {
                eventId: data.eventId,
                email: data.email
            }
        }
    });

    if (existing) throw new Error("This email is already registered for this event");

    // Create attendee
    return await db.attendee.create({
        data: {
            eventId: data.eventId,
            fullName: data.fullName,
            guardianName: data.guardianName,
            contactNumber: data.contactNumber,
            email: data.email,
            status: event.costPerAttendee === 0 ? "CONFIRMED" : "BALANCE_PENDING"
        }
    });
};

exports.getAllAttendees = async (page = 1, limit = 10, search = '') => {
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
        whereClause = {
            OR: [
                { fullName: { contains: search } },
                { email: { contains: search } },
                { contactNumber: { contains: search } },
                { event: { title: { contains: search } } }
            ]
        };
    }

    const [data, total] = await Promise.all([
        db.attendee.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { event: true }
        }),
        db.attendee.count({ where: whereClause })
    ]);

    return { data, total };
};

exports.updateAttendeeStatus = async (id, status) => {
    return await db.attendee.update({
        where: { id },
        data: { status }
    });
};

exports.deleteAttendee = async (id) => {
    return await db.attendee.delete({
        where: { id }
    });
};
