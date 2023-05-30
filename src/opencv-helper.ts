/**
 * heavily inspired from
 * https://github.com/ColonelParrot/jscanify/blob/master/src/jscanify.js
 *
 */
import cv from "@techstark/opencv-js";

export type Rect = {
  p1: cv.Point;
  p2: cv.Point;
  p3: cv.Point;
  p4: cv.Point;
};

function distance(p1: cv.Point, p2: cv.Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function getDocumentContour(img: cv.Mat): cv.Mat {
  const imgGray = new cv.Mat();
  cv.cvtColor(img, imgGray, cv.COLOR_RGBA2GRAY);

  const imgBlur = new cv.Mat();
  cv.GaussianBlur(imgGray, imgBlur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

  const imgThresh = new cv.Mat();
  cv.threshold(imgBlur, imgThresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(
    imgThresh,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_SIMPLE
  );
  let largestArea = 0;
  let largestContourIdx = -1;
  for (let i = 0; i < contours.size(); ++i) {
    let area = cv.contourArea(contours.get(i));
    if (area > largestArea) {
      largestArea = area;
      largestContourIdx = i;
    }
  }

  //
  const largestContour = contours.get(largestContourIdx);

  imgGray.delete();
  imgBlur.delete();
  imgThresh.delete();
  contours.delete();
  hierarchy.delete();
  return largestContour;
}

/**
 * Extracts and undistorts the image detected within the frame.
 * @param image image to process
 * @param resultWidth desired result paper width
 * @param resultHeight desired result paper height
 * @param cornerPoints optional custom corner points, in case automatic corner points are incorrect
 * @returns `HTMLCanvasElement` containing undistorted image
 */
export function extractDocument(
  image: cv.Mat,
  resultWidth: number,
  resultHeight: number,
  rect: Rect
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  const { p1, p2, p3, p4 } = rect;

  let warpedDst = new cv.Mat();

  let dsize = new cv.Size(resultWidth, resultHeight);
  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    p1.x,
    p1.y,
    p2.x,
    p2.y,
    p3.x,
    p3.y,
    p4.x,
    p4.y,
  ]);

  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    resultWidth,
    0,
    0,
    resultHeight,
    resultWidth,
    resultHeight,
  ]);

  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(
    image,
    warpedDst,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );

  cv.imshow(canvas, warpedDst);

  image.delete();
  warpedDst.delete();
  return canvas;
}

export function scanImage(image: cv.Mat): Rect | null {
  const contour = getDocumentContour(image);
  return contour ? getRect(contour) : null;
}

export function getRect(contour: cv.Mat): Rect | null {
  let rect = cv.minAreaRect(contour);
  const center = rect.center;

  let p1,
    p2,
    p3,
    p4,
    p1Dist = 0,
    p2Dist = 0,
    p3Dist = 0,
    p4Dist = 0;

  for (let i = 0; i < contour.data32S.length; i += 2) {
    const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };
    const dist = distance(point, center);
    if (point.x < center.x && point.y < center.y) {
      if (dist > p1Dist) {
        p1 = point;
        p1Dist = dist;
      }
    } else if (point.x > center.x && point.y < center.y) {
      if (dist > p2Dist) {
        p2 = point;
        p2Dist = dist;
      }
    } else if (point.x < center.x && point.y > center.y) {
      // bottom left
      if (dist > p3Dist) {
        p3 = point;
        p3Dist = dist;
      }
    } else if (point.x > center.x && point.y > center.y) {
      // bottom right
      if (dist > p4Dist) {
        p4 = point;
        p4Dist = dist;
      }
    }
  }
  return p1 && p2 && p3 && p4
    ? {
        p1,
        p2,
        p3,
        p4,
      }
    : null;
}
