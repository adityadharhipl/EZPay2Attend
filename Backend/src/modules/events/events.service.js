const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllEvents = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        prisma.event.findMany({
            skip,
            take: limit,
            include: {
                school: { select: { id: true, name: true } },
                _count: { select: { attendees: true } },
                attendees: {
                    include: {
                        payments: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.event.count()
    ]);
    
    return { data, total };
};

exports.getEventById = async (id) => {
    return prisma.event.findUnique({
        where: { id },
        include: {
            school: { select: { id: true, name: true } },
            _count: { select: { attendees: true } }
        }
    });
};

async function generateUniqueSlug(title, excludeId = null) {
    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'event';
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (true) {
        const existing = await prisma.event.findFirst({
            where: { 
                slug: uniqueSlug,
                id: excludeId ? { not: excludeId } : undefined
            }
        });
        if (!existing) return uniqueSlug;
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
    }
}

function validateDates(data, existingEvent = null) {
    const eventDate = data.date !== undefined ? data.date : (existingEvent ? existingEvent.date : null);
    const balanceDueDate = data.balanceDueDate !== undefined ? data.balanceDueDate : (existingEvent ? existingEvent.balanceDueDate : null);

    if (eventDate && balanceDueDate) {
        if (new Date(balanceDueDate) > new Date(eventDate)) {
            throw new Error('Balance Due Date cannot be after the Event Date.');
        }
    }
}

exports.createEvent = async (data) => {
    validateDates(data);
    data.slug = await generateUniqueSlug(data.title);
    return prisma.event.create({
        data
    });
};

exports.updateEvent = async (id, data) => {
    if (data.date !== undefined || data.balanceDueDate !== undefined) {
        const existingEvent = await prisma.event.findUnique({ where: { id } });
        validateDates(data, existingEvent);
    }
    
    if (data.title) {
        data.slug = await generateUniqueSlug(data.title, id);
    }
    return prisma.event.update({
        where: { id },
        data
    });
};

exports.deleteEvent = async (id) => {
    // Fetch attendees to delete their related payments first
    const attendees = await prisma.attendee.findMany({
        where: { eventId: id },
        select: { id: true }
    });
    const attendeeIds = attendees.map(a => a.id);

    return prisma.$transaction([
        // 1. Delete all payments associated with attendees of this event
        prisma.payment.deleteMany({
            where: { attendeeId: { in: attendeeIds } }
        }),
        // 2. Delete all attendees for this event
        prisma.attendee.deleteMany({
            where: { eventId: id }
        }),
        // 3. Finally, delete the event
        prisma.event.delete({
            where: { id }
        })
    ]);
};
