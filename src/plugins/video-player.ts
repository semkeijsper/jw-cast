// require videojs style [and custom videojs theme]
// import
import Vue from 'vue';
// @ts-ignore
import VueVideoPlayer from 'vue-video-player';
// @ts-ignore

import 'video.js/dist/video-js.css';
import 'vue-video-player/src/custom-theme.css';
import '@silvermine/videojs-quality-selector/dist/css/quality-selector.css';

const { videojs } = VueVideoPlayer;

// The following registers the plugin with `videojs`
require('@silvermine/videojs-quality-selector')(videojs);

// mount with global
Vue.use(VueVideoPlayer);
