const createDVHStyleConfig = (name: string, domain: string, batch: number) => ({
    name,
    signupUrl: `https://${domain}/signup`,
    loginUrl: `https://${domain}/login`,
    forgotPasswordUrl: `https://${domain}/forgot-password`,
    apiEndpoint: '/api-cwa/register',
    loginApiEndpoint: '/api-cwa/login',
    forgotApiEndpoint: '/api-cwa/reset-password', // Added
    timeout: 30000,
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
    // Existing
    DVH: createDVHStyleConfig('DVH', 'detailedvehiclehistory.com', 1),
    SCC: {
        name: 'SCC',
        signupUrl: 'https://smartcarcheck.uk/members/signup',
        loginUrl: 'https://smartcarcheck.uk/members/login',
        forgotPasswordUrl: 'https://smartcarcheck.uk/members/forgot-password',
        apiEndpoint: '/api-cwa/register',
        loginApiEndpoint: '/members/api/login',
        forgotApiEndpoint: '/members/api/user/reset-password', // Added
        timeout: 45000,
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
        forgotApiEndpoint: '/api/user/reset-password', // Added
        timeout: 30000,
        selectors: {
            email: 'textbox[name="Enter email address*"]',
            password: 'input[name="password"]',
            confirmPassword: 'input[name="confirmPassword"]',
            checkbox: 'checkbox',
            submit: 'button[name="Sign up"]'
        },
        batch: 1
    },
    // New (Batches 1-4, 10 sites each)
    GMC: createDVHStyleConfig('GMC', 'gmcwindowsticker.com', 1),
    GM: createDVHStyleConfig('GM', 'gmwindowstickers.com', 1),
    HONDA: createDVHStyleConfig('HONDA', 'hondawindowsticker.com', 1),
    HYUNDAI: createDVHStyleConfig('HYUNDAI', 'hyundaiwindowsticker.com', 1),
    INFINITI: createDVHStyleConfig('INFINITI', 'infinitiwindowsticker.com', 1),

    JEEP: createDVHStyleConfig('JEEP', 'jeepwindowsticker.com', 2),
    KIA: createDVHStyleConfig('KIA', 'kiawindowsticker.com', 2),
    LEXUS: createDVHStyleConfig('LEXUS', 'lexuswindowsticker.com', 2),
    LINCOLN: createDVHStyleConfig('LINCOLN', 'lincolnwindowsticker.com', 2),
    MCLAREN: createDVHStyleConfig('MCLAREN', 'mclarenwindowsticker.com', 2),
    MERCEDES: createDVHStyleConfig('MERCEDES', 'mercedesbenzwindowsticker.com', 2),
    MINI: createDVHStyleConfig('MINI', 'minicooperwindowsticker.com', 2),
    MITSUBISHI: createDVHStyleConfig('MITSUBISHI', 'mitsubishiwindowsticker.com', 2),
    PORSCHE: createDVHStyleConfig('PORSCHE', 'porschewindowsticker.com', 2),
    RAM: createDVHStyleConfig('RAM', 'ramwindowsticker.com', 2),

    SUBARU: createDVHStyleConfig('SUBARU', 'subaruwindowstickers.com', 3),
    TOYOTA: createDVHStyleConfig('TOYOTA', 'toyotawindowsticker.com', 3),
    VOLKSWAGEN: createDVHStyleConfig('VOLKSWAGEN', 'volkswagenwindowsticker.com', 3),
    VOLVO: createDVHStyleConfig('VOLVO', 'volvowindowsticker.com', 3),
    VW: createDVHStyleConfig('VW', 'vwwindowstickers.com', 3),
    ALFAROMEO: createDVHStyleConfig('ALFAROMEO', 'alfaromeowindowsticker.com', 3),
    AUDI: createDVHStyleConfig('AUDI', 'audiwindowsticker.com', 3),
    BMW: createDVHStyleConfig('BMW', 'bmwwindowsticker.com', 3),
    BUICK: createDVHStyleConfig('BUICK', 'buickwindowsticker.com', 3),
    CADILLAC: createDVHStyleConfig('CADILLAC', 'cadillacwindowsticker.com', 3),

    CHEVROLET: createDVHStyleConfig('CHEVROLET', 'chevroletwindowsticker.com', 4),
    CHRYSLER: createDVHStyleConfig('CHRYSLER', 'chryslerwindowsticker.com', 4),
    DODGE: createDVHStyleConfig('DODGE', 'dodgewindowsticker.com', 4),
    FORDVIN: createDVHStyleConfig('FORDVIN', 'fordwindowstickerbyvin.com', 4),
    VEHICLEHISTORY_EU: createDVHStyleConfig('VEHICLEHISTORY_EU', 'vehiclehistory.eu', 4),
    MOTORCYCLEVIN: createDVHStyleConfig('MOTORCYCLEVIN', 'motorcyclevinlookup.com', 4),
    VINNUMBER_CA: createDVHStyleConfig('VINNUMBER_CA', 'vinnumber.ca', 4),
    INSTANTVINREPORTS: {
        name: 'INSTANTVINREPORTS',
        signupUrl: 'https://instantvinreports.com/members/signup',
        loginUrl: 'https://instantvinreports.com/members/login',
        forgotPasswordUrl: 'https://instantvinreports.com/members/forgot-password',
        apiEndpoint: '/api-cwa/register',
        loginApiEndpoint: '/api-cwa/login',
        forgotApiEndpoint: '/api-cwa/reset-password',
        timeout: 30000,
        selectors: {
            email: 'input[name="email"]',
            password: 'input[name="password"]',
            confirmPassword: 'input[name="confirmPassword"]',
            phone: 'input[name="phone"]',
            submit: 'button[type="submit"]'
        },
        batch: 1
    }
};
