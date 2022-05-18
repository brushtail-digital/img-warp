export function sha256(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () =>
            crypto.subtle
                .digest('SHA-256', reader.result)
                .then((hashBuffer) => {
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('');
                    resolve(hashHex);
                })
                .catch(reject);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
