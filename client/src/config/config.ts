export type AppConfig = {
    apiBaseUrl: string;
    appName: string;
    teamId: string;
    teamName?: string;
    teamFacebookUrl?: string;
    teamInstagramUrl?: string;
    teamCeskyFlorbalUrl?: string;

};

const defaultConfig: AppConfig = {
    apiBaseUrl: "/api",
    appName: "SpravujTym",
    teamName: "Blue Horses Stochov",
    teamId: "699ec4679a3aebfee8e290c5",
    teamFacebookUrl: "https://www.facebook.com/bluehorses.florbal/?locale=cs_CZ",
    teamInstagramUrl: "https://www.instagram.com/bluehorses_stochov/",
    teamCeskyFlorbalUrl: "https://www.ceskyflorbal.cz/search/team/?q=blue+horses"
};

export const config: AppConfig = {
    ...defaultConfig,
    ...(window as any).__APP_CONFIG__
};