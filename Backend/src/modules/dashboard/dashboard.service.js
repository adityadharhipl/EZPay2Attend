const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

exports.updateAdminProfile = async (userId, data) => {
    const updateData = {
        name: data.name,
        email: data.email
    };

    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData
    });

    return updatedUser;
};

exports.getDashboardMetrics = async () => {
    const totalEvents = await prisma.event.count();
    const totalRegistrations = await prisma.attendee.count();
    const confirmedAttendees = await prisma.attendee.count({ where: { status: 'CONFIRMED' } });
    
    const revenueAgg = await prisma.payment.aggregate({
        where: { status: 'SUCCESS', type: { not: 'REFUND' } },
        _sum: { amount: true }
    });
    const totalRevenue = revenueAgg._sum.amount || 0;

    const outstandingAgg = await prisma.payment.aggregate({
        where: { status: 'PENDING', type: { not: 'REFUND' } },
        _sum: { amount: true }
    });
    const outstandingBalance = outstandingAgg._sum.amount || 0;
    const outstandingPayments = await prisma.payment.count({
        where: { status: 'PENDING', type: { not: 'REFUND' } }
    });

    const pendingRefunds = await prisma.payment.count({
        where: { type: 'REFUND', status: 'PENDING' }
    });

    const capacityAgg = await prisma.event.aggregate({
        _sum: { capacity: true }
    });
    const totalCapacity = capacityAgg._sum.capacity || 0;
    const capacityUtilization = totalCapacity > 0 ? ((totalRegistrations / totalCapacity) * 100).toFixed(1) : 0;

    // Get recent events for Event Dashboard
    const recentEvents = await prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { attendees: true }
            }
        }
    });

    // Get recent payments for Financial Dashboard
    const recentPayments = await prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            attendee: {
                include: { event: true }
            }
        }
    });

    return {
        totalEvents,
        totalRegistrations,
        confirmedAttendees,
        outstandingPayments,
        totalRevenue,
        outstandingBalance,
        pendingRefunds,
        capacityUtilization,
        recentEvents,
        recentPayments
    };
};
