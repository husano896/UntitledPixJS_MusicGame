export class Window_BPM {
    static async open(gameContainer: HTMLElement, currentList: Array<[number, number]>): Promise<Array<[number, number]>> {

        return new Promise((resolve, reject) => {
            const window = document.createElement('div', {});
            window.className = 'dialog';
            window.innerHTML = `<h4>BPM 調整</h4>`;
            const table = document.createElement('table');
            table.innerHTML = `
        <thead>
            <th>時間</th>
            <th>BPM</th>
            <th>動作</th>
        </thead>
        `;

            const CreateTr = () => {
                const tr = document.createElement('tr');
                // 時間
                const tdTime = document.createElement('td');
                const timeInput = document.createElement('input');
                timeInput.type = 'number';
                tdTime.appendChild(timeInput)
                // BPM
                const tdBPM = document.createElement('td');
                const BPMInput = document.createElement('input');
                BPMInput.type = 'number';
                tdBPM.appendChild(BPMInput);
                // 操作按鈕
                const tdButtons = document.createElement('td');
                const addButton = document.createElement('button');
                addButton.className = 'add'
                addButton.innerText = '＋';
                addButton.onclick = (() => {
                    tbody.removeChild(tr);
                }).bind(this);
                tdButtons.appendChild(addButton);
                //
                tr.appendChild(tdTime);
                tr.appendChild(tdBPM);
                tr.appendChild(tdButtons);
                return tr;
            };

            const AppendTr = (time: number, bpm: number) => {
                const tr = document.createElement('tr');
                // 時間
                const tdTime = document.createElement('td');
                const timeInput = document.createElement('input');
                timeInput.type = 'number';
                timeInput.value = time.toString();
                tdTime.appendChild(timeInput)
                // BPM
                const tdBPM = document.createElement('td');
                const BPMInput = document.createElement('input');
                BPMInput.type = 'number';
                BPMInput.value = bpm.toString();
                tdBPM.appendChild(BPMInput);
                // 操作按鈕
                const tdButtons = document.createElement('td');
                const removeButton = document.createElement('button');
                removeButton.className = 'remove';
                removeButton.innerText = '－';
                removeButton.onclick = (() => {
                    tbody.removeChild(tr);
                }).bind(this);
                tdButtons.appendChild(removeButton);

                //
                tr.appendChild(tdTime);
                tr.appendChild(tdBPM);
                // tr.appendChild(tdButtons);
                return tr;
            };

            const tbody = document.createElement('tbody');
            // 新增資料表單
            // tbody.appendChild(CreateTr());

            // 現有資料
            currentList.forEach(v => {
                tbody.appendChild(AppendTr(v[0], v[1]));
            });
            table.appendChild(tbody);
            window.appendChild(table);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions';
            // 取消 & 儲存
            const cancelButton = document.createElement('button');
            cancelButton.className = 'cancel'
            cancelButton.innerText = '取消';
            cancelButton.onclick = (() => {
                gameContainer.removeChild(window);
                resolve(null);
            }).bind(this);

            actionsDiv.appendChild(cancelButton);
            // 取消 & 確認(但還沒儲存到檔案！)
            const saveButton = document.createElement('button');
            saveButton.className = 'ok'
            saveButton.innerText = '確認';
            saveButton.onclick = (() => {
                gameContainer.removeChild(window);

                let bpmList: Array<[number, number]> = [];
                tbody.childNodes.forEach((node) => {
                    const tr = node as HTMLTableRowElement;
                    const time = ((tr.childNodes[0] as HTMLTableCellElement).childNodes[0] as HTMLInputElement).value;
                    const bpm = ((tr.childNodes[1] as HTMLTableCellElement).childNodes[0] as HTMLInputElement).value;
                    bpmList.push([Number(time), Number(bpm)]);
                })
                resolve(bpmList);
                console.log(bpmList);
            }).bind(this);

            actionsDiv.appendChild(saveButton);

            window.appendChild(actionsDiv);
            gameContainer.appendChild(window);
        })
    }
}