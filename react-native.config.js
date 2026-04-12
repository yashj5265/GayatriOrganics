module.exports = {
    assets: ['./main/src/assets/fonts'],
    project: {
        android: {
            // Must match namespace / applicationId in android/app/build.gradle (drives autolinking.json + ReactNativeApplicationEntryPoint).
            packageName: 'com.gayatriorganics.user',
        },
    },
};
