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
    
    // Apply Default Event Capacity if not provided
    if (data.capacity === undefined || data.capacity === null) {
        const defaultCapSetting = await prisma.globalSetting.findUnique({ where: { key: 'defaultCapacity' } });
        data.capacity = defaultCapSetting && defaultCapSetting.value ? parseInt(defaultCapSetting.value, 10) : 100;
    }

    return prisma.event.create({
        data
    });
};

exports.updateEvent = async (id, data) => {
    const existingEvent = await prisma.event.findUnique({ 
        where: { id },
        include: { _count: { select: { attendees: true } } }
    });

    if (!existingEvent) {
        const error = new Error('Event not found');
        error.code = 'P2025';
        throw error;
    }

    if (data.date !== undefined || data.balanceDueDate !== undefined) {
        validateDates(data, existingEvent);
    }
    
    if (data.title) {
        data.slug = await generateUniqueSlug(data.title, id);
    }
    
    if (data.capacity !== undefined) {
        const attendeeCount = existingEvent._count.attendees;
        if (data.capacity > attendeeCount && existingEvent.status === 'CLOSED') {
            data.status = 'OPEN';
        } else if (data.capacity <= attendeeCount && existingEvent.status === 'OPEN') {
            data.status = 'CLOSED';
        }
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
