import { Howl } from 'howler';
import $game from './game';

const $R = {
  Audio: {
    music: new Howl({ src: 'audio/opium_and_purple_haze_dwatt.mp3' }),
    tick: new Howl({ src: 'audio/tick.wav' })
  },
  Image: {
    iconSave: 'imgs/save.png',
    iconLoad: 'imgs/folder_open.png',
    iconPlay: 'imgs/play_arrow.png',
    iconPause: 'imgs/pause_white.png',
    iconRewind: 'imgs/fast_rewind.png',
    iconQueueMusic: 'imgs/queue_music.png',
  }
}
// 圖像處理部分
Object.entries($R.Image).forEach(([key, path]) => $game.loader.add(key, path));

export default $R;