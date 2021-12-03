import * as PIXI from 'pixi.js';

import { Version, GameConsts } from '../constants';
import { IChart, INote } from '../Interfaces/IChart';
import { Scene } from './scene';
import $R from '../resources';
import { Howl } from 'howler';
export class Scene_Title extends Scene {
	// 小節線
	assistDivider: PIXI.Graphics;
	// 判定線
	judgeBar: PIXI.Graphics;
	// 拍點顯示
	noteGraphics: PIXI.Graphics;
	// 預覽拍點
	previewGraphics: PIXI.Graphics;

	// 目前時間(秒)
	time: number;

	// 編輯中拍點類型
	noteType: number;
	// 拍點大小
	noteSize: number;

	// 預覽拍點位置
	previewTime: number;

	// 預覽拍點角度
	previewDegree: number;

	// 已選擇的Note
	selectedNote: INote;
	// 常數

	// 一刻度 = 15度
	DEGREEDIV: number = 15;

	// 顯示幾秒內的Note
	DISPLAYSECONDS: number = 3;

	// 音樂BPM
	BPM: number;

	// 計算用：每拍秒數
	secPerBeat: number;

	// 覺得顯示晚於音樂 ( 視覺拍點還沒到音樂卻到了)時請調高
	OFFSET: number;

	// 已有拍點
	notes: INote[];

	// 最後一次發出提示聲的Note
	lastTickNote: any;

	// 偵錯用文字
	debugText: PIXI.Text;

	statusText: PIXI.Text;

	BPMText: PIXI.Text;

	hiSpeedText: PIXI.Text;

	// 工具列
	toolBar: PIXI.Container;
	// 目前載入的音樂
	music: Howl;

	// 讀取資源區
	constructor() {
		super();

		this.on('pointerdown', this.onMouseDown.bind(this));
		this.on('pointermove', this.onMouseMove.bind(this));
		this.on('mousewheel', this.onMouseWheel.bind(this));

		document.oncontextmenu = (ev) => ev.preventDefault();
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		console.log(this);

		this.interactive = true;

		// 小節線
		this.assistDivider = new PIXI.Graphics();
		this.assistDivider.x = GameConsts.height / 2;
		this.assistDivider.y = GameConsts.height / 2;
		this.addChild(this.assistDivider);

		// 判定線
		this.judgeBar = new PIXI.Graphics();
		this.judgeBar.x = this.assistDivider.x;
		this.judgeBar.y = this.assistDivider.y;
		this.judgeBar.lineStyle(16, 0x2266ff);
		this.judgeBar.drawCircle(0, 0, GameConsts.height / 2);

		this.addChild(this.judgeBar);

		// 拍點
		this.noteGraphics = new PIXI.Graphics();
		this.noteGraphics.x = this.assistDivider.x;
		this.noteGraphics.y = this.assistDivider.y;
		this.addChild(this.noteGraphics);

		// 預覽Note
		this.previewGraphics = new PIXI.Graphics();
		this.previewGraphics.alpha = 0.5;
		this.previewGraphics.x = this.assistDivider.x;
		this.previewGraphics.y = this.assistDivider.y;
		this.addChild(this.previewGraphics);

		//
		this.time = 0;
		this.noteType = 1;
		this.noteSize = 1;
		this.previewTime = 0;
		this.previewDegree = 0;
		this.selectedNote = null;
		// 常數
		// 一刻度 = 15度
		this.BPM = 165;

		// 覺得顯示晚於音樂 ( 視覺拍點還沒到音樂卻到了)時請調高
		this.OFFSET = 0.0;
		this.secPerBeat = 60 / this.BPM;

		this.notes = [];

		// 工具列
		this.toolBar = this.createToolbar();
		this.toolBar.x = GameConsts.height;
		this.addChild(this.toolBar);

		this.debugText = new PIXI.Text('Debug text', { fontFamily: 'Arial', fontSize: 18, fill: 0xffffff, align: 'right' });
		this.debugText.x = GameConsts.height;
		this.debugText.y = GameConsts.height - 24;

		this.music = $R.Audio.music;

		// BPM
		this.BPMText = new PIXI.Text(`BPM: ${this.BPM}`, { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left' });
		this.BPMText.x = this.toolBar.x;
		this.BPMText.y = this.toolBar.y + 48;
		this.BPMText.interactive = true;
		this.BPMText.buttonMode = true;
		this.BPMText.on('pointerdown', this.changeBPM.bind(this));
		this.addChild(this.BPMText);

		this.hiSpeedText = new PIXI.Text(`${this.DISPLAYSECONDS * 1000}`, { fontFamily: 'Arial', fontSize: 18, fill: 0x00cc00, align: 'center' });
		this.hiSpeedText.anchor.set(0.5);
		this.hiSpeedText.x = this.assistDivider.x;
		this.hiSpeedText.y = this.assistDivider.y;
		this.addChild(this.hiSpeedText);

		// 重整前提示
		window.onbeforeunload = () => confirm('Are you sure you want to quit?');

		// 滑鼠滾輪事件
		document.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);
	}

	update(delta) {

		// 與歌曲同步目前時間點
		this.time = this.music.seek() + this.OFFSET;

		// 判定線
		this.updateJudgeBar();

		// 重新整理小節線
		this.updateAssistDivider();

		// 重新整理目前note
		this.updateNotes();

		// 重新整理預覽Note
		this.updatePreviewGraphics()

		// 更新狀態文字
		this.updateStatusText();
	}

	createToolbar() {
		const container = new PIXI.Container();
		// 讀檔按鈕
		const loadButton = PIXI.Sprite.from($R.Image.iconLoad);
		loadButton.interactive = true;
		loadButton.buttonMode = true;
		loadButton.on('pointerdown', this.loadChart.bind(this));
		loadButton.x = 0;
		container.addChild(loadButton);

		// 存檔按鈕
		const saveButton = PIXI.Sprite.from($R.Image.iconSave);
		saveButton.interactive = true;
		saveButton.buttonMode = true;
		saveButton.on('pointerdown', this.saveChart.bind(this));
		saveButton.x = loadButton.x + 48;

		container.addChild(saveButton);

		// 播放按鈕
		const playButton = PIXI.Sprite.from($R.Image.iconPlay);
		playButton.interactive = true;
		playButton.buttonMode = true;
		playButton.on('pointerdown', () => {
			this.music.playing() ? this.music.pause() : this.music.play();
		});
		playButton.x = saveButton.x + 48 + 8;

		container.addChild(playButton);

		// 暫停按鈕
		const pauseButton = PIXI.Sprite.from($R.Image.iconPause);
		pauseButton.interactive = true;
		pauseButton.buttonMode = true;
		pauseButton.on('pointerdown', () => {
			this.music.pause()
		});
		pauseButton.x = playButton.x + 48;

		container.addChild(pauseButton);

		// 回放按鈕
		const rewindButton = PIXI.Sprite.from($R.Image.iconRewind);
		rewindButton.interactive = true;
		rewindButton.buttonMode = true;
		rewindButton.on('pointerdown', () => {
			this.music.seek(0);
		});
		rewindButton.x = pauseButton.x + 48;

		container.addChild(rewindButton);

		// 選擇音樂按鈕
		const selMusicButton = PIXI.Sprite.from($R.Image.iconQueueMusic);
		selMusicButton.interactive = true;
		selMusicButton.buttonMode = true;
		selMusicButton.on('pointerdown', this.loadMusic.bind(this));
		selMusicButton.x = rewindButton.x + 48;

		container.addChild(selMusicButton);

		// 狀態文字
		this.statusText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left' });
		this.statusText.x = selMusicButton.x + 48 + 8;
		container.addChild(this.statusText);
		container.addChild(container);

		return container;
	}

	getlineSizeByTime(timeSec, maxSize) {
		// displayseconds更小時, rad會變成負值而不顯示
		return maxSize * (1 - (timeSec - this.time) / this.DISPLAYSECONDS);
	}

	getRadiusByTime(timeSec) {
		if (this.time > timeSec) {
			return 0;
		}
		// displayseconds更小時, rad會變成負值而不顯示
		return (GameConsts.height / 2) * (1 - (timeSec - this.time) / this.DISPLAYSECONDS);
	}

	updateJudgeBar() {
		// 判定線配合節奏閃爍
		this.judgeBar.alpha = 1 - 0.25 * Math.sin((this.time % (this.secPerBeat * 4)) / this.secPerBeat * Math.PI);
	}
	updateNotes() {
		this.noteGraphics.clear();

		this.notes.forEach(n => {
			if (this.time > n.time) {
				if (this.music.playing) {
					if (!this.lastTickNote || (this.lastTickNote && this.lastTickNote.time < n.time)) {
						this.lastTickNote = n;
						if (this.lastTickNote) {
							$R.Audio.tick.play();
						}
					}
				}
			}
			// Note還在畫面上時且距離還沒有很遠時繪製
			// 會繪製兩秒內的Note
			if (this.time <= n.time && n.time - this.time < this.DISPLAYSECONDS) {
				const lineSize = this.getlineSizeByTime(n.time, 16);
				const alpha = this.selectedNote !== n ? 1 : 1 + Math.sin(new Date().getTime() / 100) * 0.5;
				// 接
				switch (n.type) {
					case 2:
						this.noteGraphics.lineStyle(lineSize, 0xaaaa00, alpha);
						break;
					case 3:
						// 長壓
						this.noteGraphics.lineStyle(lineSize, 0x00aaaa, alpha);
						break;
					case 4:
						// 左旋
						this.noteGraphics.lineStyle(lineSize, 0xff3333, alpha);
						break;
					case 5:
						// 右旋
						this.noteGraphics.lineStyle(lineSize, 0x3333ff, alpha);
						break;
					default:
						this.noteGraphics.lineStyle(lineSize, 0xaaaaaa, alpha);
				}


				// x, y, 半徑
				const rad = this.getRadiusByTime(n.time);

				// / 57.2958
				const rotation = n.rotation / 57.2958;
				this.noteGraphics.arc(0, 0, rad,
					-0.19 * (n.size || 1) + rotation - Math.PI / 2,
					0.19 * (n.size || 1) + rotation - Math.PI / 2);
				this.noteGraphics.endHole();
			}
		});
	}

	updateAssistDivider() {
		this.assistDivider.clear();
		// 距離0時最大顯示lineSize = 高/2

		// 開始畫第一個小節線的時間點
		const startTime = Math.floor(this.time / this.secPerBeat / 4) * (this.secPerBeat * 4);
		for (let time = 0; time < 8; time++) {
			const noteTime = startTime + this.secPerBeat * time;
			// 時間差距越小圈圈越大
			const lineSize = this.getlineSizeByTime(noteTime, time%4 === 0? 8 : 4);
			const rad = this.getRadiusByTime(noteTime)
			this.assistDivider.lineStyle(lineSize, 0x222222);
			this.assistDivider.drawCircle(0, 0, rad);
		}
	}

	updatePreviewGraphics() {
		this.previewGraphics.clear();
		const lineSize = this.getlineSizeByTime(this.previewTime, 16);

		switch (this.noteType) {
			// 單點
			case 1:
				this.previewGraphics.lineStyle(lineSize, 0xaaaaaa, 1);
				break;
			// 接
			case 2:
				this.previewGraphics.lineStyle(lineSize, 0xaaaa00, 1);
				break;
			// 長壓
			case 3:
				this.previewGraphics.lineStyle(lineSize, 0x00aaaa, 1);
				break;
			case 4:
				// 左旋
				this.previewGraphics.lineStyle(lineSize, 0xff3333, 1);
				break;
			// 右旋
			case 5:
				this.previewGraphics.lineStyle(lineSize, 0x3333ff, 1);
				break;
			default:
				this.previewGraphics.lineStyle(lineSize, 0x333333, 1);
		}

		this.previewGraphics.arc(0, 0, this.getRadiusByTime(this.previewTime),
			-0.19 * (this.noteSize) - Math.PI / 2,
			0.19 * (this.noteSize) - Math.PI / 2);
	}

	updateStatusText() {
		this.statusText.text = `Time: ${this.time.toFixed(4)}\nNotes: ${this.notes.length}`;
	}

	// 以時間和角度取得點擊到的Note
	getNoteByTimeAndRotation(time, rotation) {
		return this.notes.find(n =>
			time <= n.time &&
			(n.time - time) <= this.secPerBeat &&
			Math.abs((n.rotation - rotation)) < this.DEGREEDIV * n.size 
		);
	}

	// 目前0度是在上面(12點鐘方向)
	onMouseDown(event) {
		console.log(event);
		this.selectedNote = this.getNoteByTimeAndRotation(this.previewTime, this.previewGraphics.rotation * 57.2958);

		console.log(this.selectedNote);
		// 按下右鍵時
		if (event.data.button === 2) {
			// 不可以放置比開始點還早的note
			if (this.previewTime <= this.time) {
				return;
			}
			if (!this.selectedNote) {

				// 放置note
				const newNote = {
					time: this.previewTime,
					type: this.noteType,
					rotation: Math.round(this.previewGraphics.rotation * 57.2958),
					size: this.noteSize
				};
				this.notes.push(newNote);
				this.selectedNote = newNote;
			} else {
				// 移除Note
				this.notes = this.notes.filter(n => n !== this.selectedNote);
				this.selectedNote = null;
			}
		}
	}

	onMouseMove(event) {
		const x = event.data.global.x;
		const y = event.data.global.y;

		// 作為預覽用
		const dx = this.noteGraphics.x - x;
		const dy = this.noteGraphics.y - y;
		const distance = Math.min(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)), GameConsts.height);
		const dir = Math.atan2(dy, dx) - Math.PI / 2;

		// 以目前播放到的時間 加上 點擊的位置換算的時間
		const selectedTime = Math.round(
			(this.time + this.DISPLAYSECONDS * (GameConsts.height / 2 - distance) / (GameConsts.height / 2)) / (this.secPerBeat / 4)
		) * (this.secPerBeat / 4);

		this.previewTime = selectedTime;
		// 把角度以刻度分開
		this.previewGraphics.rotation = Math.round(dir * 57.2958 / this.DEGREEDIV) * this.DEGREEDIV / 57.2958;

		this.debugText.text = `${selectedTime}`;
	}

	onKeyDown(event: KeyboardEvent) {
		console.log(event);
		const v = this.music.seek();
		switch (event.code) {
			// 設定Note
			case 'KeyQ':
				// 單點
				this.noteType = 1;
				if (this.selectedNote) { this.selectedNote.size = 1 };
				break;
			case 'KeyW':
				// Catch
				this.noteType = 2;
				if (this.selectedNote) { this.selectedNote.size = 2 };
				break;
			case 'KeyE':
				// 長壓
				this.noteType = 3;
				if (this.selectedNote) { this.selectedNote.size = 3 };
				break;
			case 'KeyR':
				// 左旋
				this.noteType = 4;
				if (this.selectedNote) { this.selectedNote.size = 4 };
				break;
			case 'KeyT':
				// 右旋
				this.noteType = 5;
				if (this.selectedNote) { this.selectedNote.size = 5 };
				break;

			// 設定Note大小
			case 'Digit1':
				this.noteSize = 1;
				if (this.selectedNote) { this.selectedNote.size = 1 };
				break;
			case 'Digit2':
				this.noteSize = 2;
				if (this.selectedNote) { this.selectedNote.size = 2 };
				break;
			case 'Digit3':
				this.noteSize = 3;
				if (this.selectedNote) { this.selectedNote.size = 3 };
				break;
			case 'Digit9':
				this.noteSize = 99;
				if (this.selectedNote) { this.selectedNote.size = 99 };
				break;
			case 'KeyS':
				if (event.ctrlKey) {
					// 存檔
					this.saveChart();
				}
				break;
			case 'Delete':
				// 刪除Note
				if (this.selectedNote) {
					this.notes = this.notes.filter(n => n !== this.selectedNote);
					this.selectedNote = null;
				}
			// 播放
			case 'ArrowUp':
				this.DISPLAYSECONDS = Math.max(0.1, this.DISPLAYSECONDS - 0.1);
				this.hiSpeedText.text = `${Math.round(this.DISPLAYSECONDS * 1000)}`;
				break;
			case 'ArrowDown':
				this.DISPLAYSECONDS += 0.1;
				this.hiSpeedText.text = `${Math.round(this.DISPLAYSECONDS * 1000)}`;
				break;
			case 'PageUp':
				this.music.seek(v + 10);
				break;
			case 'PageDown':
				this.music.seek(v - 10);
				break;
			case 'Home':
				this.lastTickNote = null;
				this.music.stop();
				break;
			case 'Space':
				this.lastTickNote = this.notes.find(n => n.time > this.time);
				this.music.playing() ? this.music.pause() : this.music.play();
				break;
		}
	}

	onMouseWheel(e: Event) {
		const event = e as WheelEvent;
		console.log(event);
		const v = this.music.seek();
		if (event.deltaY > 0) {
			// 往下滾時
			this.music.seek(v + this.secPerBeat);
		} else if (event.deltaY < 0) {
			// 往上滾時
			this.music.seek(Math.max(0, v - this.secPerBeat));
		}
	}
	saveChart() {
		const output: IChart = {
			name: '',
			diff: 'normal',
			charter: 'xFly',
			level: 7,
			notes: this.notes.sort((a, b) => a.time - b.time),
			rotates: [],
			version: Version
		}
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([JSON.stringify(output)], { type: `text/json` }));
		a.download = 'chart.json';
		a.click();
	}

	loadChart() {
		const a = document.createElement('input');
		a.type = 'file'
		a.accept = '.json';

		a.addEventListener('change', () => {
			const files = a.files;

			if (files.length == 0) return;
			const file = files[0];
			let reader = new FileReader();

			reader.onload = (e) => {
				const file = e.target.result as string;

				const input = JSON.parse(file);
				console.log(input);
				if (input instanceof Array) {
					// 初版：只有Notes
					this.notes = input;
				} else {
					// 正式譜面格式?
					this.notes = (input as IChart).notes;
				}
			};
			reader.onerror = (e) => alert(e.target.error.name);

			reader.readAsText(file);

		});

		a.click();
	}

	loadMusic() {
		const a = document.createElement('input');
		a.type = 'file'

		a.addEventListener('change', () => {
			const files = a.files;

			if (files.length == 0) return;
			const file = files[0];
			let reader = new FileReader();

			reader.onload = () => {
				const f = reader.result as string;
				// Create a Howler sound
				const m = new Howl({
					src: f,
					format: [file.name.split('.').pop().toLowerCase()]
				});
				this.music = m;
			};
			reader.onerror = (e) => alert(e.target.error.name);

			reader.readAsDataURL(file);

		});

		a.click();
	}

	changeBPM() {
		const bpm = parseFloat(prompt('請輸入BPM：'));
		if (bpm !== 0 && !isNaN(bpm)) {
			this.BPM = bpm;
			this.secPerBeat = 60 / bpm;
			this.BPMText.text = `BPM: ${bpm.toString()}`;
		}
	}
}

