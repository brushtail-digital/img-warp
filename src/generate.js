import JSZip from 'jszip';

export async function generateImageZip(bgs, fgs, q) {
    const aa = 1;
    const canvas = fx.canvas();
    const bgBitmaps = await Promise.all(
        bgs.map((img) => createImageBitmap(img.file))
    );
    const fgBitmaps = await Promise.all(
        fgs.map((img) => createImageBitmap(img.file))
    );
    const backgrounds = bgs.map((img, i) => ({
        name: img.file.name,
        bitmap: bgBitmaps[i],
        before: [
            0,
            0,
            bgBitmaps[i].width,
            0,
            bgBitmaps[i].width,
            bgBitmaps[i].height,
            0,
            bgBitmaps[i].height,
        ],
        after: [img.x1, img.y1, img.x2, img.y2, img.x3, img.y3, img.x4, img.y4],
    }));
    const foregrounds = fgs.map((img, i) => ({
        name: img.file.name,
        texture: canvas.texture(fgBitmaps[i]),
    }));

    const zip = new JSZip();
    const dest = zip.folder('images');
    for (const bg of backgrounds) {
        const w = bg.bitmap.width * aa;
        const h = bg.bitmap.height * aa;
        for (const fg of foregrounds) {
            canvas
                .draw(fg.texture, w, h)
                .perspective(
                    bg.before.map((x) => x * aa),
                    bg.after.map((x) => x * aa)
                )
                .update();
            const output = document.createElement('canvas');
            output.width = bg.bitmap.width;
            output.height = bg.bitmap.height;
            const context = output.getContext('2d');
            context.drawImage(bg.bitmap, 0, 0);
            context.drawImage(canvas, 0, 0, bg.bitmap.width, bg.bitmap.height);
            const blob = await new Promise((resolve) =>
                output.toBlob(resolve, 'image/jpeg', q)
            );
            const bgName = bg.name.substr(0, bg.name.lastIndexOf('.'));
            const fgName = fg.name.substr(0, fg.name.lastIndexOf('.'));
            dest.file(`${bgName}-${fgName}.jpg`, blob);
        }
    }

    return await zip.generateAsync({ type: 'blob' });
}
