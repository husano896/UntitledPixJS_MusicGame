export class MathFunc {
    // 數學函式
    // https://easings.net/zh-tw
    static easeInSine(x: number): number {
        return 1 - Math.cos((x * Math.PI) / 2);
    }
}