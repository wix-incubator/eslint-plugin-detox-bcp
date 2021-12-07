try {
    try {
        a.b;
    } catch (e2) {
        throw e2;
    }
} catch (e1) {
    throw e1;
}
