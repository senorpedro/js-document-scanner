import cv from "@techstark/opencv-js";
import { Rect } from "./opencv-helper";

export class CanvasHelper {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  rectangle: Rect | null = null;
  dragHandleRadius = 20;
  strokeColor = "rgba(0, 0, 255, 0.6)";
  fillColor = "rgba(0, 0, 255, 0.1)";

  selectedDragHandle: cv.Point | null = null;
  dragHandleStartX: number | null = null;
  dragHandleStartY: number | null = null;
  image: cv.Mat | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  drawRectangle(rectangle: Rect) {
    this.rectangle = rectangle;
    const { p1, p2, p3, p4 } = rectangle;
    const ctx = this.context;

    // paint rectangle
    ctx.strokeStyle = this.strokeColor;
    ctx.fillStyle = this.fillColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    ctx.closePath();

    // Fill the trapezoid with the defined color
    ctx.fill();
  }

  startDragMode() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);

    this.drawDragHandles();
  }

  endDragMode() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
  }

  drawDragHandles() {
    const { p1, p2, p3, p4 } = this.rectangle as Rect;

    // Draw drag handles
    this.drawDragHandle(p1.x, p1.y);
    this.drawDragHandle(p2.x, p2.y);
    this.drawDragHandle(p3.x, p3.y);
    this.drawDragHandle(p4.x, p4.y);
  }

  drawDragHandle(x: number, y: number) {
    const ctx = this.context;
    ctx.beginPath();
    ctx.arc(x, y, this.dragHandleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = this.strokeColor;
    ctx.fill();
    ctx.closePath();
  }

  handleMouseDown = (event: MouseEvent) => {
    const mouseX = event.clientX - this.canvas.offsetLeft;
    const mouseY = event.clientY - this.canvas.offsetTop;

    // Check if any drag handle is selected
    if (this.isInsideDragHandles(event)) {
      this.selectedDragHandle = { x: mouseX, y: mouseY };
      this.dragHandleStartX = mouseX;
      this.dragHandleStartY = mouseY;
    }
  };

  // Handle Mouse Move Event
  handleMouseMove = (event: MouseEvent) => {
    if (this.isInsideDragHandles(event)) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "auto";
    }

    if (this.selectedDragHandle) {
      const mouseX = event.clientX - this.canvas.offsetLeft;
      const mouseY = event.clientY - this.canvas.offsetTop;

      const offsetX = mouseX - this.selectedDragHandle.x;
      const offsetY = mouseY - this.selectedDragHandle.y;

      const { p1, p2, p3, p4 } = this.rectangle as Rect;

      const inDragHandle = (p1: cv.Point, p2: cv.Point) =>
        this.isInsideDragHandle(p1.x, p1.y, p2);

      // Update rectangle dimensions based on drag handle being dragged
      if (inDragHandle(this.selectedDragHandle, p1)) {
        p1.x += offsetX;
        p1.y += offsetY;
      } else if (inDragHandle(this.selectedDragHandle, p2)) {
        p2.x += offsetX;
        p2.y += offsetY;
      } else if (inDragHandle(this.selectedDragHandle, p3)) {
        p3.x += offsetX;
        p3.y += offsetY;
      } else if (inDragHandle(this.selectedDragHandle, p4)) {
        p4.x += offsetX;
        p4.y += offsetY;
      }

      // Update selected drag handle position
      this.selectedDragHandle.x = mouseX;
      this.selectedDragHandle.y = mouseY;

      this.rectangle = { p1, p2, p3, p4 };

      // Redraw canvas
      this.drawCanvas(this.image!, this.rectangle, true);
    }
  };

  drawCanvas(image: cv.Mat, rectangle: Rect | null, showDragHandles = false) {
    this.image = image;
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // XXX cv.imshow does set canvas height and width,
    //     so maybe it makes sense to use a tmp canvas
    //     that is not attached to the DOM here
    /*
    const tmpCanvas = document.createElement("canvas");
    cv.imshow(tmpCanvas, image);

    this.context.drawImage(tmpCanvas, 0, 0);
    */
    cv.imshow(this.canvas, image);

    if (rectangle) {
      this.rectangle = rectangle;
      this.drawRectangle(rectangle);
    }

    if (showDragHandles) {
      this.drawDragHandles();
    }
  }

  // Handle Mouse Up Event
  handleMouseUp = () => {
    this.selectedDragHandle = null;
  };

  isInsideDragHandles(ev: MouseEvent) {
    const mouseX = ev.clientX - this.canvas.offsetLeft;
    const mouseY = ev.clientY - this.canvas.offsetTop;

    const { p1, p2, p3, p4 } = this.rectangle as Rect;
    // Check if any drag handle is selected
    return (
      this.isInsideDragHandle(mouseX, mouseY, p1) ||
      this.isInsideDragHandle(mouseX, mouseY, p2) ||
      this.isInsideDragHandle(mouseX, mouseY, p3) ||
      this.isInsideDragHandle(mouseX, mouseY, p4)
    );
  }

  // Check if Point is Inside Drag Handle
  isInsideDragHandle(
    x: number,
    y: number,
    { x: dragHandleX, y: dragHandleY }: cv.Point
  ) {
    return (
      x >= dragHandleX - this.dragHandleRadius &&
      x <= dragHandleX + this.dragHandleRadius &&
      y >= dragHandleY - this.dragHandleRadius &&
      y <= dragHandleY + this.dragHandleRadius
    );
  }
}
