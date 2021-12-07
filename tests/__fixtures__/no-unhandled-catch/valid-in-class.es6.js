class A {
    constructor() {
        try { uzz(); } catch (err) { throw err; }
    }

    foo() {
        try { fuzz(); } catch (err) { throw err; }
    }

    static boo() {
        try { buzz(); } catch (err) { throw err; }
    }
}
