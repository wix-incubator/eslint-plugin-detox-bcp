try {
    foo();
} catch (err) {
    for (var k in err) {
        boo();
    }
}
