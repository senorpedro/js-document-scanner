import cv from "@techstark/opencv-js";
import { Rect, getDocumentContour, getRect } from "./opencv-helper";
import { CanvasHelper, drawRectangle } from "./canvas-helper";

/**
 * TODO
 *  - expose some nice easy-to-use API
 *    - pass scanned document image to outside
 *    - expose canvas that displays scanning-feed
 *    - customize drag-handles etc
 *
 */

// TODO find proper way to inject necessary HTHML
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<canvas id="displayCanvas"></canvas>
<div>
  <button id="switchMode">Scan</button>
</div>
`;

const videoElement = document.createElement("video");
videoElement.autoplay = true;

const button = document.querySelector("#switchMode");
button?.addEventListener("click", (ev) => {
  if (currentMode === "scanning") {
    currentMode = "editing";
    button.innerHTML = "Start";
    canvasHelper.startDragMode();
  } else if (currentMode === "editing") {
    currentMode = "scanning";
    button.innerHTML = "Scan";
    canvasHelper.endDragMode();
    detectDocument();
  }
});

/**
 * we need 2 canvas elements
 *  - one for getting the image:
 *    stream -> video element -> canvas element -> image
 *  - second one for displaying the image once processed by
 *    open CV
 * TODO is there not simpler way to do this???
 */
const canvasForGettingImage = document.createElement("canvas");
const displayCanvas = document.getElementById(
  "displayCanvas"
) as HTMLCanvasElement;

var constraints = {
  video: {
    width: { ideal: 4096 },
    height: { ideal: 2160 },
  },
};

type Mode = "scanning" | "editing";
let currentMode: Mode = "scanning";

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
let contextForGettingImage: CanvasRenderingContext2D;
let canvasHelper: CanvasHelper;
videoElement.addEventListener("canplay", () => {
  if (isStreaming) {
    return;
  }
  // video stream just started
  isStreaming = true;

  displayCanvas.width = videoElement.videoWidth;
  displayCanvas.height = videoElement.videoHeight;
  displayCanvas.style.width = videoElement.videoWidth + "px";
  displayCanvas.style.height = videoElement.videoHeight + "px";

  canvasForGettingImage.width = videoElement.videoWidth;
  canvasForGettingImage.height = videoElement.videoHeight;
  canvasForGettingImage.style.width = videoElement.videoWidth + "px";
  canvasForGettingImage.style.height = videoElement.videoHeight + "px";

  contextForGettingImage = canvasForGettingImage.getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;

  canvasHelper = new CanvasHelper(displayCanvas);

  detectDocument();
});

function detectDocument() {
  if (currentMode !== "scanning") {
    return;
  }
  contextForGettingImage.drawImage(videoElement, 0, 0);

  const image = cv.imread(canvasForGettingImage);

  const contour = getDocumentContour(image);
  cv.imshow(displayCanvas, image);

  if (contour) {
    // draw rectangle if there are points
    // XXX if rectangle hasn't changed for 1s then freeze image
    const rectangle = getRect(contour);

    if (rectangle) {
      canvasHelper.drawRectangle(rectangle);
    }
  }

  // delay next execution a bit to allow system to calculate everything
  setTimeout(() => {
    requestAnimationFrame(() => {
      detectDocument();
    });
  }, 100);
}
