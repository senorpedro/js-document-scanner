import cv from "@techstark/opencv-js";
import { getDocumentContour, getRect } from "./helper";

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
<canvas id="canvasElement"></canvas>
`;

const videoElement = document.createElement("video");
videoElement.autoplay = true;

/**
 * we need 2 canvas elements
 *  - one for getting the image:
 *    stream -> video element -> canvas element -> image
 *  - second one for displaying the image once processed by
 *    open CV
 * TODO is there not simpler way to do this???
 */
const canvasForGettingImage = document.createElement("canvas");
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
let contextForGettingImage: CanvasRenderingContext2D;
let contextForDisplay: CanvasRenderingContext2D;
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

  canvasForGettingImage.width = videoElement.videoWidth;
  canvasForGettingImage.height = videoElement.videoHeight;
  canvasForGettingImage.style.width = videoElement.videoWidth + "px";
  canvasForGettingImage.style.height = videoElement.videoHeight + "px";

  contextForGettingImage = canvasForGettingImage.getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;

  contextForDisplay = canvasElement.getContext(
    "2d"
  ) as CanvasRenderingContext2D;

  drawImage();
});

function drawImage() {
  contextForGettingImage.drawImage(videoElement, 0, 0);

  const image = cv.imread(canvasForGettingImage);

  const contour = getDocumentContour(image);
  cv.imshow(canvasElement, image);

  if (contour) {
    // draw rectangle if there are points
    // XXX if rectangle hasn't changed for 1s then freeze image
    const points = getRect(contour);

    if (points) {
      const { p1, p2, p3, p4 } = points;
      console.log("earwer");

      contextForDisplay.strokeStyle = "green";
      contextForDisplay.lineWidth = 2;
      contextForDisplay.beginPath();
      contextForDisplay.moveTo(p1.x, p1.y);
      contextForDisplay.lineTo(p2.x, p2.y);
      contextForDisplay.lineTo(p4.x, p4.y);
      contextForDisplay.lineTo(p3.x, p3.y);
      contextForDisplay.lineTo(p1.x, p1.y);
      contextForDisplay.stroke();
    }
  }

  // delay next execution a bit to allow system to calculate everything
  setTimeout(() => {
    requestAnimationFrame(() => {
      drawImage();
    });
  }, 100);
}
