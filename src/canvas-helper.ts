import cv from "@techstark/opencv-js";
import { Rect } from "./opencv-helper";

// Drag Handle Properties

export class CanvasHelper {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  rectangle: Rect | null = null;
  dragHandleRadius = 20;
  dragHandleColor = "rgba(255, 0, 0, 0.8)";
  selectedDragHandle: cv.Point | null = null;
  dragHandleStartX: number | null = null;
  dragHandleStartY: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  drawRectangle(rectangle: Rect) {
    this.rectangle = rectangle;
    const { p1, p2, p3, p4 } = rectangle;
    const ctx = this.context;

    // paint rectangle
    ctx.strokeStyle = "red";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  startDragMode() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);

    const { p1, p2, p3, p4 } = this.rectangle as Rect;

    // Draw drag handles
    this.drawDragHandle(p1.x, p1.y);
    this.drawDragHandle(p2.x, p2.y);
    this.drawDragHandle(p3.x, p3.y);
    this.drawDragHandle(p4.x, p4.y);
  }

  endDragMode() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
  }

  drawDragHandle(x: number, y: number) {
    const ctx = this.context;
    ctx.beginPath();
    ctx.arc(x, y, this.dragHandleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = this.dragHandleColor;
    ctx.fill();
    ctx.closePath();
  }

  handleMouseDown = (event: MouseEvent) => {
    const mouseX = event.clientX - this.canvas.offsetLeft;
    const mouseY = event.clientY - this.canvas.offsetTop;

    const { p1, p2, p3, p4 } = this.rectangle as Rect;
    // Check if any drag handle is selected
    if (
      this.isInsideDragHandle(mouseX, mouseY, p1) ||
      this.isInsideDragHandle(mouseX, mouseY, p2) ||
      this.isInsideDragHandle(mouseX, mouseY, p3) ||
      this.isInsideDragHandle(mouseX, mouseY, p4)
    ) {
      this.selectedDragHandle = { x: mouseX, y: mouseY };
      this.dragHandleStartX = mouseX;
      this.dragHandleStartY = mouseY;
    }
  };

  // Handle Mouse Move Event
  handleMouseMove = (event: MouseEvent) => {
    if (this.selectedDragHandle) {
      const mouseX = event.clientX - this.canvas.offsetLeft;
      const mouseY = event.clientY - this.canvas.offsetTop;

      const offsetX = mouseX - this.selectedDragHandle.x;
      const offsetY = mouseY - this.selectedDragHandle.y;

      const { p1, p2, p3, p4 } = this.rectangle as Rect;

      const samePoint = (p1: cv.Point, p2: cv.Point): boolean =>
        p1.x === p2.x && p1.y === p2.y;

      // Update rectangle dimensions based on drag handle being dragged
      if (samePoint(this.selectedDragHandle, p1)) {
        p1.x += offsetX;
        p1.y += offsetY;
      } else if (samePoint(this.selectedDragHandle, p2)) {
        p2.x += offsetX;
        p2.y += offsetY;
      } else if (samePoint(this.selectedDragHandle, p3)) {
        p3.x += offsetX;
        p3.y += offsetY;
      } else if (samePoint(this.selectedDragHandle, p4)) {
        p4.x += offsetX;
        p4.y += offsetY;
      }

      // Update selected drag handle position
      this.selectedDragHandle.x = mouseX;
      this.selectedDragHandle.y = mouseY;

      this.rectangle = { p1, p2, p3, p4 };

      // Redraw canvas
      // drawCanvas();
    }
  };

  // Handle Mouse Up Event
  handleMouseUp = () => {
    this.selectedDragHandle = null;
  };

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
