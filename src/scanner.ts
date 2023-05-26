document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<video id="videoElement" autoplay><video>
`;
// Get access to the camera stream
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then(function (stream) {
    var videoElement = document.getElementById("videoElement");
    videoElement.srcObject = stream;
  })
  .catch(function (error) {
    console.error("Error accessing the camera: ", error);
  });
