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

exports.createEvent = async (data) => {
    data.slug = await generateUniqueSlug(data.title);
    return prisma.event.create({
        data
    });
};

exports.updateEvent = async (id, data) => {
    if (data.title) {
        data.slug = await generateUniqueSlug(data.title, id);
    }
    return prisma.event.update({
        where: { id },
        data
    });
};

exports.deleteEvent = async (id) => {
    return prisma.event.delete({
        where: { id }
    });
};
