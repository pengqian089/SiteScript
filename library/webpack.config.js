const path = require('path');

module.exports = (env) => {
    console.log(env);
    return {
        entry: './src/video/index.js',
        devtool: 'source-map',
        output: {
            filename: 'video-main.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
            library: {
                name: "dpz.video",
                type: "umd"
            }
        },
        // externals: [
        //     /^artplayer.+$/
        // ],
    }
};