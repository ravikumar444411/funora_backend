module.exports = {
    apps: [
        {
            name: "funora-prod",
            script: "src/server.js",
            env: {
                NODE_ENV: "production",
                ENV_FILE: ".env.production"
            }
        },
        {
            name: "funora-staging",
            script: "src/server.js",
            env: {
                NODE_ENV: "staging",
                ENV_FILE: ".env.staging"
            }
        }
    ]
};
