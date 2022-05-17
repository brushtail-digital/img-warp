<script>
    import Image from './Image.svelte';
    import { generateImageZip } from './generate';
    import { tick } from 'svelte';

    let bgs;
    let fgs;
    let downloadLink;

    let images = [];
    let overlays = [];
    let generating = false;
    let download = null;
    let quality = 60;

    async function updateBackgrounds(files) {
        const existing = new Map();
        for (const img of images) {
            existing.set(img.file, img);
        }

        images = await Promise.all(
            files.map(
                (file) =>
                    new Promise((resolve) => {
                        if (existing.has(file)) {
                            resolve(existing.get(file));
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                file,
                                src: reader.result,
                                x1: null,
                                y1: null,
                                x2: null,
                                y2: null,
                                x3: null,
                                y3: null,
                                x4: null,
                                y4: null,
                            });
                            return;
                        };
                        reader.readAsDataURL(file);
                    })
            )
        );
    }

    async function updateForegrounds(files) {
        overlays = await Promise.all(
            files.map(
                (file) =>
                    new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                file,
                                src: reader.result,
                            });
                            return;
                        };
                        reader.readAsDataURL(file);
                    })
            )
        );
    }

    async function generateImages() {
        generating = true;
        const blob = await generateImageZip(images, overlays, quality);
        generating = false;
        download = URL.createObjectURL(blob);
        await tick();
        downloadLink.click();
    }

    $: if (bgs) updateBackgrounds([...bgs]);
    $: if (fgs) updateForegrounds([...fgs]);

    function quadDone(img) {
        return (
            img.x1 !== null &&
            img.y1 !== null &&
            img.x2 !== null &&
            img.y2 !== null &&
            img.x3 !== null &&
            img.y3 !== null &&
            img.x4 !== null &&
            img.y4 !== null
        );
    }

    function generateErrorMessage(images, overlays) {
        const messages = [];
        if (images.length === 0) {
            messages.push('No background images selected.');
        }
        if (overlays.length === 0) {
            messages.push('No foreground images selected.');
        }
        images
            .filter((img) => !quadDone(img))
            .forEach((img) =>
                messages.push(`${img.file.name} does not have a quad set.`)
            );
        return messages.length === 0 ? undefined : messages.join('\n');
    }

    $: outputCount = images.length * overlays.length;
    $: quadsDone = images.every(quadDone);
    $: errorMessage = generateErrorMessage(images, overlays);

    function reset() {
        download = null;
    }
    $: reset(bgs, fgs, images);
</script>

<main>
    <div class="form">
        <div>
            <label>
                <div>Backgrounds:</div>
                <input type="file" accept="image/*" bind:files={bgs} multiple />
            </label>
        </div>
        <div>
            <label>
                <div>Foregrounds:</div>
                <input type="file" accept="image/*" bind:files={fgs} multiple />
            </label>
        </div>

        {#each images as image (image.file)}
            <div>
                <details>
                    <summary
                        >{image.file.name}
                        {#if quadDone(image)}✔{/if}</summary
                    >
                    <div class="image">
                        <Image
                            src={image.src}
                            alt={image.file.name}
                            bind:x1={image.x1}
                            bind:y1={image.y1}
                            bind:x2={image.x2}
                            bind:y2={image.y2}
                            bind:x3={image.x3}
                            bind:y3={image.y3}
                            bind:x4={image.x4}
                            bind:y4={image.y4}
                        />
                    </div>
                </details>
            </div>
        {/each}

        <div>
            <label>
                <div>JPEG Quality:</div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    bind:value={quality}
                />
                <input type="number" min="0" max="100" bind:value={quality} />
            </label>
        </div>

        <div>
            <button
                on:click={generateImages}
                disabled={outputCount === 0 || !quadsDone || generating}
                title={errorMessage}
            >
                {#if generating}
                    Generating...
                {:else}
                    Generate {outputCount || ''} image(s)
                {/if}
            </button>
        </div>
        {#if download}
            <div>
                <a
                    bind:this={downloadLink}
                    href={download}
                    download="images.zip">Download</a
                >
            </div>
        {/if}
    </div>
</main>

<style>
    .form > * {
        padding: 0.5rem;
    }
    .image {
        padding: 1rem 0;
    }
    label {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
</style>
