const schoolsService = require('./schools.service');
const { createSchoolSchema, updateSchoolSchema } = require('./schools.validation');

const wantsJson = (req) => {
    if (req.is('application/json')) return true;
    if (req.headers.accept && req.headers.accept.includes('application/json')) return true;
    if (req.headers.accept && req.headers.accept.includes('text/html')) return false;
    return true; 
};

exports.getAllSchools = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const { data, total } = await schoolsService.getAllSchools(page, limit);
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
        res.render('schools/index', { schools: data, title: 'Schools Management', pagination: { total, page, limit, totalPages } });
    } catch (error) {
        if (wantsJson(req)) return res.status(500).json({ success: false, message: error.message });
        res.status(500).send('Server Error');
    }
};

exports.getAllSchoolsDropdown = async (req, res) => {
    try {
        const schools = await schoolsService.getAllSchoolsDropdown();
        res.json({ success: true, data: schools });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSchoolById = async (req, res) => {
    try {
        const school = await schoolsService.getSchoolById(req.params.id);
        if (!school) return res.status(404).json({ success: false, message: 'School not found' });
        
        if (wantsJson(req)) {
            return res.json({ success: true, data: school });
        }
        res.render('schools/view', { school, title: school.name });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSchool = async (req, res) => {
    try {
        const { error, value } = createSchoolSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const school = await schoolsService.createSchool(value);
        res.status(201).json({ success: true, message: 'School created successfully', data: school });
    } catch (error) {
        // Handle unique constraint violation for email
        if (error.code === 'P2002' && error.meta.target.includes('email')) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSchool = async (req, res) => {
    try {
        const { error, value } = updateSchoolSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const school = await schoolsService.updateSchool(req.params.id, value);
        res.json({ success: true, message: 'School updated successfully', data: school });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'School not found' });
        if (error.code === 'P2002' && error.meta.target.includes('email')) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteSchool = async (req, res) => {
    try {
        await schoolsService.deleteSchool(req.params.id);
        res.json({ success: true, message: 'School deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'School not found' });
        res.status(500).json({ success: false, message: error.message });
    }
};
