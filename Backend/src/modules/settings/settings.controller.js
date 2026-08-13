const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSettings = async (req, res) => {
    try {
        const settings = await prisma.globalSetting.findMany();

        // Convert array to key-value object
        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.render('dashboard/settings', {
            title: 'Settings',
            user: req.user,
            config
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateSettings = async (req, res) => {
    try {
        const updates = req.body;

        // Handle arrays from hidden checkboxes
        for (const key of Object.keys(updates)) {
            if (Array.isArray(updates[key])) {
                // If it's an array like ['false', 'true'], take the last value ('true' if checked)
                updates[key] = updates[key][updates[key].length - 1];
            } else if (updates[key] === 'false,true') {
                updates[key] = 'true';
            }
        }

        for (const [key, value] of Object.entries(updates)) {
            await prisma.globalSetting.upsert({
                where: { key: key },
                update: { value: value.toString() },
                create: { key: key, value: value.toString() }
            });
        }

        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(200).json({ success: true, message: 'Settings updated successfully' });
        }

        res.redirect('/admin/settings?success=1');
    } catch (error) {
        console.error('Error updating settings:', error);
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    getSettings,
    updateSettings
};
