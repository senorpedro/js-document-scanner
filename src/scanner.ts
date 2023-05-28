import cv from "@techstark/opencv-js";

/**
 * TODO
 *  - expose some nice easy-to-use API
 *  -
 */

// TODO find proper way to inject necessary HTHML
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<canvas id="canvasElement"></canvas>
`;

const videoElement = document.createElement("video");
videoElement.autoplay = true;

const canvasElement = document.getElementById(
  "canvasElement"
) as HTMLCanvasElement;

var constraints = {
  video: {
    width: { ideal: 4096 },
    height: { ideal: 2160 },
  },
};

// Get access to the camera stream
navigator.mediaDevices
  .getUserMedia(constraints)
  .then(function (stream) {
    // once we have the camera, we start detecting documents
    const settings = stream.getVideoTracks()[0].getSettings();
    console.log(
      `settings width = ${settings.width}px, height = ${settings.height}px`
    );
    videoElement.srcObject = stream;
    // videoElement.play();
  })
  .catch(function (error) {
    console.error("Error accessing the camera: ", error);
  });

let isStreaming = false;
videoElement.addEventListener("canplay", (ev) => {
  if (isStreaming) {
    return;
  }
  // video stream just started
  isStreaming = true;

  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  canvasElement.style.width = videoElement.videoWidth + "px";
  canvasElement.style.height = videoElement.videoHeight + "px";

  drawImage();
});

function drawImage() {
  const context = canvasElement.getContext("2d") as CanvasRenderingContext2D;

  // scale
  context.drawImage(videoElement, 0, 0);
  requestAnimationFrame(() => {
    drawImage();
  });
}
