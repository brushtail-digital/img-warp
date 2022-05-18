<script>
    import Image from './Image.svelte';
    import { generateImageZip } from './generate';
    import { readFile, sha256 } from './util';
    import { tick } from 'svelte';

    const stored = localStorage.getItem('img-warp');
    const saved = stored ? JSON.parse(stored) : { quads: {}, quality: 60 };

    let bgs;
    let fgs;
    let downloadLink;

    let images = [];
    let overlays = [];
    let generating = false;
    let download = null;
    let quality = saved.quality;

    function getQuad(hash) {
        return (
            saved.quads[hash] || {
                x1: null,
                y1: null,
                x2: null,
                y2: null,
                x3: null,
                y3: null,
                x4: null,
                y4: null,
            }
        );
    }

    function saveState() {
        for (const img of images) {
            saved.quads[img.hash] = {
                x1: img.x1,
                y1: img.y1,
                x2: img.x2,
                y2: img.y2,
                x3: img.x3,
                y3: img.y3,
                x4: img.x4,
                y4: img.y4,
            };
        }
        saved.quality = quality;
        console.log(saved);
        localStorage.setItem('img-warp', JSON.stringify(saved));
    }

    async function updateBackgrounds(files) {
        saveState();
        images = await Promise.all(
            files.map(async (file) => {
                const src = await readFile(file);
                const hash = await sha256(file);
                return {
                    file,
                    src,
                    hash,
                    ...getQuad(hash),
                };
            })
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
        if (download) {
            URL.revokeObjectURL(download);
        }
        download = null;
    }
    $: reset(bgs, fgs, images);
</script>

<svelte:window on:beforeunload={saveState} />

<main>
    <h1>Image Warping Tool</h1>

    <p>Developed by <a href="https://github.com/brushtail-digital/img-warp">Brushtail Digital</a>.</p>

    <p>
        Generates combinations of backgrounds with foregrounds projected onto a specific area.<br>Output images are named based on the background and foreground image filenames.
    </p>

    <h3>Step 1</h3>
    <p>Choose backgrounds and set destination quads by expanding each item and dragging the four points to the required locations.</p>

    <section>
        <label>
            <div>Backgrounds:</div>
            <input type="file" accept="image/*" bind:files={bgs} multiple />
        </label>
    </section>

    {#each images as image (image.file)}
        <section>
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
        </section>
    {/each}

    <h3>Step 2</h3>
    <p>Choose foreground images to be projected onto the backgrounds.</p>

    <section>
        <label>
            <div>Foregrounds:</div>
            <input type="file" accept="image/*" bind:files={fgs} multiple />
        </label>
    </section>

    <h3>Step 3</h3>
    <p>Set output quality and generate images.</p>

    <section>
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
    </section>

    <section>
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
    </section>

    {#if download}
        <section>
            <a bind:this={downloadLink} href={download} download="images.zip"
                >Download</a
            >
        </section>
    {/if}
</main>

<style>
    section {
        padding: 0.5rem 1rem;
    }

    .image {
        padding: 1rem 0;
    }

    label {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    summary {
        cursor: pointer;
    }
</style>
