import cv from "@techstark/opencv-js";
import { Rect, extractDocument, scanImage } from "./opencv-helper";
import { CanvasHelper } from "./canvas-helper";

/**
 * TODO
 *  - expose some nice easy-to-use API
 *    - pass scanned document image to outside
 *    - expose canvas that displays scanning-feed
 *    - customize drag-handles etc
 */

/**
 * TODO find proper way to inject necessary HTHML
 * - pass in canvas
 * - pass in options for line color, thickness etc
 * - expose handlers for switching mode (auto, manual) and cutting document
 *  (call callback with image as blob etc)
 */

const videoElement = document.createElement("video");
videoElement.autoplay = true;

/**
 * we need 2 canvas elements
 *  - one for getting the image:
 *    stream -> video element -> canvas element -> image
 *  - second one for displaying the image once processed by
 *    open CV
 * TODO is there no simpler way to do this???
 */
const canvasForGettingImage = document.createElement("canvas");
const displayCanvas = document.getElementById(
  "displayCanvas"
) as HTMLCanvasElement;

const constraints = {
  video: {
    width: { ideal: 4096 },
    height: { ideal: 2160 },
  },
};

type Mode = "auto" | "manual";
let currentMode: Mode = "auto";
let isStreaming = false;
let contextForGettingImage: CanvasRenderingContext2D;
let canvasHelper: CanvasHelper;
let currentImage: cv.Mat;
let currentRectangle: Rect | null;

// Get access to the camera stream
navigator.mediaDevices
  .getUserMedia(constraints)
  .then(function (stream) {
    videoElement.srcObject = stream;
  })
  .catch(function (error) {
    console.error("Error accessing the camera: ", error);
  });

videoElement.addEventListener("canplay", () => {
  if (isStreaming) {
    return;
  }
  // video stream just started
  isStreaming = true;

  // setup canvas elements
  /*
  displayCanvas.width = videoElement.videoWidth;
  displayCanvas.height = videoElement.videoHeight;
  displayCanvas.style.width = videoElement.videoWidth + "px";
  displayCanvas.style.height = videoElement.videoHeight + "px";
  */

  canvasForGettingImage.width = videoElement.videoWidth;
  canvasForGettingImage.height = videoElement.videoHeight;
  canvasForGettingImage.style.width = videoElement.videoWidth + "px";
  canvasForGettingImage.style.height = videoElement.videoHeight + "px";

  contextForGettingImage = canvasForGettingImage.getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;

  canvasHelper = new CanvasHelper(displayCanvas);

  nextTick();
});

function nextTick() {
  if (currentMode !== "auto") {
    // stop ticking
    return;
  }
  contextForGettingImage.drawImage(videoElement, 0, 0);

  // delete last image explicitely, otherwise memory consumption explodes
  currentImage && currentImage.delete();

  currentImage = cv.imread(canvasForGettingImage);

  currentRectangle = scanImage(currentImage);

  canvasHelper.drawCanvas(currentImage, currentRectangle);

  // delay next execution a bit to allow system to calculate everything
  setTimeout(() => {
    requestAnimationFrame(() => {
      nextTick();
    });
  }, 100);
}

interface OptionalOptions {
  lineColor: string;
  fillColor: string;
  lineThickness: number;
  dragHandleRadius: number;
}

interface Options extends Partial<OptionalOptions> {
  canvas: HTMLCanvasElement;
}

const defaultOpts: OptionalOptions = {
  lineColor: "rgba(0, 0, 255, 0.6)",
  fillColor: "rgba(0, 0, 255, 0.1)",
  lineThickness: 4,
  dragHandleRadius: 20,
};

export class TsDocScan {
  private opts: Options;

  constructor(opts: Options) {
    this.opts = Object.assign({}, defaultOpts, opts);
  }

  toggleMode(): Mode {
    if (currentMode === "auto") {
      currentMode = "manual";
      // switchModeButton.innerHTML = "Auto Scan Mode";
      canvasHelper.startDragMode();
    } else if (currentMode === "manual") {
      currentMode = "auto";
      // switchModeButton.innerHTML = "Manual Mode";
      canvasHelper.endDragMode();
      nextTick();
    }

    return currentMode;
  }

  /**
   * extracts document in selected rectangle
   */
  extractDocument(width: number, height: number): HTMLCanvasElement | null {
    if (currentImage && currentRectangle) {
      return extractDocument(currentImage, width, height, currentRectangle);
    }
    return null;
  }
}
