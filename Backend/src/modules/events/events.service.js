const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllEvents = async () => {
    return prisma.event.findMany({
        include: {
            school: { select: { id: true, name: true } },
            _count: { select: { attendees: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
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

exports.createEvent = async (data) => {
    return prisma.event.create({
        data
    });
};

exports.updateEvent = async (id, data) => {
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
