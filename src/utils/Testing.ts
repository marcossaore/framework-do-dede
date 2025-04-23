export class Testing {
    private static enabled: boolean = false;
    static enable () {
        this.enabled = true;
    }

    static disable () {
        this.enabled = false;
    }

    static isEnabled () {
        return this.isEnabled;
    }
}