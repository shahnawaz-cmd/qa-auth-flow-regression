const createDVHStyleConfig = (name: string, domain: string, batch: number) => ({
    name,
    signupUrl: `https://${domain}/signup`,
    loginUrl: `https://${domain}/login`,
    forgotPasswordUrl: `https://${domain}/forgot-password`,
    apiEndpoint: '/api-cwa/register',
    loginApiEndpoint: '/api-cwa/login',
    forgotApiEndpoint: '/api-cwa/reset-password',
    timeout: 25000,
    selectors: {
        email: 'input[name="email"]',
        password: 'input[name="password"]',
        confirmPassword: 'input[name="confirmPassword"]',
        phone: 'input[name="phone"]',
        submit: 'button[type="submit"]'
    },
    batch
});

export const SITE_CONFIGS = {
    // Batch 1 (5 sites)
    DVH: createDVHStyleConfig('DVH', 'detailedvehiclehistory.com', 1),
    SCC: {
        name: 'SCC',
        signupUrl: 'https://smartcarcheck.uk/members/signup',
        loginUrl: 'https://smartcarcheck.uk/members/login',
        forgotPasswordUrl: 'https://smartcarcheck.uk/members/forgot-password',
        apiEndpoint: '/api-cwa/register',
        loginApiEndpoint: '/members/api/login',
        forgotApiEndpoint: '/members/api/user/reset-password',
        timeout: 25000,
        selectors: {
            email: 'input[name="email"]',
            password: 'input[name="password"]',
            submit: 'button[type="submit"]'
        },
        batch: 1
    },
    FORD: createDVHStyleConfig('FORD', 'fordwindowstickerlookup.com', 1),
    VSR: createDVHStyleConfig('VSR', 'vehiclesreport.com', 1),
    CD: {
        name: 'CD',
        signupUrl: 'https://classicdecoder.com/auth/signup',
        loginUrl: 'https://classicdecoder.com/auth/login',
        forgotPasswordUrl: 'https://classicdecoder.com/auth/forgot-password',
        apiEndpoint: '/api/register',
        loginApiEndpoint: '/api/login',
        forgotApiEndpoint: '/api/user/reset-password',
        timeout: 25000,
        selectors: {
            email: 'textbox[name="Enter email address*"]',
            password: 'input[name="password"]',
            confirmPassword: 'input[name="confirmPassword"]',
            checkbox: 'checkbox',
            submit: 'button[name="Sign up"]'
        },
        batch: 1
    },

    // Batch 2 (5 sites)
    GMC: createDVHStyleConfig('GMC', 'gmcwindowsticker.com', 2),
    GM: createDVHStyleConfig('GM', 'gmwindowstickers.com', 2),
    HONDA: createDVHStyleConfig('HONDA', 'hondawindowsticker.com', 2),
    HYUNDAI: createDVHStyleConfig('HYUNDAI', 'hyundaiwindowsticker.com', 2),
    INFINITI: createDVHStyleConfig('INFINITI', 'infinitiwindowsticker.com', 2),

    // Batch 3 (5 sites)
    JEEP: createDVHStyleConfig('JEEP', 'jeepwindowsticker.com', 3),
    KIA: createDVHStyleConfig('KIA', 'kiawindowsticker.com', 3),
    LEXUS: createDVHStyleConfig('LEXUS', 'lexuswindowsticker.com', 3),
    LINCOLN: createDVHStyleConfig('LINCOLN', 'lincolnwindowsticker.com', 3),
    MCLAREN: createDVHStyleConfig('MCLAREN', 'mclarenwindowsticker.com', 3),

    // Batch 4 (5 sites)
    MERCEDES: createDVHStyleConfig('MERCEDES', 'mercedesbenzwindowsticker.com', 4),
    MINI: createDVHStyleConfig('MINI', 'minicooperwindowsticker.com', 4),
    MITSUBISHI: createDVHStyleConfig('MITSUBISHI', 'mitsubishiwindowsticker.com', 4),
    PORSCHE: createDVHStyleConfig('PORSCHE', 'porschewindowsticker.com', 4),
    RAM: createDVHStyleConfig('RAM', 'ramwindowsticker.com', 4),

    // Batch 5 (5 sites)
    SUBARU: createDVHStyleConfig('SUBARU', 'subaruwindowstickers.com', 5),
    TOYOTA: createDVHStyleConfig('TOYOTA', 'toyotawindowsticker.com', 5),
    VOLKSWAGEN: createDVHStyleConfig('VOLKSWAGEN', 'volkswagenwindowsticker.com', 5),
    VOLVO: createDVHStyleConfig('VOLVO', 'volvowindowsticker.com', 5),
    VW: createDVHStyleConfig('VW', 'vwwindowstickers.com', 5),

    // Batch 6 (5 sites)
    ALFAROMEO: createDVHStyleConfig('ALFAROMEO', 'alfaromeowindowsticker.com', 6),
    AUDI: createDVHStyleConfig('AUDI', 'audiwindowsticker.com', 6),
    BMW: createDVHStyleConfig('BMW', 'bmwwindowsticker.com', 6),
    BUICK: createDVHStyleConfig('BUICK', 'buickwindowsticker.com', 6),
    CADILLAC: createDVHStyleConfig('CADILLAC', 'cadillacwindowsticker.com', 6),

    // Batch 7 (4 sites)
    CHEVROLET: createDVHStyleConfig('CHEVROLET', 'chevroletwindowsticker.com', 7),
    CHRYSLER: createDVHStyleConfig('CHRYSLER', 'chryslerwindowsticker.com', 7),
    DODGE: createDVHStyleConfig('DODGE', 'dodgewindowsticker.com', 7),
    FORDVIN: createDVHStyleConfig('FORDVIN', 'fordwindowstickerbyvin.com', 7),

    // Batch 8 (4 sites)
    VEHICLEHISTORY_EU: createDVHStyleConfig('VEHICLEHISTORY_EU', 'vehiclehistory.eu', 8),
    MOTORCYCLEVIN: createDVHStyleConfig('MOTORCYCLEVIN', 'motorcyclevinlookup.com', 8),
    VINNUMBER_CA: createDVHStyleConfig('VINNUMBER_CA', 'vinnumber.ca', 8),
    INSTANTVINREPORTS: {
        name: 'INSTANTVINREPORTS',
        signupUrl: 'https://instantvinreports.com/members/signup',
        loginUrl: 'https://instantvinreports.com/members/login',
        forgotPasswordUrl: 'https://instantvinreports.com/members/forgot-password',
        apiEndpoint: '/api-cwa/register',
        loginApiEndpoint: '/api-cwa/login',
        forgotApiEndpoint: '/api-cwa/reset-password',
        timeout: 25000,
        selectors: {
            email: 'input[name="email"]',
            password: 'input[name="password"]',
            confirmPassword: 'input[name="confirmPassword"]',
            phone: 'input[name="phone"]',
            submit: 'button[type="submit"]'
        },
        batch: 8
    }
};
