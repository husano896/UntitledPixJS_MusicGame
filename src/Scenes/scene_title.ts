import { Window_BPM } from './window_bpm';
import * as PIXI from 'pixi.js';

import { Version, GameConsts } from '../constants';
import { IChart, INote, NoteType } from '../Interfaces/IChart';
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
	// 傳統版拍點顯示
	classicNoteGraphics: PIXI.Graphics;

	// 目前時間(秒)
	time: number;

	// 編輯中拍點類型
	noteType: NoteType;
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
	DISPLAYSECONDS: number = 2;

	// 音樂BPM
	BPMList: Array<[number, number]>;

	// 計算用：每拍秒數
	secPerBeat: number;

	// 輔助小節線繪製間格 ( 8 = 1/8, 16 = 1/16)
	assistDividerDivideNumber = 4;

	// 幾分音符的支援
	divideNumbers = [1, 2, 4, 8, 12, 16, 24, 32, 48, 64];

	// 覺得顯示晚於音樂 ( 視覺拍點還沒到音樂卻到了)時請調高

	// 已有拍點
	notes: INote[];

	// 最後一次發出提示聲的Note
	lastTickNote: any;

	// 偵錯用文字
	debugText: PIXI.Text;

	statusText: PIXI.Text;

	BPMText: PIXI.Text;

	hiSpeedText: PIXI.Text;

	ctrlText: PIXI.Text;
	// 目前載入的音樂
	music: Howl;

	// 生HTML
	gameContainer: HTMLElement;

	ctrl: boolean;

	// 讀取資源區
	constructor() {
		super();
		this.gameContainer = document.querySelector('#game-container');
		document.oncontextmenu = (ev) => ev.preventDefault();
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		document.addEventListener('keyup', this.onKeyUp.bind(this));
		console.log(this);
		// 背景
		this.addChild(PIXI.Sprite.from($R.Image.bg));

		// 判定線
		this.judgeBar = new PIXI.Graphics();
		this.judgeBar.x = GameConsts.height / 2;
		this.judgeBar.y = GameConsts.height / 2;
		this.judgeBar.lineStyle(16, 0x2266ff);
		this.judgeBar.drawCircle(0, 0, GameConsts.height / 2);

		// 小節線
		this.assistDivider = new PIXI.Graphics();
		this.judgeBar.addChild(this.assistDivider);

		// 拍點
		this.noteGraphics = new PIXI.Graphics();
		this.judgeBar.addChild(this.noteGraphics);

		// 預覽Note
		this.previewGraphics = new PIXI.Graphics();
		this.previewGraphics.alpha = 0.5;
		this.judgeBar.addChild(this.previewGraphics);

		// 速度文字
		this.hiSpeedText = new PIXI.Text(`${this.DISPLAYSECONDS * 1000}`, { fontFamily: 'Arial', fontSize: 18, fill: 0x00cc00, align: 'center' });
		this.hiSpeedText.anchor.set(0.5);
		this.judgeBar.addChild(this.hiSpeedText);

		this.ctrlText = new PIXI.Text(`CTRL開啟`, { fontFamily: 'Arial', fontSize: 30, fill: 0xff5555, align: 'center' });
		this.ctrlText.anchor.set(0.5);
		this.ctrlText.y = 26;
		this.ctrlText.alpha = 0;
		this.judgeBar.addChild(this.ctrlText);

		// 整個圈的Container
		this.addChild(this.judgeBar);

		//
		this.time = 0;
		this.noteType = 1;
		this.noteSize = 1;
		this.previewTime = 0;
		this.previewDegree = 0;
		this.selectedNote = null;
		// 常數
		// 一刻度 = 15度
		this.BPMList = [[0, 165]];

		this.secPerBeat = 60 / this.BPM;
		this.music = $R.Audio.music;
		this.notes = [];

		// 工具列
		const toolBar = this.createToolbar();
		toolBar.x = GameConsts.height;
		this.addChild(toolBar);

		this.debugText = new PIXI.Text('Debug text', { fontFamily: 'Arial', fontSize: 18, fill: 0xffffff, align: 'right' });
		this.debugText.x = 0;
		this.debugText.y = 0;
		this.addChild(this.debugText);

		// 小節分割顯示
		const divideText = new PIXI.Text(`1/${this.assistDividerDivideNumber}拍`,
			{ fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left' })
		divideText.interactive = true;
		divideText.buttonMode = true;
		divideText.on('pointerdown', (() => {
			// 設定分割數
			this.assistDividerDivideNumber = this.divideNumbers[
				(this.divideNumbers.findIndex(v => v === this.assistDividerDivideNumber) + 1) % this.divideNumbers.length];
			divideText.text = `1/${this.assistDividerDivideNumber}拍`;
		}).bind(this));
		divideText.x = GameConsts.width - 96;
		divideText.y = 48 + 8;

		this.addChild(divideText);

		// Note 工具列
		const noteToolBar = this.createNoteTypeToolbar();
		noteToolBar.x = GameConsts.width - 96;
		noteToolBar.y = divideText.y + 24 + 8;
		this.addChild(noteToolBar);

		// BPM
		this.BPMText = new PIXI.Text(`BPM: ${this.BPM}`, { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left' });
		this.BPMText.x = toolBar.x;
		this.BPMText.y = toolBar.y + 48;
		this.BPMText.interactive = true;
		this.BPMText.buttonMode = true;
		this.BPMText.on('pointerdown', this.changeBPM.bind(this));
		this.addChild(this.BPMText);

		// 傳統版拍點顯示
		this.classicNoteGraphics = new PIXI.Graphics();
		this.classicNoteGraphics.x = noteToolBar.x - 144 - 32;
		this.classicNoteGraphics.y = noteToolBar.y;
		this.addChild(this.classicNoteGraphics);

		// 重整前提示
		window.onbeforeunload = () => confirm('Are you sure you want to quit?');

		// 滑鼠滾輪事件
		document.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);

		// 加Note事件綁定在判定線上
		this.judgeBar.interactive = true;
		this.judgeBar.buttonMode = true;
		this.interactive = true;
		this.on('pointerdown', this.onMouseDown.bind(this));
		this.on('pointermove', this.onMouseMove.bind(this));
	}

	update(delta) {

		// 與歌曲同步目前時間點
		this.time = this.music.seek();

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

		// 更新經典拍點顯示
		this.updateClassicLane();
	}

	createToolbar() {
		const container = new PIXI.Container();
		// 讀檔按鈕
		const loadButton = PIXI.Sprite.from($R.Image.iconLoad);
		loadButton.on('pointerdown', this.loadChart.bind(this));
		loadButton.x = 0;
		container.addChild(loadButton);

		// 存檔按鈕
		const saveButton = PIXI.Sprite.from($R.Image.iconSave);
		saveButton.on('pointerdown', this.saveChart.bind(this));
		saveButton.x = loadButton.x + 48;

		container.addChild(saveButton);

		// 播放按鈕
		const playButton = PIXI.Sprite.from($R.Image.iconPlay);
		playButton.on('pointerdown', () => {
			this.music.playing() ? this.music.pause() : this.music.play();
		});
		playButton.x = saveButton.x + 48 + 8;

		container.addChild(playButton);

		// 暫停按鈕
		const pauseButton = PIXI.Sprite.from($R.Image.iconPause);
		pauseButton.on('pointerdown', () => {
			this.music.pause()
		});
		pauseButton.x = playButton.x + 48;

		container.addChild(pauseButton);

		// 回放按鈕
		const rewindButton = PIXI.Sprite.from($R.Image.iconRewind);
		rewindButton.on('pointerdown', () => {
			this.music.seek(0);
		});
		rewindButton.x = pauseButton.x + 48;

		container.addChild(rewindButton);

		// 選擇音樂按鈕
		const selMusicButton = PIXI.Sprite.from($R.Image.iconQueueMusic);
		selMusicButton.on('pointerdown', this.loadMusic.bind(this));
		selMusicButton.x = rewindButton.x + 48;

		container.addChild(selMusicButton);

		// 狀態文字
		this.statusText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'left' });
		this.statusText.x = selMusicButton.x + 48 + 8;
		container.children.forEach(c => {
			c.interactive = true;
			c.buttonMode = true;
		})
		container.addChild(this.statusText);
		container.addChild(container);

		return container;
	}

	// 設定Note類型的Toolbar
	createNoteTypeToolbar() {
		const container = new PIXI.Container();

		// 設定Note類型
		const noteTypeContainers = [
			{ name: 'Click', noteType: NoteType.CLICK, color: 0x0 },
			{ name: 'Catch', noteType: NoteType.CATCH, color: 0xffff00 },
			{ name: 'Long', noteType: NoteType.LONG, color: 0x00FFFF },
			{ name: 'LRotate', noteType: NoteType.LSPIN, color: 0xFF3333 },
			{ name: 'RRotate', noteType: NoteType.RSPIN, color: 0x3333FF }
		].map((noteType, index: number) => {
			const c = new PIXI.Container();
			const rect = new PIXI.Graphics();
			const text = new PIXI.Text(noteType.name, { fontFamily: 'Arial', fontSize: 24, fill: noteType.color, align: 'center' });
			rect.lineStyle(2, 0xFFFFFF, 0.8);
			rect.beginFill(0xBBBBBB);
			rect.drawRect(0, 0, 96, 32);
			rect.endFill();
			text.x = 4;
			c.y = (32 + 8) * index;
			c.addChild(rect);
			c.addChild(text);
			c.interactive = true;
			c.buttonMode = true;
			c.on('pointerdown', () => {
				this.noteType = noteType.noteType;
				if (this.selectedNote) { this.selectedNote.type = noteType.noteType };
			});
			return c;
		});
		// 設定Note大小
		const noteSizeContainers = [
			{ name: 'Small', size: 1 },
			{ name: 'Medium', size: 2 },
			{ name: 'Large', size: 3 },
			{ name: 'Full', size: 99 },
		].map((noteType, index: number) => {
			const c = new PIXI.Container();
			const rect = new PIXI.Graphics();
			const text = new PIXI.Text(noteType.name, { fontFamily: 'Arial', fontSize: 24, fill: 0x0, align: 'center' });
			rect.lineStyle(2, 0xFFFFFF, 0.8);
			rect.beginFill(0xBBBBBB);
			rect.drawRect(0, 0, 96, 32);
			rect.endFill();
			text.x = 4;
			c.y = (32 + 8) * index + 240; // 192 要改成NoteType最底y
			c.addChild(rect);
			c.addChild(text);
			c.interactive = true;
			c.buttonMode = true;
			c.on('pointerdown', () => {
				this.noteSize = noteType.size;
				if (this.selectedNote) { this.selectedNote.size = noteType.size };
			});
			return c;
		});
		noteTypeContainers.forEach(c => container.addChild(c));
		noteSizeContainers.forEach(c => container.addChild(c));
		return container;
	}

	getlineSizeByTime(timeSec, maxSize) {
		// displayseconds更小時, rad會變成負值而不顯示
		return maxSize * (1 - (timeSec - this.time) / this.DISPLAYSECONDS);
	}

	getRadiusByTime(timeSec: number) {
		if (this.time > timeSec) {
			return 0;
		}
		// displayseconds更小時, rad會變成負值而不顯示
		// 修正透視得把時間影響scale的係數調小, 這邊為0.8 + 基礎0.2
		return (GameConsts.height / 2) * (1 - (timeSec - this.time) / this.DISPLAYSECONDS) * 0.8 +
			(GameConsts.height / 2) * 0.2;
	}

	updateJudgeBar() {
		// 判定線配合節奏閃爍
		this.judgeBar.alpha = 1 - 0.25 * Math.sin((this.time % (this.secPerBeat * 4)) / this.secPerBeat * Math.PI);
	}
	updateNotes() {
		this.noteGraphics.clear();

		this.notes.forEach(n => {
			// 輔助音播放
			if (this.music.playing()) {
				if (this.time > n.time) {
					if (!this.lastTickNote || this.lastTickNote.time < n.time) {
						$R.Audio.tick.play();
						this.lastTickNote = n;
					}
				}
			}
			// Note還在畫面上時且距離還沒有很遠時繪製
			// 會繪製兩秒內的Note
			if (this.time <= n.time && n.time - this.time < this.DISPLAYSECONDS ||
				// 長條的判定
				n.nextNode && (n.time <= this.time && this.time <= n.nextNode.time)) {

				const alpha = this.selectedNote !== n ? 1 : 1 + Math.sin(new Date().getTime() / 100) * 0.5;
				if (n.time > this.time) {
					const lineSize = this.getlineSizeByTime(n.time < this.time ? this.time : n.time, 16);
					this.setLineStyleByType(this.noteGraphics, n.type, lineSize, alpha);

					// x, y, 半徑
					const rad = this.getRadiusByTime(n.time);

					// / 57.2958
					const rotation = n.rotation / 57.2958;
					// 角度0時為3點鐘方向

					this.noteGraphics.arc(0, 0, rad,
						-0.19 * (n.size || 1) + rotation - Math.PI / 2,
						0.19 * (n.size || 1) + rotation - Math.PI / 2);
					// 針對長條下一個節點的繪製
				}
				if (n.nextNode && n.type === NoteType.LONG) {
					// 開始點的繪製
					// this.noteGraphics.lineStyle(0);
					this.noteGraphics.beginFill(0x00aaaa, alpha / 2);

					const nextNode = n.nextNode;

					if (this.time > n.time) {
						// 目前時間晚於起始點則計算目前位置
						const currentRotation = (this.getCurrentRailRotationByTime(n, this.time)) / 57.2958;
						console.log(currentRotation);
						this.noteGraphics.arc(0, 0, this.getRadiusByTime(this.time),
							-0.19 * (n.size || 1) + currentRotation - Math.PI / 2,
							0.19 * (n.size || 1) + currentRotation - Math.PI / 2);
					}
					// 非線性比較難搞
					//if (nextNode.mathFunc !== 'linear') {

					//} else {
					const maxTime = this.time + this.DISPLAYSECONDS;
					const nextNodeTime = nextNode.time > maxTime ? maxTime : nextNode.time
					const nextNodeRad = this.getRadiusByTime(nextNodeTime);
					const nextRotation = (n.rotation + nextNode.delta) / 57.2958;
					this.noteGraphics.arc(0, 0, nextNodeRad,
						-0.19 * (n.size || 1) + nextRotation - Math.PI / 2,
						0.19 * (n.size || 1) + nextRotation - Math.PI / 2);
					//}
					this.noteGraphics.endFill();
					this.noteGraphics.endHole();
				} else {
					// 沒有endHole會讓Arc跟下一個繪製的Arc連在一起
					this.noteGraphics.endHole();
				}

			}
		});
	}

	// 小節線
	updateAssistDivider() {
		this.assistDivider.clear();
		// 距離0時最大顯示lineSize = 高/2

		// 開始畫第一個小節線的時間點
		// 15 = (60 / 4)
		const stepTime = (60 * 4 / this.BPM) / this.assistDividerDivideNumber;

		const startTime = Math.floor(this.time / stepTime) * (stepTime);
		for (let time = startTime; time < startTime + this.DISPLAYSECONDS; time += stepTime) {

			// 已過去的不再繪製
			if (time < this.time) {
				continue;
			}
			// 避免浮點運算誤差, 相差一小段時間的判定在小節線上
			const secPerMesure = (60 * 4 / this.BPM);
			const v = (time % secPerMesure) / secPerMesure;
			// 小節線
			const isOnBarLine = v < 0.01 || v > 0.99;
			// 拍子線
			const secPerBeat = (60 / this.BPM);
			const v2 = (time % secPerBeat) / secPerBeat;
			const isOnBarBeat = v2 < 0.01 || v2 > 0.99;

			const lineSize = this.getlineSizeByTime(time, isOnBarLine ? 8 : 4);
			// 時間差距越小圈圈越大
			const rad = this.getRadiusByTime(time)
			// 剛好在小節線上的加亮判定
			this.assistDivider.lineStyle(lineSize, isOnBarLine ? 0xa0a0a0 : (isOnBarBeat ? 0x707070 : 0x303030), 1);
			this.assistDivider.drawCircle(0, 0, rad);
		}
	}

	updatePreviewGraphics() {
		this.previewGraphics.clear();
		const lineSize = this.getlineSizeByTime(this.previewTime, 16);
		this.setLineStyleByType(this.previewGraphics, this.noteType, lineSize, 1);
		this.previewGraphics.arc(0, 0, this.getRadiusByTime(this.previewTime),
			-0.19 * (this.noteSize) - Math.PI / 2,
			0.19 * (this.noteSize) - Math.PI / 2);
	}

	updateStatusText() {
		this.statusText.text = `Time: ${this.time.toFixed(4)}\nNotes: ${this.notes.length}`;
	}

	updateClassicLane() {
		this.classicNoteGraphics.clear();

		const width = 160;
		const height = 600;
		const noteWidth = 18;
		const noteHeight = 6;

		// 小節線繪製
		const stepTime = (60 / this.BPM);
		const startTime = Math.ceil(this.time / stepTime) * (stepTime);

		for (let time = startTime; time < startTime + this.DISPLAYSECONDS * 2; time += stepTime) {
			// 過去的小節線不再繪製
			if (time < this.time) {
				continue;
			}
			const secPerMesure = (60 * 4 / this.BPM);
			const v = (time % secPerMesure) / secPerMesure;
			// 小節線
			// 避免浮點運算誤差, 相差一小段時間的判定在小節線上
			const isOnBarLine = v < 0.01 || v > 0.99;

			const lineSize = isOnBarLine ? 2 : 1;
			const y = height * (1 - (time - this.time) / this.DISPLAYSECONDS / 2);
			this.classicNoteGraphics.lineStyle(lineSize, isOnBarLine ? 0xa0a0a0 : 0x707070);
			this.classicNoteGraphics.beginFill(isOnBarLine ? 0xa0a0a0 : 0x707070);
			this.classicNoteGraphics.drawRect(0, y, width, lineSize);
			this.classicNoteGraphics.endFill();
		}

		// 拍點繪製 
		this.notes.forEach(n => {
			// Note還在畫面上時且距離還沒有很遠時繪製
			// 會繪製兩秒內的Note
			const displaySeconds = this.DISPLAYSECONDS * 2;
			if (this.time <= n.time && n.time - this.time < displaySeconds ||
				// 長條的判定
				n.nextNode && (n.time <= this.time && this.time <= n.nextNode.time)) {

				const alpha = this.selectedNote !== n ? 1 : 1 + Math.sin(new Date().getTime() / 100) * 0.5;

				this.setLineStyleByType(this.classicNoteGraphics, n.type, 2, alpha);

				// 一般Note的繪製
				if (n.time > this.time) {
					const y = height * (1 - (n.time - this.time) / displaySeconds);
					this.classicNoteGraphics.beginFill(this.classicNoteGraphics.line.color, 1);
					this.classicNoteGraphics.drawRect(0, y - noteHeight, noteWidth, noteHeight);
					this.classicNoteGraphics.endFill();
				}
				// 針對長條的繪製
				if (n.type === NoteType.LONG && n.nextNode && this.time + displaySeconds > n.nextNode.time && this.time < n.nextNode.time) {
					const nextNode = n.nextNode;
					// 現在時間晚於Note開始時間時, 使用目前時間, 否則使用Note開始時間
					const startTime = this.time > n.time ? this.time : n.time;
					// Note終點比可視時間範圍還晚時, 使用可視範圍, 否則使用下一節點時間
					const finishTime = this.time + displaySeconds < nextNode.time ? this.time + displaySeconds : nextNode.time;
					// Note終點比可視時間範圍還晚時, 顯示於最上面, 否則使用下一節點時間
					const timeLengthPercent = (finishTime - startTime) / displaySeconds;
					const noteHeight = height * timeLengthPercent;
					const y = (this.time + displaySeconds < nextNode.time) ? 0 : height * (1 - (startTime - this.time) / displaySeconds) - noteHeight;

					this.classicNoteGraphics.beginFill(this.classicNoteGraphics.line.color, 0.5);
					this.classicNoteGraphics.drawRect(noteWidth + 8, y, noteWidth, noteHeight);
					this.classicNoteGraphics.endFill();

				}
			}
		});
	}

	// 更新目前預覽Note的時間
	// TODO: 變速對應
	updatePreviewTime(distance: number) {

		const height = this.judgeBar.height;
		const selectedTime = Math.round(
			(this.time + this.DISPLAYSECONDS * (height / 2 - distance) / (height / 2)) / (240 / this.BPM / this.assistDividerDivideNumber)
		) * (240 / this.BPM / this.assistDividerDivideNumber);

		this.previewTime = selectedTime;
	}
	// 以時間和角度取得點擊到的Note
	getNoteByTimeAndRotation(time, rotation) {
		return this.notes.find(n =>
			// 必須要是在畫面上的Note且按到的時間大於要選的Note的時間
			n.time >= this.time && time >= n.time &&
			// 且避免按錯, 按的時間與Note時間間隔要小於節拍分割
			Math.abs(n.time - time) <= (240 / this.BPM / this.assistDividerDivideNumber) &&
			// 而且目前選擇範圍要跟Note顯示範圍重合
			Math.abs((n.rotation - rotation)) < this.DEGREEDIV * (n.size + this.noteSize) / 2
		);
	}

	setLineStyleByType(graphics: PIXI.Graphics, type: NoteType, lineSize: number, alpha: number) {
		switch (type) {
			// 接
			case NoteType.CATCH:
				graphics.lineStyle(lineSize, 0xcccc00, alpha);
				break;
			case NoteType.LONG:
				// 長壓
				graphics.lineStyle(lineSize, 0x00aaaa, alpha);
				break;
			case NoteType.LSPIN:
				// 左旋
				graphics.lineStyle(lineSize, 0xff3333, alpha);
				break;
			case NoteType.RSPIN:
				// 右旋
				graphics.lineStyle(lineSize, 0x3333ff, alpha);
				break;
			// 單壓
			default:
				graphics.lineStyle(lineSize, 0xffffff, alpha);
		}
	}

	// 目前0度是在上面(12點鐘方向)
	onMouseDown(event) {
		console.log(event);
		const lastSelectedNote = this.selectedNote;
		this.selectedNote = this.getNoteByTimeAndRotation(this.previewTime, this.previewGraphics.rotation * 57.2958);

		console.log(this.selectedNote);
		// 按下右鍵時
		if (event.data.button === 2) {
			// 不可以放置比開始點還早的note
			if (this.previewTime < this.time) {
				return;
			}
			// 已有綁定長條時移除長條
			if (this.ctrl && lastSelectedNote.nextNode && lastSelectedNote.type === NoteType.LONG) {
				lastSelectedNote.nextNode = null;
				return;
			}
			if (!this.selectedNote) {
				// 放置note
				const newNote: INote = {
					time: this.previewTime,
					type: this.noteType,

					rotation: Math.round(this.previewGraphics.rotation * 57.2958 + 360) % 360,
					size: this.noteSize
				};
				this.selectedNote = newNote;
				if (this.ctrl && newNote.type === NoteType.LONG && lastSelectedNote.type === NoteType.LONG) {
					// 將上一個Note跟目前的Note接一起
					lastSelectedNote.nextNode = {
						time: this.selectedNote.time,
						delta: this.selectedNote.rotation - lastSelectedNote.rotation,
						size: this.selectedNote.size
					};
				}
				this.notes.push(newNote);

			} else {
				if (this.ctrl && lastSelectedNote.type === NoteType.LONG && this.selectedNote.type === NoteType.LONG) {
					// 將上一個Note跟目前的Note接一起
					lastSelectedNote.nextNode = {
						time: this.selectedNote.time,
						delta: this.selectedNote.rotation - lastSelectedNote.rotation,
						size: this.selectedNote.size
					};
				} else {
					// 移除Note
					this.notes = this.notes.filter(n => n !== this.selectedNote);
					this.selectedNote = null;
				}
			}
		}
	}

	onMouseMove(event) {
		const x = event.data.global.x;
		const y = event.data.global.y;

		// 作為預覽用
		const dx = this.judgeBar.x - x;
		const dy = this.judgeBar.y - y;
		const height = this.judgeBar.height;
		const distance = Math.min(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)), height);
		const dir = Math.atan2(dy, dx) - Math.PI / 2;
		// 以目前播放到的時間 加上 點擊的位置換算的時間
		// 240 = 60 * 4
		// 60 / BPM = 每拍秒數
		// 240 / BPM = 每小節秒數
		this.updatePreviewTime(distance);
		// 把角度以刻度分開
		this.previewGraphics.rotation = (Math.round(dir * 57.2958 / this.DEGREEDIV) * this.DEGREEDIV + 360) % 360 / 57.2958;

	}

	onKeyDown(event: KeyboardEvent) {
		console.log(event);
		const v = this.music.seek();
		if (event.ctrlKey) {
			this.ctrl = true;
			this.ctrlText.alpha = 1;
		}
		switch (event.code) {
			// 設定Note
			case 'KeyQ':
				// 單點
				this.noteType = NoteType.CLICK;
				if (this.selectedNote) { this.selectedNote.type = NoteType.CLICK };
				break;
			case 'KeyW':
				// Catch
				this.noteType = NoteType.CATCH;
				if (this.selectedNote) { this.selectedNote.type = NoteType.CATCH };
				break;
			case 'KeyE':
				// 長壓
				this.noteType = NoteType.LONG;
				if (this.selectedNote) { this.selectedNote.type = NoteType.LONG };
				break;
			case 'KeyR':
				// 左旋
				this.noteType = NoteType.LSPIN;
				if (this.selectedNote) { this.selectedNote.type = NoteType.LSPIN };
				break;
			case 'KeyT':
				// 右旋
				this.noteType = NoteType.RSPIN;
				if (this.selectedNote) { this.selectedNote.type = NoteType.RSPIN };
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
					event.preventDefault();
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
				this.music.playing() ? this.music.pause() : this.music.play();
				this.lastTickNote = this.notes[this.notes.findIndex(n => n.time > this.time) - 1];
				break;
		}
	}
	onKeyUp(event: KeyboardEvent) {
		if (!event.ctrlKey) {
			this.ctrl = false;
			this.ctrlText.alpha = 0;
		}
	}

	onMouseWheel(e: Event) {
		const event = e as WheelEvent;
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

		// 存檔時以時間將Note做排序
		this.notes.sort((a, b) => a.time - b.time);
		const output: IChart = {
			name: '',
			diff: 'normal',
			charter: 'xFly',
			level: 7,
			notes: this.notes,
			rotates: [],
			version: Version,
			beatList: [
				[0, 4, 4]
			],
			BPMList: this.BPMList
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

				const input = JSON.parse(file) as IChart;
				console.log(input);
				// 正式譜面格式?
				this.notes = input.notes;
				this.BPMList = input.BPMList;
				this.BPMText.text = `BPM: ${this.BPM.toString()}`;
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

	// HTML部分
	async changeBPM() {
		const result = await Window_BPM.open(this.gameContainer, this.BPMList);
		console.log(result);
		if (result) {
			this.BPMList = result.map((bpmRow) => {
				// 濾掉無效的BPM設定
				if (!isNaN(bpmRow[0]) && !isNaN(bpmRow[1])) {
					return bpmRow;
				}
				alert(`BPM設定：${bpmRow}無效！`)
				return null;
			}).filter((a) => !!a);
			this.secPerBeat = 60 / this.BPM;
			this.BPMText.text = `BPM: ${this.BPM.toString()}`;
		}
	}

	get BPM() {
		return this.BPMList.find(bpmRow => this.time >= bpmRow[0])?.[1];
	}

	// TODO: 取得目前小節的開始時間
	get currentMeasureStartTime() {
		const passedBPMTime = this.BPMList.map(bpmRow => {
			// 已經過去的時間直接加上
			if (this.time >= bpmRow[0]) {
				return bpmRow[0];
			}
		}).reduce((a, b) => a + b);
		const stepTime = (60 / this.BPM);
		return passedBPMTime + Math.floor((this.time - passedBPMTime) / stepTime) * (stepTime);
	}

	// : 以時間和Note取得目前長條所在的角度
	getCurrentRailRotationByTime(note: INote, time: number): number {
		// 壓根兒還沒開始或根本沒下一個節點
		if (time < note.time || !note.nextNode) {
			return note.rotation;
		}
		const nextNode = note.nextNode;
		// 或已經超出最後一個節點位置了
		if (time > nextNode.time) {
			return note.rotation + nextNode.delta;
		}

		let movement = 0;
		// 真的都不是才進行計算
		switch (nextNode.mathFunc) {
			case 'Si':
				movement = nextNode.delta * 1 - (
					Math.sin(-Math.PI / 2 * (1 - (time - nextNode.time) / (note.nextNode.time - note.time)))
				);
				break;
			case 'So':
				movement = nextNode.delta * Math.sin(Math.PI / 2 * (1 - (nextNode.time - time) / (note.nextNode.time - note.time)));
				break;
			// linear 線性
			default:
				movement = nextNode.delta * (1 - (nextNode.time - time) / (note.nextNode.time - note.time));

		}
		return note.rotation + movement;
	}
}

