import cv from "@techstark/opencv-js";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<canvas id="canvasElement"></canvas>
`;

let width = 320,
  height = 320;

const videoElement = document.createElement("video");

const canvasElement = document.getElementById(
  "canvasElement"
) as HTMLCanvasElement;

// Get access to the camera stream
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then(function (stream) {
    // once we have the camera, we start detecting documents
    videoElement.srcObject = stream;
    videoElement.play();
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

  height = videoElement.videoHeight / (videoElement.videoWidth / width);

  runDrawingHandler();
});

function runDrawingHandler() {
  requestAnimationFrame(() => {
    drawImage();
    runDrawingHandler();
  });
}

function drawImage() {
  const context = canvasElement.getContext("2d") as CanvasRenderingContext2D;
  console.log("drawing");
  if (width && height) {
    console.log("drawing");
    canvasElement.width = width;
    canvasElement.height = height;
    context.drawImage(videoElement, 0, 0, width, height);
  }
}
