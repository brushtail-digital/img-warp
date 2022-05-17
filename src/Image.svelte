<script>
    import { onMount } from 'svelte';
    export let src;
    export let alt = '';

    export let x1 = null;
    export let y1 = null;
    export let x2 = null;
    export let y2 = null;
    export let x3 = null;
    export let y3 = null;
    export let x4 = null;
    export let y4 = null;

    let image;
    let width = null;
    let height = null;

    onMount(() => {
        image.onload = () => {
            width = image.naturalWidth;
            height = image.naturalHeight;
        };
    });

    function reset() {
        width = null;
        height = null;
    }

    $: reset(src);

    $: cx1 = width !== null && x1 === null ? width / 4 : x1;
    $: cy1 = height !== null && y1 === null ? height / 4 : y1;
    $: cx2 = width !== null && x2 === null ? (3 * width) / 4 : x2;
    $: cy2 = height !== null && y2 === null ? height / 4 : y2;
    $: cx3 = width !== null && x3 === null ? (3 * width) / 4 : x3;
    $: cy3 = height !== null && y3 === null ? (3 * height) / 4 : y3;
    $: cx4 = width !== null && x4 === null ? width / 4 : x4;
    $: cy4 = height !== null && y4 === null ? (3 * height) / 4 : y4;

    let draggingAnchor = null;

    function dragStart(e, anchor) {
        const div = e.target;
        const { left, top, right, bottom } = div.getBoundingClientRect();
        draggingAnchor = {
            anchor,
            offsetX: (left + right) / 2 - e.clientX,
            offsetY: (top + bottom) / 2 - e.clientY,
        };
    }

    function dragMove(e) {
        if (!image || !draggingAnchor) {
            return;
        }
        const { left, top } = image.getBoundingClientRect();
        const { anchor, offsetX, offsetY } = draggingAnchor;

        const x = Math.max(0, Math.min(e.clientX - left + offsetX, width));
        const y = Math.max(0, Math.min(e.clientY - top + offsetY, height));

        switch (anchor) {
            case 0:
                x1 = x;
                y1 = y;
                break;
            case 1:
                x2 = x;
                y2 = y;
                break;
            case 2:
                x3 = x;
                y3 = y;
                break;
            case 3:
                x4 = x;
                y4 = y;
                break;
        }
    }

    function dragEnd(e) {
        draggingAnchor = null;
    }
</script>

<div class="wrapper">
    <img bind:this={image} {src} {alt} />
    {#if width !== null && height !== null}
        <div
            class="anchor"
            class:done={x1 !== null && y1 !== null}
            style:left="{cx1}px"
            style:top="{cy1}px"
            title="Top-left"
            on:mousedown={(e) => dragStart(e, 0)}
        />
        <div
            class="anchor"
            class:done={x2 !== null && y2 !== null}
            style:left="{cx2}px"
            style:top="{cy2}px"
            title="Top-right"
            on:mousedown={(e) => dragStart(e, 1)}
        />
        <div
            class="anchor"
            class:done={x3 !== null && y3 !== null}
            style:left="{cx3}px"
            style:top="{cy3}px"
            title="Bottom-right"
            on:mousedown={(e) => dragStart(e, 2)}
        />
        <div
            class="anchor"
            class:done={x4 !== null && y4 !== null}
            style:left="{cx4}px"
            style:top="{cy4}px"
            title="Bottom-left"
            on:mousedown={(e) => dragStart(e, 3)}
        />
    {/if}
</div>

<svelte:window on:mousemove={dragMove} on:mouseup={dragEnd} />

<style>
    .wrapper {
        position: relative;
        user-select: none;
    }

    img {
        image-rendering: crisp-edges;
        pointer-events: none;
    }

    .anchor {
        position: absolute;
        width: 12px;
        height: 12px;
        transform: translate(-6px, -6px);
        border: solid 1px #ff0000;
        border-radius: 6px;
        background: transparent;
        cursor: grab;
    }

    .done {
        border-color: #029aff;
    }
</style>
