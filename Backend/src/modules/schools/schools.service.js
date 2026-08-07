const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllSchools = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        prisma.school.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { events: true }
                },
                events: {
                    select: { title: true }
                }
            }
        }),
        prisma.school.count()
    ]);
    
    return { data, total };
};

exports.getAllSchoolsDropdown = async () => {
    return prisma.school.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });
};

exports.getSchoolById = async (id) => {
    return prisma.school.findUnique({
        where: { id },
        include: {
            events: {
                select: { id: true, title: true, status: true }
            }
        }
    });
};

exports.createSchool = async (data) => {
    return prisma.school.create({
        data
    });
};

exports.updateSchool = async (id, data) => {
    return prisma.school.update({
        where: { id },
        data
    });
};

exports.deleteSchool = async (id) => {
    return prisma.school.delete({
        where: { id }
    });
};
