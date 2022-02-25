// 編輯譜面的基本資訊用
// 不是天殺的Metaverse
interface IMeta {
    name: string, charter: string, diff: string, level: number
}

export class Window_Meta {
    static async open(gameContainer: HTMLElement, meta: IMeta): Promise<IMeta> {

        return new Promise((resolve, reject) => {
            const window = document.createElement('div', {});
            window.className = 'dialog';
            window.innerHTML = `<h4>譜面資訊設定</h4>`;
            const table = document.createElement('table');
            table.innerHTML = `
        <thead>
            <th>欄位</th>
            <th>數值</th>
        </thead>
        <tbody>
            <tr>
                <td>曲名</td>
                <td><input required id="name" value="${meta.name}"/ ></td>
            </tr>
            <tr>
                <td>製譜師</td>
                <td><input required id="charter" value="${meta.charter}"/ ></td>
            </tr>
            <tr>
                <td>難度</td>
                <td><input required id="diff" value="${meta.diff}"/ ></td>
            </tr>
            <tr>
                <td>等級</td>
                <td><input required id="level" type="number" value="${meta.level}"/ ></td>
            </tr>
        </tobdy>
        `;

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
                const meta = {
                    name: (table.querySelector('#name') as HTMLInputElement).value || '',
                    charter: (table.querySelector('#charter') as HTMLInputElement).value || '',
                    diff: (table.querySelector('#diff') as HTMLInputElement).value || '',
                    level: parseInt(((table.querySelector('#level') as HTMLInputElement).value || '0'), 10),
                }
                resolve(meta);
                console.log(meta);
            }).bind(this);

            actionsDiv.appendChild(saveButton);

            window.appendChild(actionsDiv);
            gameContainer.appendChild(window);
        })
    }
}