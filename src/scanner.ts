import cv from "@techstark/opencv-js";

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

  drawImage();
});

function drawImage() {
  const contextForGettingImage = canvasForGettingImage.getContext(
    "2d"
  ) as CanvasRenderingContext2D;
  contextForGettingImage.drawImage(videoElement, 0, 0);

  const image = cv.imread(canvasForGettingImage);

  detectDocument(image);
  cv.imshow(canvasElement, image);

  /* 
  const contextForDisplay = canvasElement.getContext(
    "2d"
  ) as CanvasRenderingContext2D;

  const image = new Image();
  image.src = img;
  contextForDisplay.drawImage(image, 0, 0);
  */

  requestAnimationFrame(() => {
    drawImage();
  });
}

function detectDocument(image: cv.Mat) {
  // Convert the image to grayscale
  const gray = new cv.Mat();
  cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY, 0);

  // Apply Gaussian blur to reduce noise
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

  // Perform edge detection using Canny algorithm
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 50, 150);

  // Find contours in the image
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(
    edges,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  // Iterate over the contours and find rectangles
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const perimeter = cv.arcLength(contour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

    // Check if the contour is rectangular
    if (approx.size().height === 4) {
      // XXX if we found something, we need to extract the
      // found document, stop scanning and display the document
      // bigger

      // Draw a green rectangle around the detected object
      const rect = cv.boundingRect(approx);

      const point1 = new cv.Point(rect.x, rect.y);
      const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);

      cv.rectangle(image, point1, point2, [255, 0, 0, 255], 2);
    }
  }

  // Display the result
  gray.delete();
  blurred.delete();
  edges.delete();
  contours.delete();
  hierarchy.delete();
}
