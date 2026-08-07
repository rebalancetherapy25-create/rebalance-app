const { v2: cloudinary } = require('cloudinary');
cloudinary.config({
    cloud_name: 'mock_cloud_name',
    api_key: 'mock_api_key',
    api_secret: 'mock_api_secret',
});
cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', function(error, result) {
    if(error) console.error("Error:", error);
    else console.log("Result:", result);
});
