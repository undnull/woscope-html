let audio_input = null;
let audio_player = null;
let audio_canvas = null;
let canvas_div = null;
let woscope_ctx = null;

// The canvas (supposedly the virtual oscilloscope
// screen) shall be centered and can be scrolled down
// to take almost all the on-screen space. Taking 95%
// of the window's inner height seems like a good idea.
const CANVAS_SIZE_WINDOWSCALE = 0.95;

const makeRGBA = function(hex) {
    const result = /^#?([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})/.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255.0,
        parseInt(result[2], 16) / 255.0,
        parseInt(result[3], 16) / 255.0,
        1.0
    ] : [0.0, 0.0, 0.0, 1.0];
};

const recreateCanvas = function() {
    if(audio_canvas !== null) {
        canvas_div.removeChild(audio_canvas);
        audio_canvas.remove();
    }

    audio_canvas = document.createElement("canvas");
    audio_canvas.id = "audio-canvas";
    audio_canvas.width = window.innerHeight * CANVAS_SIZE_WINDOWSCALE;
    audio_canvas.height = audio_canvas.width;
    canvas_div.appendChild(audio_canvas);
}

window.onload = function() {
    audio_input = document.getElementById("audio-input");
    audio_player = document.getElementById("audio-player");
    canvas_div = document.getElementById("slot-canvas");

    // This call ensures that the canvas is created,
    // so it "eats" a part of the page forcing browser
    // to unhide the scroll bar. Magic!
    recreateCanvas();

    audio_input.addEventListener("change", function() {
        URL.revokeObjectURL(audio_player.src);
        audio_player.src = URL.createObjectURL(audio_input.files[0]);
        audio_player.load();

        if(woscope_ctx !== null) {
            woscope_ctx.destroy();
            woscope_ctx = null;
        }

        // Dealing with WoScope's and WebGL's bullshit
        // regarding OpenGL context loss and subsequent
        // failures to create shader objects is the last
        // thing we should be worried about if we just
        // drop the current canvas and create a new one.
        recreateCanvas();

        woscope_ctx = woscope({
            canvas: audio_canvas,
            audio: audio_player,
            audioUrl: audio_player.src,
            color: makeRGBA(document.getElementById("beam-color").value),
            lineSize: document.getElementById("beam-width").value,
            callback: function() { audio_player.play(); },
            error: console.error
        });
    });

    // Ensure the canvas ALWAYS stays the required size
    // even if the client changes the page scale, this
    // reduces the amount of shit I have to go through
    // to achieve a simple yet practical look.
    window.addEventListener("resize", function() {
        if(audio_canvas !== null) {
            audio_canvas.width = window.innerHeight * CANVAS_SIZE_WINDOWSCALE;
            audio_canvas.height = audio_canvas.width;
        }
    });

    document.getElementById("beam-color").addEventListener("change", function(event) {
        if(woscope_ctx !== null) {
            woscope_ctx.color = makeRGBA(event.target.value);
            console.log("beam-color:", woscope_ctx.color);
        }
    });

    document.getElementById("beam-width").addEventListener("change", function(event) {
        if(woscope_ctx !== null) {
            woscope_ctx.lineSize = event.target.value;
            console.log("beam-width:", woscope_ctx.lineSize);
        }
    });
};
