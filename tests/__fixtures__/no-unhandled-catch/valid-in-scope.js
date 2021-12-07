for (var i = 0; i < 5; i++) {
    try {
        foo(i);
    } catch (err) {
        throw err;
    }
}

function foo(i) {
    try {
        boo(i);
    } catch (e) {
        console.error(e);
    }
}
