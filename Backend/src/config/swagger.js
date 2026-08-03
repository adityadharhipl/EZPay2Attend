const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EZPay2Attend API',
            version: '1.0.0',
            description: 'API Documentation for EZPay2Attend Backend',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            },
        },
        security: [
            {
                bearerAuth: []
            }
        ],
    },
    apis: ['./src/modules/**/*.routes.js'], // Load annotations from all route files
};

const specs = swaggerJsDoc(options);

const uiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none; }
        .theme-toggle { 
            position: fixed; top: 25px; right: 25px; z-index: 9999; 
            background: #ffffff; color: #333; border: 1px solid #eaeaea; 
            border-radius: 50%; cursor: pointer; width: 50px; height: 50px; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .theme-toggle:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
        .bulb-off { position: relative; display: inline-block; }
        .bulb-off::after { 
            content: ''; position: absolute; top: 50%; left: -10%; 
            width: 120%; height: 3px; background: #333; 
            transform: translateY(-50%) rotate(-45deg); border-radius: 2px; 
        }
        body.dark-mode { filter: invert(1) hue-rotate(180deg); background: rgb(17, 17, 17); }
        body.dark-mode .theme-toggle { filter: invert(1) hue-rotate(180deg); background: #2a2a2a; border-color: #444; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
    `,
    customJsStr: `
        window.addEventListener('load', function() {
            var btn = document.createElement("button");
            btn.innerHTML = '<span class="bulb-off">💡</span>';
            btn.className = "theme-toggle";
            btn.title = "Toggle Dark Mode";
            
            btn.onclick = function() {
                document.body.classList.toggle("dark-mode");
                if (document.body.classList.contains("dark-mode")) {
                    btn.innerHTML = '<span>💡</span>';
                    localStorage.setItem("swagger-theme", "dark");
                } else {
                    btn.innerHTML = '<span class="bulb-off">💡</span>';
                    localStorage.setItem("swagger-theme", "light");
                }
            };
            document.body.appendChild(btn);
            
            if (localStorage.getItem("swagger-theme") === "dark") {
                document.body.classList.add("dark-mode");
                btn.innerHTML = '<span>💡</span>';
            }
        });
    `,
    customSiteTitle: "EZPay2Attend API Docs"
};

module.exports = { specs, uiOptions };
